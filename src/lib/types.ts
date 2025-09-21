

import { type IdentifyBirdOutput as IdentifyBirdOutputType } from "@/ai/flows/contextual-identify-bird-flow";
export type IdentifyBirdOutput = IdentifyBirdOutputType & { error?: string };


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

export type AnalysisRun = {
  id: string;
  creationTime: string;
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
  hardware?: string; // User-specified recording hardware
  analysisMethod: string; // The specific AI system and version used, e.g., 'bird-identifier-newbie-v1.1'
  aiResult: IdentifyBirdOutput;
  wasSuccessful: boolean;
  wasSavedByUser: boolean;
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
  duration: number;
  // These are added client-side for context when running tests
  birdId: string; 
  testAudioId: string;
  genus: string;
  species: string;
  scientificName: string;
  family: string;
  order: string;
}

// =================================================================
// Three-Tiered Prompt Versioning System Types
// =================================================================

/**
 * The global configuration singleton for the application's AI.
 * Stored in `app_ai_config/main`.
 */
export type AppAIConfig = {
    activeAppAIVersion: string; // The ID of the currently live App AI Version.
    developmentAppAIVersion: string; // The ID of the current dev/staging App AI Version.
}

/**
 * Level 1: The global configuration for the entire application's AI.
 * Specifies which version of each overarching AI system is active.
 */
export type AppAIVersion = {
    id: string; // e.g., 'v1-0'
    version: string;
    timestamp: string;
    isDevelopment: boolean; // Flag to distinguish dev versions from live-promotable versions
    systems: {
        [systemId: string]: string; // e.g., { 'bird-identifier-ai-newbie': 'v1.1' }
    };
};

/**
 * Level 2: An overarching AI system (e.g., "Bird Identifier").
 * A manifest that composes multiple prompt categories.
 */
export type PromptSystem = {
    id: string; // e.g., 'bird-identifier-ai-newbie'
    name: string;
    description: string;
    activeVersion: string; // The live version, e.g., 'v1.1.0'
    developmentVersion?: string; // The dev/staging version, e.g., 'v1.2.0-dev'
};

/**
 * A specific, saved version of an overarching AI system.
 */
export type PromptVersion = {
    id: string; // e.g., 'bird-identifier-ai-newbie-v1-1'
    systemId: string;
    version: string; // e.g., 'v1.1'
    timestamp: string;
    isDevelopment?: boolean; // Flag to distinguish dev versions
    composedPrompts: {
        [categoryId: string]: string; // e.g., { 'base_instruction': 'base_instruction_v2' }
    };
};

/**
 * Level 3: The actual text content for a single, versioned piece of a prompt.
 * This is the most granular level.
 */
export type PromptContent = {
    id: string; // e.g., 'location_handling_v1'
    systemId: string;
    categoryId: string; // e.g., 'location_handling'
    version: string; // e.g., 'v1.0.0'
    timestamp: string;
    promptText: string;
    previousVersionId?: string;
};
