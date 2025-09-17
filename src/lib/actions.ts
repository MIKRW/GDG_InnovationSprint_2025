

'use server';

import { unstable_cache as cache, revalidateTag } from 'next/cache';
import { ref as storageRef, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs, orderBy, runTransaction, writeBatch } from 'firebase/firestore';
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

// =================================================================
// Three-Tiered Prompt Versioning System Actions
// =================================================================

export async function getPromptSystems(): Promise<PromptSystem[]> {
    const systemsRef = collection(db, 'prompt_systems');
    const q = query(systemsRef, orderBy('name'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        const defaultSystem = {
            name: "Bird Identifier AI (Newbie)",
            description: "Manages prompts for identifying birds in Newbie mode.",
            activeVersion: "v1.0.0",
            developmentVersion: "v1.0.0",
        };
        const newSystem = await createNewPromptSystem({ systemId: 'bird-identifier-ai-newbie', ...defaultSystem });
        return [newSystem];
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptSystem));
}

export async function getPromptSystem(systemId: string): Promise<PromptSystem | null> {
    const systemRef = doc(db, 'prompt_systems', systemId);
    const snapshot = await getDoc(systemRef);
    if (!snapshot.exists()) {
        return null;
    }
    return { id: snapshot.id, ...snapshot.data() } as PromptSystem;
}

export async function createNewPromptSystem(data: { systemId: string, name: string, description: string }): Promise<PromptSystem> {
    const { systemId, name, description } = data;
    const systemRef = doc(db, 'prompt_systems', systemId);
    const systemSnap = await getDoc(systemRef);

    if (systemSnap.exists()) {
        throw new Error('A system with this ID already exists.');
    }

    const baseInstruction = `You are a world-class ornithologist AI. Your purpose is to identify bird species from audio recordings with the highest possible accuracy...`;
    
    await runTransaction(db, async (transaction) => {
        const defaultContentId = `base_instruction_v1-0-0`;
        const contentRef = doc(db, 'prompt_content', defaultContentId);
        transaction.set(contentRef, {
            systemId,
            categoryId: 'base_instruction',
            version: 'v1.0.0',
            promptText: baseInstruction,
            timestamp: new Date().toISOString(),
        });

        const defaultVersionId = `${systemId}-v1-0-0`;
        const versionRef = doc(db, 'prompt_versions', defaultVersionId);
        transaction.set(versionRef, {
            systemId,
            version: 'v1.0.0',
            timestamp: new Date().toISOString(),
            composedPrompts: { base_instruction: defaultContentId },
        });

        const newSystemData: Omit<PromptSystem, 'id'> = {
            name,
            description,
            activeVersion: 'v1.0.0',
            developmentVersion: 'v1.0.0',
        };
        transaction.set(systemRef, newSystemData);
    });

    revalidateTag('prompts');
    return { id: systemId, name, description, activeVersion: 'v1.0.0', developmentVersion: 'v1.0.0' };
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
        const defaultConfig = { activeAppAIVersion: 'v1.0.0', developmentAppAIVersion: 'v1.0.0-dev' };
        await setDoc(configRef, defaultConfig);
        return defaultConfig;
    }
    return snapshot.data() as AppAIConfig;
}

export async function getAppAIVersions(type: 'dev' | 'live' | 'all' = 'all'): Promise<AppAIVersion[]> {
    const versionsRef = collection(db, 'app_ai_versions');
    let q: Query;
    
    // Efficiently query based on the index: (isDevelopment, timestamp DESC)
    if (type === 'dev') {
        q = query(versionsRef, where('isDevelopment', '==', true), orderBy('timestamp', 'desc'));
    } else if (type === 'live') {
        q = query(versionsRef, where('isDevelopment', '==', false), orderBy('timestamp', 'desc'));
    } else { // 'all'
        q = query(versionsRef, orderBy('timestamp', 'desc'));
    }

    const snapshot = await getDocs(q);
    const versions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppAIVersion));

    if (versions.length === 0 && type !== 'dev') {
        // If there are no versions at all, create a default live one.
        return [await publishNewAppAIVersion('v1.0.0', { 'bird-identifier-ai-newbie': 'bird-identifier-ai-newbie-v1-0-0' }, false)];
    }

    return versions;
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
    
    revalidateTag('prompts');
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
    
    revalidateTag('prompts');
    return { id: newLiveVersionId, ...newLiveVersion };
}


