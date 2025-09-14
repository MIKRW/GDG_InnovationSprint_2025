

// This file can be used to define shared types and interfaces.

export type ThemeColor = {
  h: number;
  s: number;
  l: number;
};

export type Theme = {
  id: string;
  words: {
    word1: string;
    word2: string;
    word3: string;
    mood: string;
  };
  colors: {
    background: ThemeColor;
    foreground: ThemeColor;
    primary: ThemeColor;
    ring: ThemeColor;
  };
  isActive: boolean;
};

export type BirdLog = {
    id: string;
    sessionId: string; // All logs from one recording event share this ID
    analysisRunId: string; // The ID of the corresponding document in `all_analysis_runs`
    userId: string;
    timestamp: string; // ISO 8601 string in UTC
    commonName: string;
    scientificName: string;
    family?: string;
    order?: string;
    description: string;
    imageUrl: string; // URL to the canonical image in Firebase Storage
    userImageUrl?: string; // URL to a user-uploaded image for this specific log
    imagePrompt: string; // The prompt used to generate the image, for metadata
    audioUrl?: string;
    isMystery: boolean;
    status: 'active' | 'trashed'; // Replaces isDisowned
    latitude?: number;
    longitude?: number;
    locationDescription?: string;
    weather?: string; // e.g., 'Clear, 15°C, light breeze'
    season?: string; // e.g., 'Summer'
    mode: AppMode; // To differentiate between 'newbie' and 'twitcher' data
}

export type AnalysisRun = {
  id: string;
  timestamp: string;
  userId: string;
  sessionId: string;
  inputAudioUrl: string;
  inputAudioStoragePath: string;
  habitatPhotoUrl?: string; // Path to user's uploaded habitat photo
  locationData?: {
    latitude?: number;
    longitude?: number;
    locationDescription?: string;
  };
  analysisMethod: string;
  aiResult: {
    isBirdSong: boolean;
    commonName?: string;
    scientificName?: string;
    family?: string;
    order?: string;
    description?: string;
    imagePrompt?: string;
    weather?: string;
    season?: string;
    confidence?: number;
  };
  wasSuccessful: boolean;
  wasSavedByUser: boolean;
  isDeveloperData: boolean;
  mode: AppMode;
  userFeedback?: {
      aiWasCorrect: boolean;
      userProvidedIdentification?: string; // e.g., a birdId
      timestamp: string;
  };
  dataQualityScore?: number;
  recordingLengthSeconds?: number;
  analysisTimings?: {
    primaryIdentificationMs?: number;
    // This structure can be expanded with more detailed timings later
  };
  // Fields for dev test runs
  birdId?: string;
  testAudioId?: string;
}

export type BirdSpeciesData = {
    id: string; // kebab-case common name, e.g., 'australian-magpie'
    commonName: string;
    scientificName: string;
    canonicalImageUrls?: {
      key?: string; // Main, clear shot
      side_profile?: string;
      male?: string;
      female?: string;
    };
}


export type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

export type LocationSetting = 'device' | 'manual' | 'description' | 'privacy';

export type LocationSettings = {
  mode: LocationSetting;
  manual: {
    latitude: number;
    longitude: number;
  };
  description: string;
  privacy: {
    isOutside: boolean;
  };
};

export type AppMode = 'newbie' | 'twitcher';

export type AppSettings = {
  mode: AppMode;
};

/**
 * Defines the structure for a single test audio file's metadata.
 * This data is fetched from the 'birds' collection in Firestore.
 */
export interface TestAudioMetadata {
  id: string;
  fileName: string;
  storagePath: string; // The path to the file in Firebase Storage
  description: string;
  sourceUrl: string;
  author: string;
  license: string;
  hardware: string;
  location: string;
  // These are added client-side for context when running tests
  birdId: string; 
  testAudioId: string;
  genus: string;
  species: string;
  scientificName: string;
  family: string;
  order: string;
}

// Prompt Management System Types

export interface PromptSystem {
    id: string; // e.g., 'bird-identifier-ai'
    name: string;
    description: string;
    activeVersion: string; // e.g., 'v1.1'
}

export interface PromptVersion {
    id: string; // e.g., 'bird-identifier-ai-v1.1'
    systemId: string;
    version: string;
    timestamp: string;
    composedPrompts: Record<string, string>; // Maps categoryId to a prompt_content document ID
}

export interface PromptContent {
    id: string; // e.g., 'location_handling_v1.2'
    systemId: string;
    categoryId: string; // e.g., 'location_handling'
    version: number;
    timestamp: string;
    promptText: string;
    previousVersionId?: string;
}
