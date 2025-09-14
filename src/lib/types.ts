

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
    imagePrompt: string;
    audioUrl?: string;
    isMystery: boolean;
    latitude?: number;
    longitude?: number;
    locationDescription?: string;
    weather?: string; // e.g., 'Clear, 15°C, light breeze'
    season?: string; // e.g., 'Summer'
    mode: AppMode; // To differentiate between 'newbie' and 'twitcher' data
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

    