

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

export async function createNewPromptSystem(transaction: any, data: { systemId: string, name: string, description: string }): Promise<void> {
    const { systemId, name, description } = data;
    const systemRef = doc(db, 'prompt_systems', systemId);

    let initialPromptText = `You are a world-class AI. Your purpose is to provide accurate and helpful responses.`;
    if (systemId === 'bird-identifier-ai-newbie') {
        initialPromptText = `You are an expert ornithologist AI. Your purpose is to identify bird species from audio recordings and contextual data with the highest possible accuracy.

You will be given a JSON object containing the audio, location, and other metadata. You MUST analyze this data to determine if a bird song is present and, if so, identify the species.

**Evidence Hierarchy:**
You MUST prioritize evidence in this order:
1.  **Habitat Photo (\`habitatPhotoDataUri\`):** This is the primary source of truth for the habitat.
2.  **Habitat Description (\`habitatDescription\`):** The user's text description is the second most important piece of evidence.
3.  **GPS Coordinates & Weather:** Use latitude/longitude and weather data (retrieved via the \`getCurrentWeather\` tool) as a fallback or to supplement the user's direct input.

**Tool Usage:**
- If latitude and longitude are provided, you SHOULD use the \`getCurrentWeather\` tool to get historical weather data for that location and date. This will help you determine the season and conditions, which can be crucial for identification.

**Output Requirements:**
Your response MUST be a single, valid JSON object that strictly follows this structure:

-   \`isBirdSong\` (boolean): Set to \`true\` if a bird song is detected, otherwise \`false\`.
-   \`commonName\` (string, optional): The common name of the bird (e.g., 'American Robin'). Required if \`isBirdSong\` is true.
-   \`scientificName\` (string, optional): The scientific name (e.g., 'Turdus migratorius'). Required if \`isBirdSong\` is true.
-   \`family\` (string, optional): The taxonomic family (e.g., 'Turdidae').
-   \`order\` (string, optional): The taxonomic order (e.g., 'Passeriformes').
-   \`description\` (string, optional): A brief, interesting fact about the bird.
-   \`imagePrompt\` (string, optional): A simple, descriptive prompt for a text-to-image model (e.g., "photo of an American Robin on a branch").
-   \`confidence\` (number, optional): Your confidence in the identification, from 0 to 1.
-   \`season\` (string, optional): The season at the recording location.
-   \`weather\` (string, optional): A brief summary of weather conditions.
-   \`aiGeneratedHabitatTags\` (array of strings, optional): Generate structured tags describing the habitat based on your analysis of all available evidence (photo, text, location). Example: \`["forest", "creek", "eucalyptus", "temperate", "summer"]\`.

**Error Handling:**
- If you cannot discern a bird song, you MUST set \`isBirdSong\` to \`false\` and omit the other optional fields.`;
    } else if (systemId === 'theme-generator-ai') {
        initialPromptText = `You are an expert UI/UX designer and color theorist with a deep understanding of web accessibility standards (WCAG).

Your task is to create a well-balanced and aesthetically pleasing four-color theme palette for a web application, based on user-provided inputs. The output MUST be a valid JSON object.

INPUTS:
You will be given three inspirational words (word1, word2, word3) and a mood (mood). The words are your primary creative source for the colors.

OUTPUT FORMAT:
You must output your response as a valid JSON object. The root object must contain four keys: 'background', 'foreground', 'primary', and 'ring'. Each of these keys must contain an object with three numerical properties: 'h' (0-360), 's' (0-100), and 'l' (0-100). Do not add any commentary or explanation outside of the JSON object.

CORE RULES & CONSTRAINTS:
1.  **Word-to-Color Logic:** Intelligently assign the inspirational words to the background, foreground, and primary colors. Consider design best practices. For example, a word like 'sky' is better for a background than 'fire'. A word like 'charcoal' is a good candidate for a foreground (text) color. A vibrant word like 'sunset' might be a good primary accent color.
2.  **Mood Application:** After establishing a base palette from the words, you MUST adjust the final HSL values based on the 'mood' keyword.
    *   'Vibrant': Increase saturation (s) for bright, vivid colors.
    *   'Calm': Decrease saturation (s) for more muted, soothing colors.
    *   'Dark': The background 'l' value must be very low (e.g., < 15), and the foreground 'l' value must be very high (e.g., > 85).
    *   'High Contrast': Prioritize a very high contrast ratio between background and foreground/primary colors. This is the most important accessibility constraint.
    *   '*-Friendly' (e.g., 'Tritanopia-Friendly'): Adjust hues to avoid color combinations that are difficult for users with specific types of color blindness to distinguish.
3.  **Accessibility First:** CRITICAL RULE: The final color palette MUST be accessible. There must be a very high contrast ratio between the background color and both the foreground and primary colors to ensure readability. The text color (foreground) on the main accent color (primary) must also be readable.
4.  **Ring Color:** The 'ring' color is crucial for user interaction highlights (like focus rings). It MUST be a derivative of the 'primary' color. To ensure it's always visible, its lightness ('l') value should be at least 15-20% lighter or darker than the primary color's lightness.
5.  **Derived Colors:** Be aware that the application's CSS will automatically generate secondary, muted, and accent colors by adjusting the lightness of your chosen primary and background colors. Your choices must result in a harmonious and readable palette even after these automatic adjustments.

Example Input: { "word1": "ocean", "word2": "sand", "word3": "sun", "mood": "Vibrant" }
Your response should be a single, raw JSON object and nothing else.`;
    }
    
    const defaultContentId = `${systemId}_base_instruction_v1-0-0`;
    const contentRef = doc(db, 'prompt_content', defaultContentId);
    transaction.set(contentRef, {
        systemId,
        categoryId: 'base_instruction',
        version: 'v1.0.0',
        promptText: initialPromptText,
        timestamp: new Date().toISOString(),
    });

    const defaultVersionId = `${systemId}-v1-0-0`;
    const versionRef = doc(db, 'prompt_versions', defaultVersionId);
    transaction.set(versionRef, {
        systemId,
        version: 'v1.0.0',
        composedPrompts: { base_instruction: defaultContentId },
    });

    const newSystemData: Omit<PromptSystem, 'id'> = {
        name,
        description,
        activeVersion: 'v1.0.0',
        developmentVersion: 'v1.0.0',
    };
    transaction.set(systemRef, newSystemData);
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
    let q = query(versionsRef, orderBy('timestamp', 'desc'));

    if (type === 'dev') {
        q = query(q, where('isDevelopment', '==', true));
    } else if (type === 'live') {
        q = query(q, where('isDevelopment', '==', false));
    }

    const snapshot = await getDocs(q);
    
    if (snapshot.empty && type === 'all') { // Only seed if the entire collection is empty
        console.log("No App AI Systems found. Creating defaults for live and dev.");
        
        await runTransaction(db, async (transaction) => {
            // Create default AI Types if they don't exist
            await createNewPromptSystem(transaction, { 
                systemId: 'bird-identifier-ai-newbie', 
                name: "Bird Identifier AI (Newbie)",
                description: "Manages prompts for identifying birds in Newbie mode.",
            });
            await createNewPromptSystem(transaction, { 
                systemId: 'theme-generator-ai', 
                name: "AI Theme Generator",
                description: "Manages prompts for generating UI color themes.",
            });
            
            // Define the default system compositions
            const defaultSystems = { 
                'bird-identifier-ai-newbie': 'bird-identifier-ai-newbie-v1-0-0', 
                'theme-generator-ai': 'theme-generator-ai-v1-0-0' 
            };
            
            // Create default live App AI Version
            const liveVersionRef = doc(db, 'app_ai_versions', 'v1.0.0');
            transaction.set(liveVersionRef, {
                version: 'v1.0.0',
                isDevelopment: false,
                timestamp: new Date().toISOString(),
                systems: defaultSystems,
            });

            // Create default dev App AI Version
            const devVersionRef = doc(db, 'app_ai_versions', 'v1.0.0-dev');
            transaction.set(devVersionRef, {
                version: 'v1.0.0-dev',
                isDevelopment: true,
                timestamp: new Date().toISOString(),
                systems: defaultSystems,
            });

            // Set the main config to point to these new defaults
            const configRef = doc(db, 'app_ai_config', 'main');
            transaction.set(configRef, {
                activeAppAIVersion: 'v1.0.0',
                developmentAppAIVersion: 'v1.0.0-dev'
            });
        });

        // After creating, refetch everything to return the correct data.
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
            // 1. Get the global AI config to find which top-level version to use.
            const appAIConfig = await getAppAIConfig();
            if (!appAIConfig) throw new Error("App AI Systems config not found.");

            const appAIVersionId = isDevMode 
                ? appAIConfig.developmentAppAIVersion 
                : appAIConfig.activeAppAIVersion;
            
            if (!appAIVersionId) {
                throw new Error(`No ${isDevMode ? 'development' : 'active'} App AI Version is set.`);
            }

            // 2. Get the App AI System document (the manifest).
            const appAIVersionRef = doc(db, 'app_ai_versions', appAIVersionId);
            const appAIVersionSnap = await getDoc(appAIVersionRef);
            if (!appAIVersionSnap.exists()) {
                throw new Error(`App AI Version document '${appAIVersionId}' not found.`);
            }
            const appAIVersion = appAIVersionSnap.data() as AppAIVersion;

            // 3. From that, find the ID of the AI Type Version for the requested systemId.
            const promptSystemVersionId = appAIVersion.systems[systemId];
            if (!promptSystemVersionId) {
                throw new Error(`AI Type '${systemId}' is not defined in App AI Version '${appAIVersionId}'.`);
            }
            
            // 4. Get the AI Type Version document (the "recipe").
            const promptVersionRef = doc(db, 'prompt_versions', promptSystemVersionId);
            const promptVersionSnap = await getDoc(promptVersionRef);
            if (!promptVersionSnap.exists()) {
                throw new Error(`AI Type Version document '${promptSystemVersionId}' not found.`);
            }
            const promptVersionData = promptVersionSnap.data() as PromptVersion;

            // 5. Get all the individual Prompt Content documents from the recipe.
            const contentIds = Object.values(promptVersionData.composedPrompts);
            if (contentIds.length === 0) {
                 throw new Error(`AI Type Version '${promptSystemVersionId}' has no prompt content defined.`);
            }
            const contentPromises = contentIds.map(id => getDoc(doc(db, 'prompt_content', id)));
            const contentSnaps = await Promise.all(contentPromises);

            // 6. Assemble the final prompt text.
            const composedText = contentSnaps.map(snap => {
                if (!snap.exists()) throw new Error(`Required prompt content document with ID '${snap.ref.id}' is missing.`);
                return (snap.data() as PromptContent).promptText;
            }).join('\n\n');
            
            // Return both the prompt and the top-level version string for logging.
            return { prompt: composedText, version: appAIVersionId };

        } catch (error) {
            console.error(`Failed to get composed prompt for '${systemId}':`, error);
            return null; 
        }
    },
    ['composed-prompts-v6'], { revalidate: 30, tags: ['prompts'] }
);







