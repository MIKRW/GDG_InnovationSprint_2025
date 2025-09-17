
'use server';

import { unstable_cache as cache } from 'next/cache';
import { ref as storageRef, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, orderBy, runTransaction } from 'firebase/firestore';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { TestAudioMetadata, BirdLog, PromptSystem, PromptVersion, AppAIVersion, AppAIConfig, PromptContent, AnalysisRun, AppMode } from './types';
import { EmailAuthProvider, linkWithCredential, type User } from 'firebase/auth';
import { kebabCase } from 'lodash';

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
    audio: string, // Can be data URI for live recordings or storage path for test runs
    aiResult: any,
    wasSuccessful: boolean,
    locationData: any,
    hardware: string | null,
    mode: AppMode,
    isDeveloperRun: boolean,
    testContext?: { birdId: string; testAudioId: string },
    recordingLengthSeconds?: number,
    analysisTimings?: AnalysisRun['analysisTimings'],
    sessionId?: string,
    timestamp?: string,
  ) {
    
    const analysisRunId = uuidv4();
    const collectionName = isDeveloperRun ? 'all_test_runs' : 'all_analysis_runs';
    const analysisRunRef = doc(db, collectionName, analysisRunId);

    let inputAudioUrl: string;
    let inputAudioStoragePath: string;
    
    // Check if the audio is a data URI or a storage path
    if (audio.startsWith('data:')) {
        // It's a live recording, upload it to generate URL and path
        const audioId = uuidv4();
        inputAudioStoragePath = `users/${userId}/recordings/${audioId}.webm`;
        const fileRef = storageRef(storage, inputAudioStoragePath);
        await uploadString(fileRef, audio, 'data_url');
        inputAudioUrl = await getDownloadURL(fileRef);
    } else {
        // It's a test run, the audio is already a storage path
        inputAudioStoragePath = audio;
        const fileRef = storageRef(storage, inputAudioStoragePath);
        inputAudioUrl = await getDownloadURL(fileRef);
    }

    const docToCreate: Omit<AnalysisRun, 'id'> = {
      timestamp: timestamp!,
      userId: userId,
      sessionId: sessionId!,
      inputAudioUrl: inputAudioUrl,
      inputAudioStoragePath: inputAudioStoragePath,
      locationData: {
        latitude: locationData?.latitude ?? null,
        longitude: locationData?.longitude ?? null,
        locationDescription: locationData?.locationDescription ?? null,
      },
      analysisMethod: `gemini-pro-vision-prompt-v1.8`,
      aiResult: aiResult,
      wasSuccessful: wasSuccessful,
      wasSavedByUser: false,
      mode: mode,
      isDeveloperData: isDeveloperRun,
      recordingLengthSeconds: recordingLengthSeconds,
      analysisTimings: analysisTimings,
    };

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

// =================================================================
// Three-Tiered Prompt Versioning System Actions
// =================================================================


export async function getPromptSystems(): Promise<PromptSystem[]> {
    const systemsRef = collection(db, 'prompt_systems');
    const q = query(systemsRef, orderBy('name'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        // Create a default system
        const defaultSystem: Omit<PromptSystem, 'id'> = {
            name: "Bird Identifier AI (Newbie)",
            description: "Manages prompts for identifying birds in Newbie mode.",
            activeVersion: "1.0.0"
        };
        const newSystem = await createNewPromptSystem({ systemId: 'bird-identifier-ai-newbie', ...defaultSystem });
        return [newSystem];
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptSystem));
}

export async function createNewPromptSystem(data: { systemId: string, name: string, description: string }): Promise<PromptSystem> {
    const { systemId, name, description } = data;

    const systemRef = doc(db, 'prompt_systems', systemId);
    const systemSnap = await getDoc(systemRef);
    if (systemSnap.exists()) {
        throw new Error('A system with this ID already exists.');
    }
    
    const baseInstruction = `You are a world-class ornithologist AI. Your purpose is to identify bird species from audio recordings with the highest possible accuracy.

You will receive an audio file and optional contextual data like location and time.

Your primary goal is to determine if a bird song is present and, if so, identify the bird's common name, scientific name, taxonomic family, and order.

If a bird song is present, you MUST set 'isBirdSong' to true and populate the identification fields.

If no bird song is discernible, or if the audio contains other sounds, you MUST set 'isBirdSong' to false and leave the other fields empty.

You must also generate a simple, descriptive prompt suitable for a text-to-image model to create a photorealistic image of the identified bird.`;

    await runTransaction(db, async (transaction) => {
        const defaultContentId = `base_instruction_v1-0-0`;
        const contentRef = doc(db, 'prompt_content', defaultContentId);
        const contentData: Omit<PromptContent, 'id'> = {
            systemId,
            categoryId: 'base_instruction',
            version: 'v1.0.0',
            promptText: baseInstruction,
            timestamp: new Date().toISOString(),
        };
        transaction.set(contentRef, contentData);

        const defaultVersionId = `${systemId}-v1-0-0`;
        const versionRef = doc(db, 'prompt_versions', defaultVersionId);
        const versionData: Omit<PromptVersion, 'id'> = {
            systemId,
            version: 'v1.0.0',
            timestamp: new Date().toISOString(),
            composedPrompts: {
                base_instruction: defaultContentId,
            },
        };
        transaction.set(versionRef, versionData);

        const newSystemData: Omit<PromptSystem, 'id'> = {
            name,
            description,
            activeVersion: 'v1.0.0',
        };
        transaction.set(systemRef, newSystemData);
    });

    return { id: systemId, name, description, activeVersion: 'v1.0.0' };
}

export async function getPromptVersionsForSystem(systemId: string): Promise<PromptVersion[]> {
    const versionsRef = collection(db, 'prompt_versions');
    const q = query(versionsRef, where('systemId', '==', systemId));
    const snapshot = await getDocs(q);

    if (snapshot.empty && systemId === 'bird-identifier-ai-newbie') {
        const defaultVersion = await publishNewPromptVersion(systemId, 'v1.0.0', {
            base_instruction: 'base_instruction_v1-0-0'
        });
        return [defaultVersion];
    }
    
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
    
    const baseInstruction = `You are a world-class ornithologist AI. Your purpose is to identify bird species from audio recordings with the highest possible accuracy.

You will receive an audio file and optional contextual data like location and time.

Your primary goal is to determine if a bird song is present and, if so, identify the bird's common name, scientific name, taxonomic family, and order.

If a bird song is present, you MUST set 'isBirdSong' to true and populate the identification fields.

If no bird song is discernible, or if the audio contains other sounds, you MUST set 'isBirdSong' to false and leave the other fields empty.

You must also generate a simple, descriptive prompt suitable for a text-to-image model to create a photorealistic image of the identified bird.`;

    if (snapshot.empty && systemId === 'bird-identifier-ai-newbie') {
        const defaultContent = await publishNewPromptContent({
            systemId,
            categoryId: 'base_instruction',
            version: 'v1.0.0',
            promptText: baseInstruction
        });
        return [defaultContent];
    }
    
    const contents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptContent));

    contents.sort((a, b) => {
        try {
            if (typeof a.version !== 'string') return 1;
            if (typeof b.version !== 'string') return -1;
            const versionA = a.version.replace('v','').split('.').map(Number);
            const versionB = b.version.replace('v','').split('.').map(Number);
            if (versionA[0] !== versionB[0]) return versionB[0] - versionA[0];
            if (versionA[1] !== versionB[1]) return versionB[1] - versionA[1];
            return versionB[2] - versionA[2];
        } catch (e) {
            console.error("Failed to parse versions for sorting:", a, b, e);
            return 0;
        }
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

export async function getAppAIVersions(): Promise<AppAIVersion[]> {
    const versionsRef = collection(db, 'app_ai_versions');
    const q = query(versionsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        const defaultVersion = await publishNewAppAIVersion('v1.0.0', {
            'bird-identifier-ai-newbie': 'bird-identifier-ai-newbie-v1.0.0'
        });
        return [defaultVersion];
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppAIVersion));
}

export async function setLiveAppAIVersion(versionId: string): Promise<void> {
    const configRef = doc(db, 'app_ai_config', 'main');
    await setDoc(configRef, { activeAppAIVersion: versionId }, { merge: true });
}

export async function publishNewAppAIVersion(
    version: string,
    systems: { [systemId: string]: string }
): Promise<AppAIVersion> {
    const newVersionId = version;
    const versionRef = doc(db, 'app_ai_versions', newVersionId);

    const newVersionData: Omit<AppAIVersion, 'id'> = {
        version,
        timestamp: new Date().toISOString(),
        systems,
    };

    await setDoc(versionRef, newVersionData);
    await setLiveAppAIVersion(newVersionId);

    return { id: newVersionId, ...newVersionData };
}

export async function setLivePromptSystemVersion(systemId: string, version: string): Promise<void> {
    const systemRef = doc(db, 'prompt_systems', systemId);
    await updateDoc(systemRef, { activeVersion: version });
}

export async function publishNewPromptVersion(
    systemId: string,
    version: string,
    composedPrompts: { [categoryId: string]: string },
): Promise<PromptVersion> {
    const newId = `${systemId}-${version}`;
    const versionRef = doc(db, 'prompt_versions', newId);

    const newVersionData: Omit<PromptVersion, 'id'> = {
        systemId,
        version,
        timestamp: new Date().toISOString(),
        composedPrompts,
    };

    await setDoc(versionRef, newVersionData);
    await setLivePromptSystemVersion(systemId, version);

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
    
    const newId = `${categoryId}_${version}`;
    const contentRef = doc(db, 'prompt_content', newId);

    const newContentData: Omit<PromptContent, 'id'> = {
        systemId,
        categoryId,
        version,
        promptText,
        timestamp: new Date().toISOString(),
    };

    if (previousVersionId) {
        (newContentData as PromptContent).previousVersionId = previousVersionId;
    }

    await setDoc(contentRef, newContentData);

    return { id: newId, ...newContentData };
}


export const getComposedPrompt = cache(
    async (systemId: string): Promise<string | null> => {
        console.log(`CACHE MISS: Composing prompt for system '${systemId}' from Firestore.`);
        try {
            const systemRef = doc(db, 'prompt_systems', systemId);
            const systemSnap = await getDoc(systemRef);
            if (!systemSnap.exists()) {
                throw new Error(`Prompt system '${systemId}' does not exist.`);
            }
            const systemData = systemSnap.data() as PromptSystem;
            const activeSystemVersion = systemData.activeVersion;

            const promptVersionId = `${systemId}-${activeSystemVersion}`;
            const promptVersionRef = doc(db, 'prompt_versions', promptVersionId);
            const promptVersionSnap = await getDoc(promptVersionRef);
            if (!promptVersionSnap.exists()) {
                throw new Error(`Active prompt version document '${promptVersionId}' for system '${systemId}' not found.`);
            }
            const promptVersion = promptVersionSnap.data() as PromptVersion;

            const contentIds = Object.values(promptVersion.composedPrompts);
            const contentPromises = contentIds.map(id => getDoc(doc(db, 'prompt_content', id)));
            const contentSnaps = await Promise.all(contentPromises);

            const contentPieces: PromptContent[] = contentSnaps.map(snap => {
                if (!snap.exists()) {
                    throw new Error(`Required prompt content document with ID '${snap.id}' is missing.`);
                }
                return snap.data() as PromptContent;
            });
            
            const composedText = contentPieces.map(p => p.promptText).join('\n\n');

            return composedText;

        } catch (error) {
            console.error(`Failed to get composed prompt for '${systemId}':`, error);
            return null; 
        }
    },
    ['composed-prompts-v2'],
    {
        revalidate: 60,
        tags: ['prompts'],
    }
);

    