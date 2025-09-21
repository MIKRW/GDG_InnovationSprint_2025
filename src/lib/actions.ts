
'use server';

import { revalidateTag } from 'next/cache';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { adminStorage } from './firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import type {
  AnalysisRun,
  AppAIConfig,
  AppAIVersion,
  AppMode,
  IdentifyBirdOutput,
  PromptContent,
  PromptSystem,
  PromptVersion,
  TestAudioMetadata
} from './types';
import { kebabCase } from 'lodash';
import { cache } from 'react';
import { identifyBirdBySound } from '@/ai/flows/contextual-identify-bird-flow';
import { logErrorToFirestore } from './error-logging';


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

    await uploadString(fileRef, audioFile, 'data_url');
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
  storagePath: string,
  recordingId: string,
  locationData: any,
  hardware: string | null,
  mode: AppMode,
  analysisTimings: AnalysisRun['analysisTimings'] = {},
  sessionId: string,
  creationTime: string,
  error?: Error
): Promise<string> {
  
  const analysisRunId = uuidv4();
  const collectionName = 'all_analysis_runs';
  const analysisRunRef = doc(db, collectionName, analysisRunId);
  
  let aiResult: IdentifyBirdOutput;
  let wasSuccessful: boolean;
  
  if (error) {
    // If an error was passed in from the client (e.g., upload failed), log it directly.
    wasSuccessful = false;
    aiResult = { isBirdSong: false, error: error.message };
    logErrorToFirestore(error, 'client-side-failure', { sessionId, recordingId, analysisRunId });
  } else {
    try {
        const analysisStartTime = Date.now();
        
        // Use the Admin SDK to download the file on the server.
        const bucket = adminStorage.bucket();
        const file = bucket.file(storagePath);
        
        const [audioBuffer] = await file.download();
        
        const audioDataUri = `data:audio/webm;base64,${audioBuffer.toString('base64')}`;

        aiResult = await identifyBirdBySound({
            audioDataUri,
            creationTime: creationTime,
            ...locationData,
            mode: mode
        });
        
        wasSuccessful = !!aiResult && aiResult.isBirdSong !== false;
        
        const analysisDurationMs = Date.now() - analysisStartTime;
        analysisTimings.primaryIdentificationMs = analysisDurationMs;

    } catch (flowError) {
        wasSuccessful = false;
        aiResult = { isBirdSong: false, error: (flowError as Error).message };
        logErrorToFirestore(flowError as Error, 'ai-flow-execution-failure', { sessionId, recordingId, analysisRunId });
    }
  }
  
  const docToCreate: Partial<AnalysisRun> = {
    id: analysisRunId,
    creationTime: creationTime,
    userId: 'anonymous',
    sessionId: sessionId,
    inputAudioStoragePath: storagePath,
    locationData: {
      latitude: locationData?.latitude ?? null,
      longitude: locationData?.longitude ?? null,
      locationDescription: locationData?.locationDescription ?? null,
    },
    analysisMethod: aiResult?.promptVersion || 'unknown',
    aiResult: aiResult,
    wasSuccessful: wasSuccessful,
    wasSavedByUser: false,
    mode: mode,
    analysisTimings: analysisTimings,
  };
  
  try {
    docToCreate.inputAudioUrl = await getDownloadURL(storageRef(storage, storagePath));
  } catch (urlError) {
    docToCreate.inputAudioUrl = '';
    console.warn(`Could not get download URL for ${storagePath}`, urlError);
  }
  
  if (typeof aiResult?.duration === 'number') {
      docToCreate.recordingLengthSeconds = aiResult.duration;
  }
  
  if (hardware) {
      docToCreate.hardware = hardware;
  }

  await setDoc(analysisRunRef, docToCreate);
  return analysisRunId;
}

// =================================================================
// Three-Tiered Prompt Versioning System Actions
// =================================================================

export const getActiveAIConfig = cache(
  async (): Promise<AppAIConfig | null> => {
    const configRef = doc(db, 'app_ai_config', 'main');
    const snapshot = await getDoc(configRef);
    if (!snapshot.exists()) {
      return null;
    }
    return snapshot.data() as AppAIConfig;
  },
  ['ai-config'],
  { tags: ['prompts-v7'] }
);

