
'use client';

const SPEAKER_SETTINGS_KEY = 'speaker-settings';

export interface SpeakerSettings {
    isSpeakerOn: boolean;
    isAutoPlayOn: boolean;
}

// Export default settings for SSR
export const defaultSettings: SpeakerSettings = {
    isSpeakerOn: true,
    isAutoPlayOn: true,
};

let settings: SpeakerSettings = { ...defaultSettings };

// This function will be the canonical way to get the snapshot on the client
function getClientSnapshot(): SpeakerSettings {
    try {
        const savedSettings = localStorage.getItem(SPEAKER_SETTINGS_KEY);
        if (savedSettings) {
            // Merge with defaults to ensure all keys are present
            return { ...defaultSettings, ...JSON.parse(savedSettings) };
        }
        return defaultSettings;
    } catch (e) {
        console.error("Failed to parse speaker settings from localStorage", e);
        return defaultSettings;
    }
}

// Initialize settings on the client side
if (typeof window !== 'undefined') {
    settings = getClientSnapshot();
}

export function getSpeakerSettings(): SpeakerSettings {
    // During client hydration, this might be called before the store is fully initialized.
    // The useSyncExternalStore will handle providing the correct snapshot.
    return settings;
}

export function setSpeakerSettings(newSettings: Partial<SpeakerSettings>) {
    // Update the in-memory settings immediately
    settings = { ...settings, ...newSettings };
    try {
        // Persist to localStorage
        localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(settings));
        // Dispatch a custom event to notify listeners of the change.
        window.dispatchEvent(new CustomEvent('speaker-settings-change'));
    } catch (e) {
        console.error("Failed to save speaker settings to localStorage", e);
    }
}