export async function setLivePromptSystemVersion(systemId: string, version: string): Promise<void> {
    const systemRef = doc(db, 'prompt_systems', systemId);
    await updateDoc(systemRef, { activeVersion: version });
    revalidateTag('prompts');
}

export async function publishNewPromptVersion(systemId: string, version: string, composedPrompts: { [categoryId: string]: string }): Promise<PromptVersion> {
    const newId = `${systemId}-${version.replace(/\./g, '-')}`;
    const versionRef = doc(db, 'prompt_versions', newId);
    const newVersionData: Omit<PromptVersion, 'id'> = {
        systemId, version, composedPrompts,
        timestamp: new Date().toISOString(),
    };
    await setDoc(versionRef, newVersionData);
    
    // When publishing a new AI Type Version, automatically set it as the active one for that type.
    await setLivePromptSystemVersion(systemId, version);
    
    revalidateTag('prompts');
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
    const newId = `${categoryId}_${version.replace(/\./g, '-')}`;
    const contentRef = doc(db, 'prompt_content', newId);
    const newContentData: Omit<PromptContent, 'id'> = {
        systemId, categoryId, version, promptText,
        timestamp: new Date().toISOString(),
    };
    if (previousVersionId) (newContentData as PromptContent).previousVersionId = previousVersionId;
    await setDoc(contentRef, newContentData);
revalidateTag('prompts');
    return { id: newId, ...newContentData };
}

export const getComposedPrompt = cache(
    async (systemId: string): Promise<{ prompt: string, version: string } | null> => {
        const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
        console.log(`Composing prompt for system '${systemId}' (Mode: ${isDevMode ? 'Development' : 'Live'}).`);

        try {
            // 1. Get the global AI config to find which top-level version to use.
            const appAIConfig = await getAppAIConfig();
            if (!appAIConfig) throw new Error("App AI config not found.");

            const appAIVersionId = isDevMode 
                ? appAIConfig.developmentAppAIVersion 
                : appAIConfig.activeAppAIVersion;
            
            if (!appAIVersionId) {
                throw new Error(`No ${isDevMode ? 'development' : 'active'} App AI Version is set.`);
            }

            // 2. Get the App AI Version document.
            const appAIVersionRef = doc(db, 'app_ai_versions', appAIVersionId);
            const appAIVersionSnap = await getDoc(appAIVersionRef);
            if (!appAIVersionSnap.exists()) {
                throw new Error(`App AI Version document '${appAIVersionId}' not found.`);
            }
            const appAIVersion = appAIVersionSnap.data() as AppAIVersion;

            // 3. From that, find the ID of the Prompt System Version for the requested systemId.
            const promptSystemVersionId = appAIVersion.systems[systemId];
            if (!promptSystemVersionId) {
                throw new Error(`System '${systemId}' is not defined in App AI Version '${appAIVersionId}'.`);
            }
            
            // 4. Get the Prompt System Version document.
            const promptVersionRef = doc(db, 'prompt_versions', promptSystemVersionId);
            const promptVersionSnap = await getDoc(promptVersionRef);
            if (!promptVersionSnap.exists()) {
                throw new Error(`Prompt Version document '${promptSystemVersionId}' not found.`);
            }
            const promptVersionData = promptVersionSnap.data() as PromptVersion;

            // 5. Get all the individual Prompt Content documents.
            const contentIds = Object.values(promptVersionData.composedPrompts);
            const contentPromises = contentIds.map(id => getDoc(doc(db, 'prompt_content', id)));
            const contentSnaps = await Promise.all(contentPromises);

            const composedText = contentSnaps.map(snap => {
                if (!snap.exists()) throw new Error(`Required prompt content document '${snap.id}' is missing.`);
                return (snap.data() as PromptContent).promptText;
            }).join('\n\n');
            
            // Return both the prompt and the version string for logging.
            return { prompt: composedText, version: appAIVersionId };

        } catch (error) {
            console.error(`Failed to get composed prompt for '${systemId}':`, error);
            return null; 
        }
    },
    ['composed-prompts-v4'], { revalidate: 30, tags: ['prompts'] }
);

