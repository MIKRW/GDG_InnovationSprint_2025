
'use server';

import { ref as storageRef, uploadBytes, getDownloadURL, uploadString, getMetadata, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, writeBatch, deleteDoc, runTransaction } from 'firebase/firestore';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { TestAudioMetadata, BirdLog, PromptSystem, PromptVersion, AppAIVersion, AppAIConfig, PromptContent } from './types';
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


/**
 * Moves a log entry to the 'trashed' state.
 * This action sets a flag `status` to 'trashed', which will prevent it from being displayed
 * in the main log views. A future UI will allow users to view and restore trashed items.
 */
export async function trashLog(log: BirdLog) {
    const userLogRef = doc(db, 'users', log.userId, 'identifications', log.id);
    await updateDoc(userLogRef, { status: 'trashed' });

    return { success: true };
}


/**
 * Saves a new canonical image for a bird species.
 * It uploads the image to a dedicated path in Storage and updates the 'birds' collection.
 */
export async function saveCanonicalImage(
    commonName: string,
    scientificName: string,
    imageDataUri: string,
    imageType: 'key' | 'side_profile' | 'male' | 'female' = 'key'
): Promise<string> {
    const birdId = kebabCase(commonName);
    const imagePath = `canonical-images/${birdId}/${imageType}-${uuidv4()}.jpg`;
    const imageFileRef = storageRef(storage, imagePath);

    // Upload the new image from data URI
    await uploadString(imageFileRef, imageDataUri, 'data_url');
    const downloadURL = await getDownloadURL(imageFileRef);

    // Update the 'birds' document with the new canonical URL, nested under the imageType
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

// =================================================================
// Three-Tiered Prompt Versioning System Actions
// =================================================================


/**
 * Fetches all defined AI prompt systems from Firestore.
 * If none exist, it creates a default one.
 */
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

/**
 * Creates a new AI Prompt System, its default first version, and its default first content piece.
 */
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

    // Use a transaction to ensure all parts are created together
    await runTransaction(db, async (transaction) => {
        // 1. Create default content
        const defaultContentId = `base_instruction_1-0-0`;
        const contentRef = doc(db, 'prompt_content', defaultContentId);
        const contentData: Omit<PromptContent, 'id'> = {
            systemId,
            categoryId: 'base_instruction',
            version: '1.0.0',
            promptText: baseInstruction,
            timestamp: new Date().toISOString(),
        };
        transaction.set(contentRef, contentData);

        // 2. Create default version pointing to content
        const defaultVersionId = `${systemId}-1-0-0`;
        const versionRef = doc(db, 'prompt_versions', defaultVersionId);
        const versionData: Omit<PromptVersion, 'id'> = {
            systemId,
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            composedPrompts: {
                base_instruction: defaultContentId,
            },
        };
        transaction.set(versionRef, versionData);

        // 3. Create the system document
        const newSystemData: Omit<PromptSystem, 'id'> = {
            name,
            description,
            activeVersion: '1.0.0',
        };
        transaction.set(systemRef, newSystemData);
    });

    return { id: systemId, name, description, activeVersion: '1.0.0' };
}

/**
 * Fetches all saved versions for a specific prompt system.
 * If none exist, it creates a default one.
 */
export async function getPromptVersionsForSystem(systemId: string): Promise<PromptVersion[]> {
    const versionsRef = collection(db, 'prompt_versions');
    const q = query(versionsRef, where('systemId', '==', systemId));
    const snapshot = await getDocs(q);

    if (snapshot.empty && systemId === 'bird-identifier-ai-newbie') {
        const defaultVersion = await publishNewPromptVersion(systemId, '1.0.0', {
            base_instruction: 'base_instruction_1-0-0'
        });
        return [defaultVersion];
    }
    
    const versions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptVersion));
    
    versions.sort((a, b) => {
        if (typeof a.version !== 'string') return 1;
        if (typeof b.version !== 'string') return -1;
        const verA = a.version.split('.').map(Number);
        const verB = b.version.split('.').map(Number);
        if (verA[0] !== verB[0]) return verB[0] - verA[0];
        if (verA[1] !== verB[1]) return verB[1] - verA[1];
        return verB[2] - verA[2];
    });
    
    return versions;
}