export async function getPromptSystems(): Promise<PromptSystem[]> {
    const systemsRef = collection(db, 'prompt_systems');
    const initialSnapshot = await getDocs(query(systemsRef, orderBy('name')));
    return initialSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptSystem));
}


export async function getPromptSystem(systemId: string): Promise<PromptSystem | null> {
    const systemRef = doc(db, 'prompt_systems', systemId);
    const snapshot = await getDoc(systemRef);
    if (!snapshot.exists()) {
        return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as PromptSystem;
}


export async function createNewPromptSystem(data: { systemId: string, name: string, description: string }): Promise<void> {
    const { systemId, name, description } = data;
    const systemRef = doc(db, 'prompt_systems', systemId);
    const systemSnap = await getDoc(systemRef);
    if (systemSnap.exists()) {
        throw new Error(`An AI system with the ID "${systemId}" already exists.`);
    }

    await setDoc(systemRef, { name, description, activeVersion: null });
}

export async function getPromptVersionsForSystem(systemId: string, type: 'dev' | 'live' | 'all' = 'all'): Promise<PromptVersion[]> {
    const versionsRef = collection(db, 'prompt_versions');
    let q = query(versionsRef, where('systemId', '==', systemId));

    if (type === 'dev') {
        q = query(q, where('isDevelopment', '==', true));
    } else if (type === 'live') {
        q = query(q, where('isDevelopment', '!=', true));
    }
    
    const snapshot = await getDocs(q);
    const versions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptVersion));
    
    versions.sort((a, b) => {
        if (typeof a.version !== 'string') return 1;
        if (typeof b.version !== 'string') return -1;
        const verA = a.version.replace('v','').split('.').map(Number);
        const verB = b.version.replace('v','').split('.').map(Number);
        if (verA[0] !== verB[0]) return verB[0] - verA[0];
        if (verA[1] !== verB[1]) return verB[1] - verA[1];
        return verB[2] - verA[2];
    });
    
    return versions;
}


export async function getPromptContentForSystem(systemId: string): Promise<PromptContent[]> {
    const contentRef = collection(db, 'prompt_content');
    const q = query(contentRef, where('systemId', '==', systemId));
    const snapshot = await getDocs(q);
    
    const contents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptContent));
    contents.sort((a, b) => {
        if (typeof a.version !== 'string' || typeof b.version !== 'string') return 0;
        const [majA, minA, patchA] = a.version.replace('v','').split('.').map(Number);
        const [majB, minB, patchB] = b.version.replace('v','').split('.').map(Number);
        if (majA !== majB) return majB - majA;
        if (minA !== minB) return minB - minA;
        return patchB - patchA;
    });
    return contents;
}

export async function getAppAIConfig(): Promise<AppAIConfig | null> {
    const configRef = doc(db, 'app_ai_config', 'main');
    const snapshot = await getDoc(configRef);
    if (!snapshot.exists()) {
        return null;
    }
    return snapshot.data() as AppAIConfig;
}

