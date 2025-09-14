

'use server';

import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { TestAudioMetadata, BirdLog } from './types';
import { EmailAuthProvider, linkWithCredential, type User } from 'firebase/auth';


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
    sourceUrl?: string;
    author?: string;
    license?: string;
    hardware?: string;
    location?: string;
}

export async function uploadMasterAudio(data: UploadMasterAudioInput): Promise<TestAudioMetadata> {
    const { 
        birdId, commonName, scientificName, genus, species, family, order, 
        audioFile, audioFileName, description,
        sourceUrl = '', author = '', license = '', hardware = '', location = ''
    } = data;

    // 1. Upload audio file to Firebase Storage
    const audioId = uuidv4();
    const filePath = `master-audio/${birdId}/${audioId}-${audioFileName}`;
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
        storagePath: filePath,
        description: description,
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
        fileName: audioFileName,
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
        order: order
    };
}

interface RegisterUserInput {
    email: string;
    pass: string;
}

// This server action cannot be called from the client directly because it needs the `currentUser` object,
// which is only available on the client. It must be called from another client-aware component or hook.
// This is a common pattern in Next.js with Firebase.
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


export async function deleteLog(log: BirdLog, user: User) {
    if (!user || user.uid !== log.userId) {
        throw new Error("Permission denied. You can only delete your own logs.");
    }

    const LOW_QUALITY_THRESHOLD = 40;

    // 1. Always delete the user-facing log
    const userLogRef = doc(db, 'users', user.uid, 'identifications', log.id);

    // 2. Reference the internal analysis run document
    const analysisRunRef = doc(db, 'all_analysis_runs', log.analysisRunId);
    const analysisRunSnap = await getDoc(analysisRunRef);

    if (!analysisRunSnap.exists()) {
        // If the analysis run doesn't exist, just delete the user log and finish.
        await deleteDoc(userLogRef);
        console.warn(`Analysis run ${log.analysisRunId} not found. Deleting user log only.`);
        return { success: true };
    }

    const analysisData = analysisRunSnap.data();

    // 3. Apply deletion logic based on user type
    if (user.isAnonymous && (analysisData.dataQualityScore < LOW_QUALITY_THRESHOLD)) {
        // HARD DELETE for low-quality anonymous data
        const batch = writeBatch(db);

        // Delete Firestore documents
        batch.delete(userLogRef);
        batch.delete(analysisRunRef);

        // Delete audio file from Storage
        if (analysisData.inputAudioStoragePath) {
             const fileRef = storageRef(storage, analysisData.inputAudioStoragePath);
             await deleteObject(fileRef);
        }
        
        await batch.commit();

    } else {
        // SOFT DELETE for registered users or high-quality anonymous data
        // Just remove the user-facing log and mark the analysis as no longer saved by the user.
        const batch = writeBatch(db);
        
        batch.delete(userLogRef);
        batch.update(analysisRunRef, { wasSavedByUser: false });
        
        await batch.commit();
    }

    return { success: true };
}
