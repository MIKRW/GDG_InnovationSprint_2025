
'use server';

import { revalidateTag } from 'next/cache';
import { ref as storageRef, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, orderBy, runTransaction, writeBatch } from 'firebase/firestore';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { TestAudioMetadata, BirdLog, PromptSystem, PromptVersion, AppAIVersion, AppAIConfig, PromptContent, AnalysisRun, AppMode } from './types';
import { EmailAuthProvider, linkWithCredential, type User } from 'firebase/auth';
import { kebabCase } from 'lodash';
import { cache } from 'react';


interface UploadMasterAudioInput {
    birdId: string; // e.g., 'australian-magpie'
    commonName: string;
    scientificName: string;
    genus: string;
    species: string;
    family: string;
    order: string;
    audioFile: string; // data URI
    audioFileName: string;
    description: string;
    duration: number;
    sourceUrl?: string;
    author?: string;
    license?: string;
    hardware?: string;
    location?: string;
}

export async function uploadMasterAudio(data: UploadMasterAudioInput): Promise<TestAudioMetadata> {
    const { 
        birdId, commonName, scientificName, genus, species, family, order, 
        audioFile, audioFileName, description, duration,
        sourceUrl = '', author = '', license = '', hardware = '', location = ''
    } = data;

    // 1. Upload audio file to Firebase Storage
    const audioId = uuidv4();
    const uniqueFileName = `${audioId}-${audioFileName}`;
    const filePath = `master-audio/${birdId}/${uniqueFileName}`;
    const fileRef = storageRef(storage, filePath);

    // Convert data URI to blob
    const fetchResponse = await fetch(audioFile);
    const blob = await fetchResponse.blob();
    
    await uploadBytes(fileRef, blob);
    await getDownloadURL(fileRef);

    // 2. Create or update the bird document in Firestore
    const birdDocRef = doc(db, 'birds', birdId);
    const birdDocSnap = await getDoc(birdDocRef);

    const newMasterAudioFile = {
        audioId: audioId,
        fileName: commonName,
        storagePath: filePath,
        description: description,
        duration: duration,
        sourceUrl: sourceUrl,
        author: author,
        license: license,
        hardware: hardware,
        location: location,
    };

    if (birdDocSnap.exists()) {
        // Bird exists, update the masterAudioFiles array
        await updateDoc(birdDocRef, {
            masterAudioFiles: arrayUnion(newMasterAudioFile)
        });
    } else {
        // Bird doesn't exist, create a new document
        await setDoc(birdDocRef, {
            commonName: commonName,
            scientificName: scientificName,
            genus: genus,
            species: species,
            family: family,
            order: order,
            masterAudioFiles: [newMasterAudioFile]
        });
    }
    
    // 3. Return the metadata for immediate use
    return {
        id: audioId,
        fileName: commonName,
        storagePath: filePath,
        description: description,
        sourceUrl: sourceUrl,
        author: author,
        license: license,
        hardware: hardware,
        location: location,
        birdId: birdId,
        testAudioId: audioId,
        genus: genus,
        species: species,
        scientificName: scientificName,
        family: family,
        order: order,
        duration: duration,
    };
}

interface RegisterUserInput {
    email: string;
    pass: string;
}

export async function upgradeAnonymousUser(currentUser: User, { email, pass }: RegisterUserInput) {
    if (!currentUser || !currentUser.isAnonymous) {
        throw new Error("No anonymous user is currently signed in.");
    }
    
    try {
        const credential = EmailAuthProvider.credential(email, pass);
        const userCredential = await linkWithCredential(currentUser, credential);
        return { success: true, user: userCredential.user };
    } catch (error: any) {
        console.error("Error upgrading anonymous user:", error.code, error.message);
        return { success: false, error: { code: error.code, message: error.message } };
    }
}


export async function trashLog(log: BirdLog) {
    const userLogRef = doc(db, 'users', log.userId, 'identifications', log.id);
    await updateDoc(userLogRef, { status: 'trashed' });

    return { success: true };
}


export async function saveCanonicalImage(
    commonName: string,
    scientificName: string,
    imageDataUri: string,
    imageType: 'key' | 'side_profile' | 'male' | 'female' = 'key'
): Promise<string> {
    const birdId = kebabCase(commonName);
    const imagePath = `canonical-images/${birdId}/${imageType}-${uuidv4()}.jpg`;
    const imageFileRef = storageRef(storage, imagePath);

    await uploadString(imageFileRef, imageDataUri, 'data_url');
    const downloadURL = await getDownloadURL(imageFileRef);

    const birdDocRef = doc(db, 'birds', birdId);
    
    const updateData = {
        commonName,
        scientificName,
        canonicalImageUrls: {
            [imageType]: downloadURL,
        }
    };

    await setDoc(birdDocRef, updateData, { merge: true });

    return downloadURL;
}

export async function createAnalysisRun(
    userId: string,
    audioStoragePath: string,
    aiResult: any,
    wasSuccessful: boolean,
    locationData: any,
    hardware: string | null,
    mode: AppMode,
    isDeveloperRun: boolean,
    testContext?: { birdId: string; testAudioId: string },
    analysisTimings: AnalysisRun['analysisTimings'] = {},
    sessionId?: string,
    timestamp?: string,
  ) {
    
    const analysisRunId = uuidv4();
    const collectionName = isDeveloperRun ? 'all_test_runs' : 'all_analysis_runs';
    const analysisRunRef = doc(db, collectionName, analysisRunId);

    const fileRef = storageRef(storage, audioStoragePath);
    const inputAudioUrl = await getDownloadURL(fileRef);

    const docToCreate: Partial<AnalysisRun> = {
      id: analysisRunId,
      timestamp: timestamp!,
      userId: userId,
      sessionId: sessionId!,
      inputAudioUrl: inputAudioUrl,
      inputAudioStoragePath: audioStoragePath,
      locationData: {
        latitude: locationData?.latitude ?? null,
        longitude: locationData?.longitude ?? null,
        locationDescription: locationData?.locationDescription ?? null,
      },
      analysisMethod: aiResult.promptVersion || 'unknown',
      aiResult: aiResult,
      wasSuccessful: wasSuccessful,
      wasSavedByUser: false,
      mode: mode,
      isDeveloperData: isDeveloperRun,
      analysisTimings: analysisTimings,
    };
    
    // Only add recordingLengthSeconds if it's a valid number
    if (typeof aiResult.duration === 'number') {
        docToCreate.recordingLengthSeconds = aiResult.duration;
    }
    
    if (hardware) {
        docToCreate.hardware = hardware;
    }
    if (isDeveloperRun && testContext) {
      docToCreate.birdId = testContext.birdId;
      docToCreate.testAudioId = testContext.testAudioId;
    }

    await setDoc(analysisRunRef, docToCreate);
    return analysisRunId;
  }
