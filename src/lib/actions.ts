
'use server';

import { ref as storageRef, uploadBytes, getDownloadURL, uploadString, getMetadata, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, writeBatch, deleteDoc } from 'firebase/firestore';
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

/**
 * Fetches all defined AI prompt systems from Firestore.
 */
export async function getPromptSystems(): Promise<PromptSystem[]> {
    const systemsRef = collection(db, 'prompt_systems');
    const q = query(systemsRef, orderBy('name'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptSystem));
}

/**
 * Fetches all saved versions for a specific prompt system.
 */
export async function getPromptVersionsForSystem(systemId: string): Promise<PromptVersion[]> {
    const versionsRef = collection(db, 'prompt_versions');
    const q = query(versionsRef, where('systemId', '==', systemId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }

    const versions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptVersion));
    
    // Sort versions using semantic versioning logic
    versions.sort((a, b) => {
        if (typeof a.version !== 'string' || !a.version.startsWith('v')) return 1;
        if (typeof b.version !== 'string' || !b.version.startsWith('v')) return -1;

        const verA = a.version.substring(1).split('.').map(Number);
        const verB = b.version.substring(1).split('.').map(Number);
    
        if (verA[0] !== verB[0]) return verB[0] - verA[0];
        if (verA[1] !== verB[1]) return verB[1] - verA[1];
        return verB[2] - verA[2];
    });
    
    return versions;
}


/**
 * Fetches all prompt content pieces for a given system, sorted by version.
 */
export async function getPromptContentForSystem(systemId: string): Promise<PromptContent[]> {
    const contentRef = collection(db, 'prompt_content');
    const q = query(contentRef, where('systemId', '==', systemId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    
    const contents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptContent));

    // Sort by version descending (e.g., v1.1.0, v1.0.0)
    contents.sort((a, b) => {
        try {
            if (typeof a.version !== 'string' || !a.version.startsWith('v')) return 1;
            if (typeof b.version !== 'string' || !b.version.startsWith('v')) return -1;
            
            const versionA = a.version.substring(1).split('.').map(Number);
            const versionB = b.version.substring(1).split('.').map(Number);
        
            if (versionA[0] !== versionB[0]) return versionB[0] - versionA[0];
            if (versionA[1] !== versionB[1]) return versionB[1] - versionA[1];
            return versionB[2] - versionA[2];
        } catch (e) {
            console.error("Failed to parse versions for sorting:", a, b, e);
            return 0; // Don't change order if parsing fails
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
 */
export async function getAppAIVersions(): Promise<AppAIVersion[]> {
    const versionsRef = collection(db, 'app_ai_versions');
    const q = query(versionsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppAIVersion));
}

/**
 * Sets the live (active) App AI Version for the entire application.
 * @param versionId The ID of the AppAIVersion document to set as live.
 */
export async function setLiveAppAIVersion(versionId: string): Promise<void> {
    const configRef = doc(db, 'app_ai_config', 'main');
    await setDoc(configRef, { activeAppAIVersion: versionId }, { merge: true });
}

/**
 * Creates a new App AI Version document in Firestore and sets it as the live version.
 * @param version The version string, e.g., "v1.2.3".
 * @param systems A map of system IDs to their selected prompt version IDs.
 * @returns The newly created AppAIVersion object.
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
 * @param systemId The ID of the PromptSystem document to update.
 * @param version The version string (e.g., 'v1.2') to set as active.
 */
export async function setLivePromptSystemVersion(systemId: string, version: string): Promise<void> {
    const systemRef = doc(db, 'prompt_systems', systemId);
    await updateDoc(systemRef, { activeVersion: version });
}

/**
 * Publishes a new version of a specific Prompt System.
 * @param systemId The ID of the system this version belongs to.
 * @param version The new version string (e.g., "v1.2.3").
 * @param composedPrompts A map of category IDs to content IDs.
 * @returns The newly created PromptVersion object.
 */
export async function publishNewPromptVersion(
    systemId: string,
    version: string,
    composedPrompts: { [categoryId: string]: string }
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
 * @returns The newly created PromptContent object.
 */
export async function publishNewPromptContent(input: PublishNewPromptContentInput): Promise<PromptContent> {
    const { systemId, categoryId, version, promptText, previousVersionId } = input;
    
    // Create a deterministic ID for the content
    const newId = `${categoryId}_${version.replace(/\./g, '-')}`;
    const contentRef = doc(db, 'prompt_content', newId);

    const newContentData: Omit<PromptContent, 'id'> = {
        systemId,
        categoryId,
        version,
        promptText,
        timestamp: new Date().toISOString(),
        previousVersionId: previousVersionId || undefined,
    };

    await setDoc(contentRef, newContentData);

    return { id: newId, ...newContentData };
}
