

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