export async function getAppAIVersions(type: 'dev' | 'live' | 'all' = 'all'): Promise<AppAIVersion[]> {
    const configRef = doc(db, 'app_ai_config', 'main');

    // Run a transaction to atomically check and create the default config if needed.
    await runTransaction(db, async (transaction) => {
        const configSnap = await transaction.get(configRef);
        if (configSnap.exists()) {
            return; // Config already exists, do nothing.
        }

        console.log("No App AI Systems found. Creating complete default configuration atomically.");

        const birdSystemId = 'bird-identifier-ai-newbie';
        const themeSystemId = 'theme-generator-ai';
        const birdVersionId = 'v1.0.0';
        const themeVersionId = 'v1.0.0';

        // Consistent ID generation
        const birdContentId = `${birdSystemId}_base_instruction_${birdVersionId}`;
        const birdVersionDocId = `${birdSystemId}_${birdVersionId}`;
        const themeContentId = `${themeSystemId}_base_instruction_${themeVersionId}`;
        const themeVersionDocId = `${themeSystemId}_${themeVersionId}`;

        // Create bird identifier system
        transaction.set(doc(db, 'prompt_systems', birdSystemId), { name: "Bird Identifier AI (Newbie)", description: "Manages prompts for identifying birds in Newbie mode.", activeVersion: birdVersionId });
        transaction.set(doc(db, 'prompt_content', birdContentId), { systemId: birdSystemId, categoryId: 'base_instruction', version: birdVersionId, promptText: `You are an expert ornithologist. Your primary goal is to identify bird species from audio recordings. The user will provide an audio file and optional location data. You MUST analyze this audio to determine if a bird song is present. If it is, identify the bird's common name, scientificName, taxonomic family, and order. If no bird song is discernible, you MUST set 'isBirdSong' to false. You must also generate a simple, descriptive prompt for a text-to-image model to create a photorealistic image of the identified bird.`, timestamp: new Date().toISOString() });
        transaction.set(doc(db, 'prompt_versions', birdVersionDocId), { systemId: birdSystemId, version: birdVersionId, composedPrompts: { base_instruction: birdContentId }, timestamp: new Date().toISOString() });
        
        // Create theme generator system
        transaction.set(doc(db, 'prompt_systems', themeSystemId), { name: "AI Theme Generator", description: "Manages prompts for generating UI color themes.", activeVersion: themeVersionId });
        transaction.set(doc(db, 'prompt_content', themeContentId), { systemId: themeSystemId, categoryId: 'base_instruction', version: themeVersionId, promptText: `You are a professional UI/UX designer specializing in color theory and accessibility. Your task is to generate a color palette for a web application based on three inspirational words and a 'mood'. The output must be a JSON object with 'background', 'foreground', 'primary', and 'ring' colors in HSL format. You must ensure that the contrast ratios between background, foreground, and primary colors are WCAG AA compliant at a minimum, aiming for AAA where possible, especially for 'High Contrast' mood. The 'ring' color must be a perceptibly lighter or darker shade of the 'primary' color to be visible as a selection indicator. The mood provides the artistic direction and accessibility constraints. For color-blindness-friendly moods, you must avoid color combinations that are difficult to distinguish for that specific type of color vision deficiency.`, timestamp: new Date().toISOString() });
        transaction.set(doc(db, 'prompt_versions', themeVersionDocId), { systemId: themeSystemId, version: themeVersionId, composedPrompts: { base_instruction: themeContentId }, timestamp: new Date().toISOString() });

        // Create top-level App AI Versions with links to the new systems
        const defaultSystems = { [birdSystemId]: birdVersionDocId, [themeSystemId]: themeVersionDocId };
        
        const defaultLiveVersion = 'v1.0.0';
        const defaultDevVersion = 'v1.0.0-dev';

        transaction.set(doc(db, 'app_ai_versions', defaultLiveVersion), { version: defaultLiveVersion, isDevelopment: false, timestamp: new Date().toISOString(), systems: defaultSystems });
        transaction.set(doc(db, 'app_ai_versions', defaultDevVersion), { version: defaultDevVersion, isDevelopment: true, timestamp: new Date().toISOString(), systems: defaultSystems });
        
        // Finally, create the main config to point to these new versions
        transaction.set(configRef, { activeAppAIVersion: defaultLiveVersion, developmentAppAIVersion: defaultDevVersion });
    });
    
    // Now that we're sure the config exists, fetch and return the versions.
    const versionsRef = collection(db, 'app_ai_versions');
    let q = query(versionsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    let filteredVersions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppAIVersion));
    if (type === 'dev') {
        filteredVersions = filteredVersions.filter(v => v.isDevelopment);
    } else if (type === 'live') {
        filteredVersions = filteredVersions.filter(v => !v.isDevelopment);
    }
    
    return filteredVersions;
}


