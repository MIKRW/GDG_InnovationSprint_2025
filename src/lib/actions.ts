

'use server';

import { ref as storageRef, uploadBytes, getDownloadURL, uploadString, getMetadata, deleteObject } from 'firebase/storage';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, query, where, getDocs, orderBy, writeBatch, deleteDoc } from 'firebase/firestore';
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
    isDraft?: boolean;
}

/**
 * Creates or updates a versioned document in the `prompt_content` collection.
 * Can save as a permanent version or as a single, overwritable draft.
 */
export async function savePromptContent(data: SavePromptContentInput): Promise<PromptContent> {
    const { systemId, categoryId, promptText, isDraft = false } = data;

    if (isDraft) {
        // Saving a draft. We use a consistent ID to overwrite it.
        const draftId = `draft_${systemId}_${categoryId}`;
        const draftRef = doc(db, 'prompt_content', draftId);
        
        const draftContent: PromptContent = {
            id: draftId,
            systemId,
            categoryId,
            version: 0, // Version 0 signifies a draft
            promptText,
            timestamp: new Date().toISOString(),
        };

        await setDoc(draftRef, draftContent);
        return draftContent;

    } else {
        // Saving a permanent version
        const contentQuery = query(
            collection(db, 'prompt_content'),
            where('systemId', '==', systemId),
            where('categoryId', '==', categoryId),
        );
        const contentSnapshot = await getDocs(contentQuery);
        const publishedVersions = contentSnapshot.docs
            .map(doc => doc.data() as PromptContent)
            .filter(c => c.version > 0);
        
        const latestVersionNumber = publishedVersions.reduce((max, c) => Math.max(max, c.version), 0);
        const newVersionNumber = latestVersionNumber + 1;

        const newContentRef = doc(collection(db, 'prompt_content'));
        const newContent: PromptContent = {
            id: newContentRef.id,
            systemId,
            categoryId,
            version: newVersionNumber,
            promptText,
            timestamp: new Date().toISOString(),
            previousVersionId: publishedVersions.find(c => c.version === latestVersionNumber)?.id,
        };

        await setDoc(newContentRef, newContent);
        
        // After creating a new permanent version, delete the old draft
        const draftId = `draft_${systemId}_${categoryId}`;
        const draftRef = doc(db, 'prompt_content', draftId);
        await deleteDoc(draftRef);

        return newContent;
    }
}


interface PublishNewPromptVersionInput {
    systemId: string;
    composedPrompts: Record<string, string>;
    previousVersion?: string;
    versionType: 'major' | 'minor' | 'patch';
}

/**
 * Creates a new "overarching AI" version document using semantic versioning
 * and updates the system's activeVersion.
 */