/**
 * Fetches all prompt content pieces for a given system, sorted by version.
 * If none exist, it creates a default one.
 */
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
            version: '1.0.0',
            promptText: baseInstruction
        });
        return [defaultContent];
    }
    
    const contents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptContent));

    contents.sort((a, b) => {
        try {
            if (typeof a.version !== 'string') return 1;
            if (typeof b.version !== 'string') return -1;
            const versionA = a.version.split('.').map(Number);
            const versionB = b.version.split('.').map(Number);
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


/**
 * Fetches the global AI configuration for the app.
 */
export async function getAppAIConfig(): Promise<AppAIConfig | null> {
    const configRef = doc(db, 'app_ai_config', 'main');
    const snapshot = await getDoc(configRef);
    if (!snapshot.exists()) {
        return null;
    }
    return snapshot.data() as AppAIConfig;
}

/**
 * Fetches all published App AI Versions.
 * If none exist, it creates a default one.
 */
export async function getAppAIVersions(): Promise<AppAIVersion[]> {
    const versionsRef = collection(db, 'app_ai_versions');
    const q = query(versionsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        const defaultVersion = await publishNewAppAIVersion('1.0.0', {
            'bird-identifier-ai-newbie': 'bird-identifier-ai-newbie-1-0-0'
        });
        return [defaultVersion];
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppAIVersion));
}

/**
 * Sets the live (active) App AI Version for the entire application.
 */
export async function setLiveAppAIVersion(versionId: string): Promise<void> {
    const configRef = doc(db, 'app_ai_config', 'main');
    await setDoc(configRef, { activeAppAIVersion: versionId }, { merge: true });
}

/**
 * Creates a new App AI Version document in Firestore and sets it as the live version.
 */
export async function publishNewAppAIVersion(
    version: string,
    systems: { [systemId: string]: string }
): Promise<AppAIVersion> {
    const newVersionId = version.replace(/\./g, '-');
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

/**
 * Sets the live (active) Prompt System Version for a specific AI system.
 */
export async function setLivePromptSystemVersion(systemId: string, version: string): Promise<void> {
    const systemRef = doc(db, 'prompt_systems', systemId);
    await updateDoc(systemRef, { activeVersion: version });
}

/**
 * Publishes a new version of a specific Prompt System.
 */
export async function publishNewPromptVersion(
    systemId: string,
    version: string,
    composedPrompts: { [categoryId: string]: string },
): Promise<PromptVersion> {
    const newId = `${systemId}-${version.replace(/\./g, '-')}`;
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

/**
 * Publishes a new version of a single prompt content piece.
 */
export async function publishNewPromptContent(input: PublishNewPromptContentInput): Promise<PromptContent> {
    const { systemId, categoryId, version, promptText, previousVersionId } = input;
    
    const newId = `${categoryId}_${version.replace(/\./g, '-')}`;
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


/**
 * Fetches the fully composed prompt text for a given AI system by following the versioning hierarchy.
 * @param systemId The ID of the AI system (e.g., 'bird-identifier-ai-newbie').
 * @returns The final, combined prompt string, or null if any part of the chain is missing.
 */
export async function getComposedPrompt(systemId: string): Promise<string | null> {
    try {
        // 1. Get the live app version config
        const appConfig = await getAppAIConfig();
        if (!appConfig?.activeAppAIVersion) {
            throw new Error("No active App AI Version is configured.");
        }

        // 2. Get the specific app version document
        const appVersionRef = doc(db, 'app_ai_versions', appConfig.activeAppAIVersion);
        const appVersionSnap = await getDoc(appVersionRef);
        if (!appVersionSnap.exists()) {
            throw new Error(`App AI Version document '${appConfig.activeAppAIVersion}' not found.`);
        }
        const appVersion = appVersionSnap.data() as AppAIVersion;

        // 3. Find the prompt system version for the requested systemId
        const systemRef = doc(db, 'prompt_systems', systemId);
        const systemSnap = await getDoc(systemRef);
        if(!systemSnap.exists()) {
            throw new Error(`Prompt system '${systemId}' does not exist.`);
        }
        const systemData = systemSnap.data() as PromptSystem;
        const activeSystemVersion = systemData.activeVersion;

        // 4. Get the prompt version document
        const promptVersionId = `${systemId}-${activeSystemVersion.replace(/\./g, '-')}`;
        const promptVersionRef = doc(db, 'prompt_versions', promptVersionId);
        const promptVersionSnap = await getDoc(promptVersionRef);
        if (!promptVersionSnap.exists()) {
            throw new Error(`Prompt version document '${promptVersionId}' for system '${systemId}' not found.`);
        }
        const promptVersion = promptVersionSnap.data() as PromptVersion;

        // 5. Fetch all the individual prompt content pieces
        const contentIds = Object.values(promptVersion.composedPrompts);
        const contentPromises = contentIds.map(id => getDoc(doc(db, 'prompt_content', id)));
        const contentSnaps = await Promise.all(contentPromises);

        const contentPieces: PromptContent[] = contentSnaps.map(snap => {
            if (!snap.exists()) {
                throw new Error(`Required prompt content document with ID '${snap.id}' is missing.`);
            }
            return snap.data() as PromptContent;
        });
        
        // 6. Assemble the final prompt (for now, just join them with newlines)
        // A more advanced system could use an 'order' field.
        const composedText = contentPieces.map(p => p.promptText).join('\n\n');

        return composedText;

    } catch (error) {
        console.error(`Failed to get composed prompt for '${systemId}':`, error);
        return null;
    }
}