export async function publishNewAppAIVersion(version: string, systems: { [systemId: string]: string }, isDevelopment: boolean): Promise<AppAIVersion> {
    const newVersionId = version;
    const versionRef = doc(db, 'app_ai_versions', newVersionId);
    
    const newVersionData: Omit<AppAIVersion, 'id'> = {
        version,
        timestamp: new Date().toISOString(),
        isDevelopment,
        systems,
    };
    await setDoc(versionRef, newVersionData);

    const configRef = doc(db, 'app_ai_config', 'main');
    if (isDevelopment) {
        await setDoc(configRef, { developmentAppAIVersion: newVersionId }, { merge: true });
    } else {
        await setDoc(configRef, { activeAppAIVersion: newVersionId }, { merge: true });
    }
    
    revalidateTag('prompts-v7');
    return { id: newVersionId, ...newVersionData };
}

export async function promoteDevelopmentVersionToLive(
  devVersionId: string,
  type: 'major' | 'minor' | 'patch'
): Promise<AppAIVersion> {
    const devVersionRef = doc(db, 'app_ai_versions', devVersionId);
    const devVersionSnap = await getDoc(devVersionRef);
    if (!devVersionSnap.exists() || !devVersionSnap.data().isDevelopment) {
        throw new Error("The specified version is not a valid development version.");
    }

    const allLiveVersions = await getAppAIVersions('live');
    const latestLiveVersion = allLiveVersions[0]; // They are sorted descending
    let newLiveVersionString: string;

    if (!latestLiveVersion) {
        newLiveVersionString = 'v1.0.0';
    } else {
        const [major, minor, patch] = latestLiveVersion.version.replace('v','').split('.').map(Number);
        if (type === 'major') {
            newLiveVersionString = `v${major + 1}.0.0`;
        } else if (type === 'minor') {
            newLiveVersionString = `v${major}.${minor + 1}.0`;
        } else { // patch
            newLiveVersionString = `v${major}.${minor}.${patch + 1}`;
        }
    }
    
    const devVersionData = devVersionSnap.data() as AppAIVersion;
    const newLiveVersion: Omit<AppAIVersion, 'id'> = {
        ...devVersionData,
        version: newLiveVersionString,
        isDevelopment: false,
        timestamp: new Date().toISOString(),
    };

    const newLiveVersionId = newLiveVersionString;
    const liveVersionRef = doc(db, 'app_ai_versions', newLiveVersionId);
    
    const batch = writeBatch(db);
batch.set(liveVersionRef, newLiveVersion);
    batch.update(doc(db, 'app_ai_config', 'main'), { activeAppAIVersion: newLiveVersionId });
    await batch.commit();
    
    revalidateTag('prompts-v7');
    return { id: newLiveVersionId, ...newLiveVersion };
}


export async function setLivePromptSystemVersion(systemId: string, version: string): Promise<void> {
    const systemRef = doc(db, 'prompt_systems', systemId);
    await updateDoc(systemRef, { activeVersion: version });
    revalidateTag('prompts-v7');
}

export async function publishNewPromptVersion(systemId: string, version: string, composedPrompts: { [categoryId: string]: string }): Promise<PromptVersion> {
    const newId = `${systemId}_${version}`;
    const versionRef = doc(db, 'prompt_versions', newId);
    
    const newVersionData: Omit<PromptVersion, 'id'> = {
        systemId, version, composedPrompts,
        timestamp: new Date().toISOString(),
    };
    await setDoc(versionRef, newVersionData);
    
    await setLivePromptSystemVersion(systemId, version);
    
    revalidateTag('prompts-v7');
    return { id: newId, ...newVersionData };
}

interface PublishNewPromptContentInput {
    systemId: string;
    categoryId: string;
    version: string;
    promptText: string;
    previousVersionId?: string;
}

export async function publishNewPromptContent(input: PublishNewPromptContentInput): Promise<PromptContent> {
    const { systemId, categoryId, version, promptText, previousVersionId } = input;
    const newId = `${systemId}_${categoryId}_${version}`;
    const contentRef = doc(db, 'prompt_content', newId);
    const newContentData: Omit<PromptContent, 'id'> = {
        systemId, categoryId, version, promptText,
        timestamp: new Date().toISOString(),
    };
    if (previousVersionId) (newContentData as PromptContent).previousVersionId = previousVersionId;
    await setDoc(contentRef, newContentData);
    revalidateTag('prompts-v7');
    return { id: newId, ...newContentData };
}

    
