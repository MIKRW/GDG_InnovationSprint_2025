
'use server';

import { ref as storageRef, uploadBytes, getDownloadURL, uploadString, getMetadata } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, writeBatch } from 'firebase/firestore';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import type { TestAudioMetadata, BirdLog, PromptContent, PromptVersion, PromptSystem } from './types';
import { EmailAuthProvider, linkWithCredential, type User } from 'firebase/auth';
import { kebabCase } from 'lodash';
import { promises as fs } from 'fs';
import path from 'path';


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
    const newVersionId = `${systemId}-${newVersionString}`;
    const newVersion: PromptVersion = {
        id: newVersionId,
        systemId,
        version: newVersionString,
        timestamp: new Date().toISOString(),
        composedPrompts,
    };
    
    // 3. Use a batch write to update both the new version and the system's activeVersion
    const batch = writeBatch(db);
    batch.set(doc(db, 'prompt_versions', newVersionId), newVersion);

    const systemRef = doc(db, 'prompt_systems', systemId);
    const systemSnap = await getDoc(systemRef);
    if(systemSnap.exists()) {
        batch.update(systemRef, { activeVersion: newVersionString });
    } else {
        // If the system doesn't exist, create it.
        const systemData: Partial<PromptSystem> = {
            id: systemId,
            name: `${kebabCase(systemId).replace(/-ai/g, '').replace(/-/g, ' ')}`, // Generate a name
            description: `Manages prompts for the ${systemId} AI.`,
            activeVersion: newVersionString
        };
        batch.set(systemRef, systemData);
    }
    
    await batch.commit();

    return newVersion;
}


/**
 * Takes the currently active version of EACH AI system and bundles them
 * into a single, new, versioned "App AI". This becomes the new live version
 * for the entire application.
 */
export async function publishNewAppAIVersion() {
    const batch = writeBatch(db);

    // 1. Get the latest version of each AI system
    const systemsQuery = query(collection(db, 'prompt_systems'));
    const systemsSnapshot = await getDocs(systemsQuery);
    const systemsToBundle: Record<string, string> = {};

    for (const systemDoc of systemsSnapshot.docs) {
        const systemData = systemDoc.data() as PromptSystem;
        if (systemData.activeVersion) {
            const promptVersionId = `${systemData.id}-${systemData.activeVersion}`;
            systemsToBundle[systemData.id] = promptVersionId;
        }
    }

    if (Object.keys(systemsToBundle).length === 0) {
        throw new Error("No active AI systems with versions found to publish.");
    }

    // 2. Determine the new App AI Version number
    const configDocRef = doc(db, 'app_ai_config', 'main');
    const configDocSnap = await getDoc(configDocRef);
    let newAppVersionString = 'v1.0';

    if (configDocSnap.exists()) {
        const currentVersion = configDocSnap.data().activeAppAIVersion || 'v0.9';
        const parts = currentVersion.substring(1).split('.').map(Number);
        parts[parts.length - 1] += 1;
        newAppVersionString = 'v' + parts.join('.');
    }

    // 3. Create the new app_ai_versions document
    const newAppVersionRef = doc(db, 'app_ai_versions', newAppVersionString);
    const newAppVersionData = {
        id: newAppVersionString,
        version: newAppVersionString,
        timestamp: new Date().toISOString(),
        systems: systemsToBundle,
    };
    batch.set(newAppVersionRef, newAppVersionData);

    // 4. Update the main config to point to the new version
    batch.set(configDocRef, { activeAppAIVersion: newAppVersionString }, { merge: true });

    await batch.commit();

    return newAppVersionData;
}


/**
 * A one-time server action to seed the initial prompts by hard-coding their content.
 * This populates the new Firestore prompt management system.
 */
