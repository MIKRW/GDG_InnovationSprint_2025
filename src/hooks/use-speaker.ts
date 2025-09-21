
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
    const hasInteractedRef = useRef(false);
    
    useEffect(() => {
        // Initialize audio element on client
        audioRef.current = new Audio();
        
        const handlePlay = () => setIsPlaying(true);
        const handleEnd = () => {
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
            }
        };

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
        if (!narrationText || !settings.isSpeakerOn) return;
        
        // If we already have the audio, just play it if requested and allowed.
        if (audioDataUriRef.current) {
            if (shouldPlay && hasInteractedRef.current && audioRef.current) {
                if (audioRef.current.src !== audioDataUriRef.current) {
                    audioRef.current.src = audioDataUriRef.current;
                }
                audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
            }
            return;
        }

        setIsLoading(true);
        try {
            const response = await textToSpeech(narrationText);
            audioDataUriRef.current = response.audioDataUri;
            if (shouldPlay && hasInteractedRef.current && audioRef.current) {
                audioRef.current.src = response.audioDataUri;
                audioRef.current.play().catch(e => console.error("Audio playback failed after fetch:", e));
            }
        } catch (error) {
            console.error("Failed to fetch narration audio:", error);
        } finally {
            setIsLoading(false);
        }
    }, [narrationText, settings.isSpeakerOn]);

    // Effect to proactively fetch audio on mount and handle auto-play
    useEffect(() => {
        if (settings.isSpeakerOn && narrationText) {
            // Only attempt to autoplay if the user has interacted before
            fetchAndCacheAudio(settings.isAutoPlayOn && hasInteractedRef.current);
        }
    }, [narrationText, settings.isSpeakerOn, settings.isAutoPlayOn, fetchAndCacheAudio]);


    const playNarration = useCallback(async () => {
        hasInteractedRef.current = true; // Record the first user interaction

        // If the speaker is off, this click should turn it on. The `useEffect` will then handle fetching/playing.
        if (!settings.isSpeakerOn) {
             setSettings(prev => {
                const newSettings = { ...prev, isSpeakerOn: true };
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
                return newSettings;
            });
            // The hook's useEffect will now pick up the change and fetch/play audio.
            return;
        };

        const audio = audioRef.current;
        if (!audio) return;
        
        if (isPlaying) {
            audio.pause();
            audio.currentTime = 0;
        } else {
            // If we have the audio cached, play it. Otherwise, fetchAndCacheAudio will handle it.
            // The `true` here signals it should play after fetching.
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
