




'use server';

import { ref as storageRef, uploadBytes, getDownloadURL, uploadString, getMetadata, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, writeBatch, deleteDoc } from 'firebase/firestore';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { TestAudioMetadata, BirdLog, PromptSystem, PromptVersion, AppAIVersion, AppAIConfig } from './types';
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
    // We remove the orderBy clause to avoid needing a composite index for this specific query.
    // We will sort the data manually in the code.
    const q = query(versionsRef, where('systemId', '==', systemId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }

    const versions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PromptVersion));
    
    // Sort the versions by timestamp in descending order (newest first) in the server action.
    versions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return versions;
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
    const newVersionId = version.replace('v', '').replace(/\./g, '-');
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