export async function seedInitialPrompts() {
    console.log("Starting initial prompt migration from hard-coded values...");

    try {
        // 1. Define the initial prompt content here
        const newbiePromptText = `You are an expert ornithologist with a focus on making bird identification accessible to beginners. Your goal is to analyze an audio recording and provide a clear, confident, and interesting identification.

        You will receive the following information:
        - A UTC timestamp for the recording.
        - Audio data of a potential bird song.
        {{#if latitude}}- Latitude and longitude coordinates.{{/if}}
        {{#if locationDescription}}- A text description of the location.{{/if}}
        
        Your primary task is to identify the bird species from the audio.
        
        If location data (coordinates or description) is provided, you MUST use it to improve accuracy. Determine the geographic area and cross-reference it with reliable ornithological databases (e.g., government wildlife data, university research, established field guides) to understand the expected species for that habitat and season. A bird not native to the area is highly unlikely.
        
        You must also use the provided tool 'getCurrentWeather' to determine the season and weather conditions at the location and time of the recording. Include this information in your response.
        
        Your response MUST be a JSON object with the following structure:
        - isBirdSong: boolean (true if a bird song is detected, otherwise false)
        - commonName: string (e.g., "American Robin")
        - scientificName: string (e.g., "Turdus migratorius")
        - family: string (The bird's taxonomic family)
        - order: string (The bird's taxonomic order)
        - description: string (A brief, engaging fact about the bird suitable for a beginner)
        - imagePrompt: string (A simple prompt for a text-to-image model, e.g., "photo of an American Robin on a branch")
        - confidence: number (A value between 0 and 1 representing your confidence)
        - season: string (The season at the location, from the weather tool)
        - weather: string (A brief summary of the weather, from the weather tool)
        
        If you cannot confidently identify a bird, or if the audio does not contain a bird song, set "isBirdSong" to false and omit the other fields.`;

        const twitcherPromptText = `You are a professional-level ornithologist and bioacoustics analyst. Your task is to perform a rigorous analysis of a high-fidelity audio recording to identify a bird species. Precision and detailed taxonomic information are critical.

        You will receive:
        - A UTC timestamp.
        - High-quality audio data.
        {{#if latitude}}- Precise latitude and longitude coordinates.{{/if}}
        {{#if locationDescription}}- A detailed text description of the location and habitat.{{/if}}
        
        Analysis protocol:
        1.  Treat the audio data as your primary evidence. Analyze its acoustic properties: pitch, tempo, rhythm, and spectral characteristics.
        2.  Use provided location data (coordinates are the highest authority) as a strict filter. Consult professional, scientific sources (e.g., eBird Status and Trends, IUCN Red List maps, regional scientific papers) to confirm the species' presence and breeding status at the given coordinates and time of year.
        3.  Call the 'getCurrentWeather' tool to get environmental context. This is secondary data but can be used to support your analysis.
        4.  Provide a confidence score based on the clarity of the recording and the strength of the match against known vocalizations and geographic range.
        
        Your response MUST be a JSON object adhering to this schema:
        - isBirdSong: boolean
        - commonName: string
        - scientificName: string
        - family: string
        - order: string
        - description: string (A detailed description of the call type, e.g., "This appears to be a territorial song, characterized by...")
        - imagePrompt: string ("scientific illustration of [scientificName]")
        - confidence: number (0-1)
        - season: string
        - weather: string
        
        If the audio is unclear or the species cannot be determined with high confidence, set "isBirdSong" to false. Do not guess.`;

        const themePromptText = await fs.readFile(path.join(process.cwd(), 'src', 'ai', 'prompts', 'theme-generation-prompt.txt'), 'utf-8');

        // 2. Create Prompt Content v1 for each
        const newbieContent = await savePromptContent({ systemId: 'bird-identifier-ai-newbie', categoryId: 'base_instruction', promptText: newbiePromptText });
        const twitcherContent = await savePromptContent({ systemId: 'bird-identifier-ai-twitcher', categoryId: 'base_instruction', promptText: twitcherPromptText });
        const themeContent = await savePromptContent({ systemId: 'theme-generator-ai', categoryId: 'base_instruction', promptText: themePromptText });

        // 3. Publish v1.0 of each AI System
        await publishNewPromptVersion({ systemId: 'bird-identifier-ai-newbie', composedPrompts: { 'base_instruction': newbieContent.id } });
        await publishNewPromptVersion({ systemId: 'bird-identifier-ai-twitcher', composedPrompts: { 'base_instruction': twitcherContent.id } });
        await publishNewPromptVersion({ systemId: 'theme-generator-ai', composedPrompts: { 'base_instruction': themeContent.id } });
        
        // 4. Publish App AI v1.0
        const appVersion = await publishNewAppAIVersion();

        console.log(`Successfully migrated prompts and published App AI version ${appVersion.version}.`);

        return { success: true, version: appVersion.version };
    } catch (error) {
        console.error("CRITICAL: Prompt migration failed.", error);
        throw new Error("Failed during prompt migration. Check server logs.");
    }
}
