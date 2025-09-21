
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
        
        const handlePlay = () => setIsPlaying(true);
        const handleEnd = () => setIsPlaying(false);

        const audioEl = audioRef.current;
        audioEl.addEventListener('play', handlePlay);
        audioEl.addEventListener('ended', handleEnd);
        audioEl.addEventListener('pause', handleEnd);

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

        return () => {
            audioEl.removeEventListener('play', handlePlay);
            audioEl.removeEventListener('ended', handleEnd);
            audioEl.removeEventListener('pause', handleEnd);
            // Ensure audio is stopped on unmount
            if (audioEl) {
              audioEl.pause();
              audioEl.src = '';
            }
        }
    }, []);

    const fetchAndCacheAudio = useCallback(async (shouldPlay: boolean) => {
        if (!narrationText || !settings.isSpeakerOn || audioDataUriRef.current) return;
        setIsLoading(true);
        try {
            const response = await textToSpeech(narrationText);
            audioDataUriRef.current = response.audioDataUri;
            if (shouldPlay && audioRef.current) {
                audioRef.current.src = response.audioDataUri;
                audioRef.current.play().catch(e => console.error("Audio playback failed after fetch:", e));
            }
            return response.audioDataUri;
        } catch (error) {
            console.error("Failed to fetch narration audio:", error);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [narrationText, settings.isSpeakerOn]);

    // Effect to proactively fetch audio on mount and handle auto-play
    useEffect(() => {
        if (settings.isSpeakerOn && narrationText) {
            const shouldAutoPlay = settings.isAutoPlayOn;
            fetchAndCacheAudio(shouldAutoPlay);
        }
    // This effect should run once when the narration text or speaker settings change.
    // The fetchAndCacheAudio function already prevents re-fetching if data is present.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [narrationText, settings.isSpeakerOn, settings.isAutoPlayOn]);


    const playNarration = useCallback(async () => {
        // Toggle speaker on if it's off
        if (!settings.isSpeakerOn) {
             setSettings(prev => {
                const newSettings = { ...prev, isSpeakerOn: true };
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
                return newSettings;
            });
            // The useEffect will trigger the fetch/play when isSpeakerOn changes
            return;
        };

        const audio = audioRef.current;
        if (!audio) return;
        
        if (isPlaying) {
            audio.pause();
            audio.currentTime = 0;
            setIsPlaying(false); // Explicitly set state
        } else if (audioDataUriRef.current) {
            if(audio.src !== audioDataUriRef.current) {
                audio.src = audioDataUriRef.current;
            }
            audio.play().catch(e => console.error("Failed to play narration:", e));
        } else {
            // If not cached yet, fetch and play. Show loading state.
            await fetchAndCacheAudio(true);
        }
    }, [settings.isSpeakerOn, isPlaying, fetchAndCacheAudio]);

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
        playNarration,
        toggleAutoPlay,
    };
}
