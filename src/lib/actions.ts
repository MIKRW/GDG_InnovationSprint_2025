
'use server';

import { ref as storageRef, uploadBytes, getDownloadURL, uploadString, getMetadata } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, writeBatch } from 'firebase/firestore';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { TestAudioMetadata, BirdLog, PromptContent, PromptVersion, PromptSystem } from './types';
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

// PROMPT MANAGEMENT ACTIONS

interface SavePromptInput {
    promptPath: string;
    promptContent: string;
}

/**
 * Saves a simple prompt file to Firebase Storage. Used for non-versioned, single-file prompts.
 */
export async function savePrompt({ promptPath, promptContent }: SavePromptInput) {
    const promptRef = storageRef(storage, promptPath);
    const textAsBlob = new Blob([promptContent], { type: 'text/plain' });
    await uploadBytes(promptRef, textAsBlob);
    return { success: true };
}


interface SavePromptContentInput {
    systemId: string;
    categoryId: string;
    promptText: string;
    previousVersionId?: string;
}

/**
 * Creates a new, versioned document in the `prompt_content` collection.
 */
export async function savePromptContent(data: SavePromptContentInput): Promise<PromptContent> {
    const { systemId, categoryId, promptText, previousVersionId } = data;

    // 1. Find the latest version number for this category
    const contentQuery = query(
        collection(db, 'prompt_content'),
        where('systemId', '==', systemId),
        where('categoryId', '==', categoryId),
        orderBy('version', 'desc')
    );
    const contentSnapshot = await getDocs(contentQuery);
    const latestVersion = contentSnapshot.docs[0]?.data()?.version || 0;
    const newVersionNumber = latestVersion + 1;

    // 2. Create the new prompt content document
    const newContentRef = doc(collection(db, 'prompt_content'));
    const newContent: PromptContent = {
        id: newContentRef.id,
        systemId,
        categoryId,
        version: newVersionNumber,
        promptText,
        timestamp: new Date().toISOString(),
        previousVersionId: previousVersionId,
    };

    await setDoc(newContentRef, newContent);

    return newContent;
}


interface PublishNewPromptVersionInput {
    systemId: string;
    composedPrompts: Record<string, string>;
    previousVersion?: string;
}

/**
 * Creates a new "overarching AI" version document and updates the system's activeVersion.
 */
export async function publishNewPromptVersion(data: PublishNewPromptVersionInput): Promise<PromptVersion> {
    const { systemId, composedPrompts, previousVersion } = data;

    // 1. Determine new version string (e.g., v1.0 -> v1.1 or v1.9 -> v2.0)
    let newVersionString = 'v1.0';
    if (previousVersion) {
        const parts = previousVersion.substring(1).split('.').map(Number);
        parts[parts.length - 1] += 1;
        newVersionString = 'v' + parts.join('.');
    }

    // 2. Create the new prompt_versions document
    const newVersionRef = doc(collection(db, 'prompt_versions'));
    const newVersion: PromptVersion = {
        id: newVersionRef.id,
        systemId,
        version: newVersionString,
        timestamp: new Date().toISOString(),
        composedPrompts,
    };
    
    // 3. Use a batch write to update both the new version and the system's activeVersion
    const batch = writeBatch(db);
    batch.set(newVersionRef, newVersion);

    const systemRef = doc(db, 'prompt_systems', systemId);
    const systemSnap = await getDoc(systemRef);
    if(systemSnap.exists()) {
        batch.update(systemRef, { activeVersion: newVersionString });
    } else {
        // If the system doesn't exist, create it.
        const systemData: Partial<PromptSystem> = {
            id: systemId,
            name: `${kebabCase(systemId).replace(/-/g, ' ')}`, // Generate a name
            description: `Manages prompts for the ${systemId} AI.`,
            activeVersion: newVersionString
        };
        batch.set(systemRef, systemData);
    }
    
    await batch.commit();

    return newVersion;
}

    