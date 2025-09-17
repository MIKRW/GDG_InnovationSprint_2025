

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

    await setDoc(systemRef, { name, description });
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
    const versionsRef = collection(db, 'app_ai_versions');
    let q = query(versionsRef, orderBy('timestamp', 'desc'));

    if (type === 'dev') {
        q = query(q, where('isDevelopment', '==', true));
    } else if (type === 'live') {
        q = query(q, where('isDevelopment', '==', false));
    }

    const snapshot = await getDocs(q);
    
    // If the entire collection is empty, this is a first run. Create all default data atomically.
    if (snapshot.empty && type === 'all') {
        console.log("No App AI Systems found. Creating complete default configuration.");
        
        await runTransaction(db, async (transaction) => {
            const createDefaultSystemInTransaction = async (systemId: string, name: string, description: string, initialPromptText: string) => {
                const systemRef = doc(db, 'prompt_systems', systemId);
                const defaultContentId = `${systemId}_base_instruction_v1-0-0`;
                const contentRef = doc(db, 'prompt_content', defaultContentId);
                transaction.set(contentRef, {
                    systemId, categoryId: 'base_instruction', version: 'v1.0.0',
                    promptText: initialPromptText, timestamp: new Date().toISOString(),
                });

                const defaultVersionId = `${systemId}-v1-0-0`;
                const versionRef = doc(db, 'prompt_versions', defaultVersionId);
                transaction.set(versionRef, {
                    systemId, version: 'v1.0.0', composedPrompts: { base_instruction: defaultContentId },
                    timestamp: new Date().toISOString(),
                });

                transaction.set(systemRef, { name, description, activeVersion: 'v1.0.0', developmentVersion: 'v1.0.0' });
            };

            await createDefaultSystemInTransaction(
                'bird-identifier-ai-newbie', 
                "Bird Identifier AI (Newbie)", 
                "Manages prompts for identifying birds in Newbie mode.",
                `You are an expert ornithologist AI...` // Abridged for brevity
            );
            await createDefaultSystemInTransaction(
                'theme-generator-ai', 
                "AI Theme Generator", 
                "Manages prompts for generating UI color themes.",
                `You are an expert UI/UX designer and color theorist...` // Abridged for brevity
            );
            
            const defaultSystems = { 
                'bird-identifier-ai-newbie': 'bird-identifier-ai-newbie-v1-0-0', 
                'theme-generator-ai': 'theme-generator-ai-v1-0-0' 
            };
            
            const liveVersionRef = doc(db, 'app_ai_versions', 'v1.0.0');
            transaction.set(liveVersionRef, {
                version: 'v1.0.0', isDevelopment: false, timestamp: new Date().toISOString(), systems: defaultSystems,
            });

            const devVersionRef = doc(db, 'app_ai_versions', 'v1.0.0-dev');
            transaction.set(devVersionRef, {
                version: 'v1.0.0-dev', isDevelopment: true, timestamp: new Date().toISOString(), systems: defaultSystems,
            });

            const configRef = doc(db, 'app_ai_config', 'main');
            transaction.set(configRef, { activeAppAIVersion: 'v1.0.0', developmentAppAIVersion: 'v1.0.0-dev' });
        });

        const finalSnapshot = await getDocs(query(versionsRef, orderBy('timestamp', 'desc')));
        return finalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppAIVersion));
    }

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppAIVersion));
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
        ...devVersionData, // This correctly carries over the 'systems' object
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
    const newId = `${systemId}_${categoryId}_${version.replace(/\./g, '-')}`;
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
    async (systemId: string): Promise<{ prompt: string; version: string } | null> => {
        const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
        console.log(`Composing prompt for AI Type '${systemId}' (Mode: ${isDevMode ? 'Development' : 'Live'}).`);

        try {
            // 1. Get the global AI config. If it doesn't exist, create it and retry.
            let appAIConfig = await getAppAIConfig();
            if (!appAIConfig) {
                console.log("App AI config not found. Triggering initial data creation.");
                await getAppAIVersions('all'); // This function contains the transactional creation logic.
                appAIConfig = await getAppAIConfig(); // Retry fetching after creation.
                if (!appAIConfig) {
                    throw new Error("Fatal: App AI Systems config not found even after atomic creation.");
                }
            }

            // 2. Determine which top-level version to use.
            const appAIVersionId = isDevMode 
                ? appAIConfig.developmentAppAIVersion 
                : appAIConfig.activeAppAIVersion;
            
            if (!appAIVersionId) {
                throw new Error(`No ${isDevMode ? 'development' : 'active'} App AI Version is set in the config.`);
            }

            // 3. Get the App AI System document (the manifest).
            const appAIVersionRef = doc(db, 'app_ai_versions', appAIVersionId);
            const appAIVersionSnap = await getDoc(appAIVersionRef);
            if (!appAIVersionSnap.exists()) {
                throw new Error(`App AI Version document '${appAIVersionId}' not found.`);
            }
            const appAIVersion = appAIVersionSnap.data() as AppAIVersion;

            // 4. From that, find the ID of the AI Type Version for the requested systemId.
            const promptSystemVersionId = appAIVersion.systems[systemId];
            if (!promptSystemVersionId) {
                throw new Error(`AI Type '${systemId}' is not defined in App AI Version '${appAIVersionId}'. Check the 'systems' map in that document.`);
            }
            
            // 5. Get the AI Type Version document (the "recipe").
            const promptVersionRef = doc(db, 'prompt_versions', promptSystemVersionId);
            const promptVersionSnap = await getDoc(promptVersionRef);
            if (!promptVersionSnap.exists()) {
                throw new Error(`AI Type Version document '${promptSystemVersionId}' not found.`);
            }
            const promptVersionData = promptVersionSnap.data() as PromptVersion;

            // 6. Get all the individual Prompt Content documents from the recipe.
            const contentIds = Object.values(promptVersionData.composedPrompts);
            if (contentIds.length === 0) {
                 throw new Error(`AI Type Version '${promptSystemVersionId}' has no prompt content defined.`);
            }
            const contentPromises = contentIds.map(id => getDoc(doc(db, 'prompt_content', id)));
            const contentSnaps = await Promise.all(contentPromises);

            // 7. Assemble the final prompt text.
            const composedText = contentSnaps.map(snap => {
                if (!snap.exists()) throw new Error(`Required prompt content document with ID '${snap.ref.id}' is missing.`);
                return (snap.data() as PromptContent).promptText;
            }).join('\n\n');
            
            // 8. Return both the prompt and the top-level version string for logging.
            return { prompt: composedText, version: appAIVersionId };

        } catch (error) {
            console.error(`Failed to get composed prompt for '${systemId}':`, error);
            return null; 
        }
    },
    ['composed-prompts-v7'], { revalidate: 30, tags: ['prompts'] }
);