export async function publishNewPromptVersion(data: PublishNewPromptVersionInput): Promise<PromptVersion> {
    const { systemId, composedPrompts, previousVersion = 'v0.0.0', versionType } = data;

    // 1. Get all existing versions for the system to calculate the next version correctly.
    const versionsQuery = query(collection(db, 'prompt_versions'), where('systemId', '==', systemId));
    const versionsSnapshot = await getDocs(versionsQuery);
    const existingVersions = versionsSnapshot.docs.map(d => d.data().version as string);

    // 2. Determine new version string based on semantic versioning.
    const [major, minor, patch] = previousVersion.replace('v', '').split('.').map(Number);
    let newMajor = major, newMinor = minor, newPatch = patch;

    if (versionType === 'major') {
        newMajor++;
        newMinor = 0;
        newPatch = 0;
    } else if (versionType === 'minor') {
        newMinor++;
        newPatch = 0;
    } else { // 'patch'
        // Find the highest patch for the current major.minor and increment it.
        const patchVersions = existingVersions
            .filter(v => v.startsWith(`v${major}.${minor}.`))
            .map(v => parseInt(v.split('.')[2] || '0'));
        newPatch = patchVersions.length > 0 ? Math.max(...patchVersions) + 1 : (patch > 0 ? patch + 1 : 1);
    }
    
    const newVersionString = `v${newMajor}.${newMinor}.${newPatch}`;
    const newVersionId = `${systemId}-${newVersionString}`;
    
    // 3. Create the new prompt_versions document
    const newVersion: PromptVersion = {
        id: newVersionId,
        systemId,
        version: newVersionString,
        timestamp: new Date().toISOString(),
        composedPrompts,
    };
    
    // 4. Use a batch write to update both the new version and the system's activeVersion
    const batch = writeBatch(db);
    batch.set(doc(db, 'prompt_versions', newVersionId), newVersion);

    const systemRef = doc(db, 'prompt_systems', systemId);
    const systemSnap = await getDoc(systemRef);
    if(systemSnap.exists()) {
        batch.update(systemRef, { activeVersion: newVersionString });
    } else {
        const systemData: Partial<PromptSystem> = {
            id: systemId,
            name: `${kebabCase(systemId).replace(/-ai/g, '').replace(/-/g, ' ')}`,
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
            const promptVersionDoc = await getDoc(doc(db, 'prompt_versions', promptVersionId));
            if (promptVersionDoc.exists()) {
                systemsToBundle[systemData.id] = promptVersionId;
            }
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
 * This populates the new Firestore prompt management system. This is a self-contained
 * function that uses a direct write batch to avoid read-before-write issues.
 */
export async function seedInitialPrompts() {
    console.log("Starting initial prompt migration from hard-coded values...");

    try {
        const batch = writeBatch(db);
        const timestamp = new Date().toISOString();

        // 1. Define the initial prompt content here
        const newbiePromptText = `You are an expert ornithologist with a special talent for making bird identification accessible and exciting for beginners. Your main goal is to listen to an audio recording and figure out what bird is singing.

Here's the information you'll be working with:
- A timestamp of when the recording was made.
- The audio data itself.
{{#if latitude}}- The user's location (latitude and longitude).{{/if}}
{{#if locationDescription}}- A text description of where the user is.{{/if}}

Your most important job is to identify the bird from its song.

If you are given a location, use it! It's a huge clue. Figure out the geographic area and check reliable bird-watching resources (like government wildlife websites, university research, or digital field guides) to see which birds are expected to be in that specific area during that time of year. If a bird isn't native to the location, it's probably not the right one.

You also have a tool called 'getCurrentWeather'. Please use it to find out the season and weather conditions when the recording was made. You'll need to include this information in your final answer.

For the description, write a fun, interesting fact about the bird that a beginner would enjoy.
For the image prompt, give a simple, clear instruction for an image generator (e.g., "photo of a European Robin perched on a mossy branch").
Also, provide your confidence in the identification.

If you're not confident you heard a bird, or if it's just noise, please indicate that.`;
        
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

If the audio is unclear or the species cannot be determined with high confidence, you must indicate that you did not identify a bird song. Do not guess.`;
        
        const themePromptText = `You are an expert UI theme designer with a deep understanding of color theory, word association, and web accessibility standards (WCAG). Your task is to generate a creative, unique, and aesthetically pleasing HSL color palette based on user input. The user can provide up to three inspirational words and a 'mood'.

Your job is to intelligently assign one word to the background, one to the foreground, and one to the primary accent color. Base your assignments on color theory. For example, a darker, less saturated color is usually best for a background, while a brighter, more saturated color makes a good accent. When choosing colors, base your selections on the real-world colors associated with the input words. You should research how established color brands (like Pantone or paint companies) name their colors.

After selecting the initial colors, use the 'mood' as a strong guideline to modify and adjust the final HSL values. The mood is the most important constraint. Pay special attention to accessibility-related moods.

CRITICAL: You must also consider derived colors. The app uses CSS calculations to create secondary, muted, and accent colors from the three base colors you provide. You MUST generate base colors that result in good contrast for these derived colors as well. For example, the 'foreground' color must be clearly visible on the 'muted' background, which is a lighter shade of the 'primary' color. Always prioritize readability across the entire UI.
`;

        const imagePromptText = `You are an expert image generation prompter. Given a simple prompt (e.g., "photo of an American Robin on a branch"), your job is to enhance it into a rich, detailed prompt for a high-quality image generation model like Imagen. Create a photorealistic, high-quality, and visually appealing image. Consider lighting, composition, and background details.`;
        const weatherToolPromptText = `You are an AI assistant with access to tools. If the user provides a location (either coordinates or a text description), you MUST use the 'getCurrentWeather' tool to get the season and weather conditions for that location and date. Include this information in your final response.`;

        // 2. Prepare all documents for the batch write

        // -- Newbie System --
        const newbieContentId = `newbie_base_instruction_${uuidv4()}`;
        const newbieContentRef = doc(db, 'prompt_content', newbieContentId);
        batch.set(newbieContentRef, { id: newbieContentId, systemId: 'bird-identifier-ai-newbie', categoryId: 'base_instruction', version: 1, promptText: newbiePromptText, timestamp });
        const newbieVersionId = 'bird-identifier-ai-newbie-v1.0.0';
        const newbieVersionRef = doc(db, 'prompt_versions', newbieVersionId);
        batch.set(newbieVersionRef, { id: newbieVersionId, systemId: 'bird-identifier-ai-newbie', version: 'v1.0.0', timestamp, composedPrompts: { 'base_instruction': newbieContentId } });
        const newbieSystemRef = doc(db, 'prompt_systems', 'bird-identifier-ai-newbie');
        batch.set(newbieSystemRef, { id: 'bird-identifier-ai-newbie', name: 'Bird Identifier AI (Newbie)', description: 'Manages prompts for identifying birds in Newbie mode.', activeVersion: 'v1.0.0' });

        // -- Twitcher System --
        const twitcherContentId = `twitcher_base_instruction_${uuidv4()}`;
        const twitcherContentRef = doc(db, 'prompt_content', twitcherContentId);
        batch.set(twitcherContentRef, { id: twitcherContentId, systemId: 'bird-identifier-ai-twitcher', categoryId: 'base_instruction', version: 1, promptText: twitcherPromptText, timestamp });
        const twitcherVersionId = 'bird-identifier-ai-twitcher-v1.0.0';
        const twitcherVersionRef = doc(db, 'prompt_versions', twitcherVersionId);
        batch.set(twitcherVersionRef, { id: twitcherVersionId, systemId: 'bird-identifier-ai-twitcher', version: 'v1.0.0', timestamp, composedPrompts: { 'base_instruction': twitcherContentId } });
        const twitcherSystemRef = doc(db, 'prompt_systems', 'bird-identifier-ai-twitcher');
        batch.set(twitcherSystemRef, { id: 'bird-identifier-ai-twitcher', name: 'Bird Identifier AI (Twitcher)', description: 'Manages prompts for identifying birds in Twitcher mode.', activeVersion: 'v1.0.0' });

        // -- Theme System --
        const themeContentId = `theme_base_instruction_${uuidv4()}`;
        const themeContentRef = doc(db, 'prompt_content', themeContentId);
        batch.set(themeContentRef, { id: themeContentId, systemId: 'theme-generator-ai', categoryId: 'base_instruction', version: 1, promptText: themePromptText, timestamp });
        const themeVersionId = 'theme-generator-ai-v1.0.0';
        const themeVersionRef = doc(db, 'prompt_versions', themeVersionId);
        batch.set(themeVersionRef, { id: themeVersionId, systemId: 'theme-generator-ai', version: 'v1.0.0', timestamp, composedPrompts: { 'base_instruction': themeContentId } });
        const themeSystemRef = doc(db, 'prompt_systems', 'theme-generator-ai');
        batch.set(themeSystemRef, { id: 'theme-generator-ai', name: 'Theme Generation AI', description: 'Manages prompts related to generating UI color themes.', activeVersion: 'v1.0.0' });

        // -- Image System --
        const imageContentId = `image_base_instruction_${uuidv4()}`;
        const imageContentRef = doc(db, 'prompt_content', imageContentId);
        batch.set(imageContentRef, { id: imageContentId, systemId: 'image-generator-ai', categoryId: 'base_instruction', version: 1, promptText: imagePromptText, timestamp });
        const imageVersionId = 'image-generator-ai-v1.0.0';
        const imageVersionRef = doc(db, 'prompt_versions', imageVersionId);
        batch.set(imageVersionRef, { id: imageVersionId, systemId: 'image-generator-ai', version: 'v1.0.0', timestamp, composedPrompts: { 'base_instruction': imageContentId } });
        const imageSystemRef = doc(db, 'prompt_systems', 'image-generator-ai');
        batch.set(imageSystemRef, { id: 'image-generator-ai', name: 'Image Generation AI', description: 'Manages prompts for creating images of identified birds.', activeVersion: 'v1.0.0' });

        // -- Weather Tool System --
        const weatherContentId = `weather_base_instruction_${uuidv4()}`;
        const weatherContentRef = doc(db, 'prompt_content', weatherContentId);
        batch.set(weatherContentRef, { id: weatherContentId, systemId: 'weather-ai-tool', categoryId: 'base_instruction', version: 1, promptText: weatherToolPromptText, timestamp });
        const weatherVersionId = 'weather-ai-tool-v1.0.0';
        const weatherVersionRef = doc(db, 'prompt_versions', weatherVersionId);
        batch.set(weatherVersionRef, { id: weatherVersionId, systemId: 'weather-ai-tool', version: 'v1.0.0', timestamp, composedPrompts: { 'base_instruction': weatherContentId } });
        const weatherSystemRef = doc(db, 'prompt_systems', 'weather-ai-tool');
        batch.set(weatherSystemRef, { id: 'weather-ai-tool', name: 'Weather Analysis AI Tool', description: 'Manages prompts for interpreting weather data for identification.', activeVersion: 'v1.0.0' });

        // -- App AI Version v1.0 --
        const appVersionId = 'v1.0';
        const appVersionRef = doc(db, 'app_ai_versions', appVersionId);
        batch.set(appVersionRef, {
            id: appVersionId,
            version: 'v1.0',
            timestamp,
            systems: {
                'bird-identifier-ai-newbie': newbieVersionId,
                'bird-identifier-ai-twitcher': twitcherVersionId,
                'theme-generator-ai': themeVersionId,
                'image-generator-ai': imageVersionId,
                'weather-ai-tool': weatherVersionId,
            }
        });

        // -- Main Config --
        const configRef = doc(db, 'app_ai_config', 'main');
        batch.set(configRef, { activeAppAIVersion: 'v1.0' });

        // 3. Commit the batch
        await batch.commit();

        console.log("Successfully migrated prompts and published App AI version v1.0.");
        return { success: true, version: 'v1.0' };

    } catch (error) {
        console.error("CRITICAL: Prompt migration failed.", error);
        throw new Error("Failed during prompt migration. Check server logs.");
    }
}
