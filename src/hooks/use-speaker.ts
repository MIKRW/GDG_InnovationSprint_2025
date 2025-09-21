
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { textToSpeech } from '@/ai/flows/tts-flow';

const SPEAKER_SETTINGS_KEY = 'speaker-settings';

interface SpeakerSettings {
    isSpeakerOn: boolean;
    isAutoPlayOn: boolean;
}

export function useSpeaker(narrationText: string) {
    const [settings, setSettings] = useState<SpeakerSettings>({
        isSpeakerOn: true,
        isAutoPlayOn: true,
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioDataUriRef = useRef<string | null>(null);
    
    useEffect(() => {
        // Initialize audio element on client
        audioRef.current = new Audio();
        audioRef.current.onplay = () => setIsPlaying(true);
        audioRef.current.onpause = () => setIsPlaying(false);
        audioRef.current.onended = () => setIsPlaying(false);

        // Load settings from localStorage
        const savedSettings = localStorage.getItem(SPEAKER_SETTINGS_KEY);
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(parsed);
            } catch (e) {
                console.error("Failed to parse speaker settings:", e);
            }
        } else {
            // If no settings, this is likely the first run, so speaker is on.
            setSettings({ isSpeakerOn: true, isAutoPlayOn: true });
            localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify({ isSpeakerOn: true, isAutoPlayOn: true }));
        }
    }, []);

    const fetchAndCacheAudio = useCallback(async () => {
        if (!narrationText || !settings.isSpeakerOn) return;
        setIsLoading(true);
        try {
            const response = await textToSpeech(narrationText);
            audioDataUriRef.current = response.audioDataUri;
            return response.audioDataUri;
        } catch (error) {
            console.error("Failed to fetch narration audio:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [narrationText, settings.isSpeakerOn]);

    useEffect(() => {
        // Auto-play logic
        if (settings.isAutoPlayOn && settings.isSpeakerOn) {
            fetchAndCacheAudio().then((audioUri) => {
                 if (audioUri && audioRef.current) {
                    audioRef.current.src = audioUri;
                    audioRef.current.play().catch(e => console.error("Audio autoplay failed:", e));
                }
            });
        }
    }, [settings.isAutoPlayOn, settings.isSpeakerOn, narrationText, fetchAndCacheAudio]);

    const playNarration = useCallback(() => {
        if (!settings.isSpeakerOn) {
            // If speaker is off, toggle it on. The autoplay is handled separately.
             setSettings(prev => {
                const newSettings = { ...prev, isSpeakerOn: true };
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
                return newSettings;
            });
            // After turning it on, play the sound.
            if(audioDataUriRef.current && audioRef.current){
                audioRef.current.play().catch(e => console.error("Failed to play narration:", e));
            }
            return;
        };

        if (isPlaying && audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        } else if (audioDataUriRef.current && audioRef.current) {
            if (audioRef.current.src !== audioDataUriRef.current) {
                 audioRef.current.src = audioDataUriRef.current;
            }
            audioRef.current.play().catch(e => console.error("Failed to play narration:", e));
        } else if (!audioDataUriRef.current) {
            // If audio wasn't fetched yet, fetch and then play
            fetchAndCacheAudio().then((audioUri) => {
                if (audioUri && audioRef.current) {
                    audioRef.current.src = audioUri;
                    audioRef.current.play().catch(e => console.error("Failed to play narration after fetch:", e));
                }
            })
        }
    }, [isPlaying, settings.isSpeakerOn, fetchAndCacheAudio]);

    const toggleSpeaker = useCallback(() => {
        setSettings(prev => {
            const newSettings = { ...prev, isSpeakerOn: !prev.isSpeakerOn };
            localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
            if (!newSettings.isSpeakerOn && audioRef.current) {
                audioRef.current.pause();
            }
            return newSettings;
        });
    }, []);

    const toggleAutoPlay = useCallback(() => {
        setSettings(prev => {
            const newSettings = { ...prev, isAutoPlayOn: !prev.isAutoPlayOn };
            localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);


    return {
        isSpeakerOn: settings.isSpeakerOn,
        isAutoPlayOn: settings.isAutoPlayOn,
        isPlaying,
        isLoading,
        toggleSpeaker,
        toggleAutoPlay,
        playNarration,
    };
}
