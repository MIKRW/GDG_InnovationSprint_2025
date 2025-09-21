
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { textToSpeech } from '@/ai/flows/tts-flow';

const SPEAKER_SETTINGS_KEY = 'speaker-settings';
const FIRST_INTERACTION_KEY = 'user-has-interacted';

interface SpeakerSettings {
    isSpeakerOn: boolean;
    isAutoPlayOn: boolean;
}

export function useSpeaker(narrationText: string) {
    const [settings, setSettings] = useState<SpeakerSettings>({
        isSpeakerOn: true,
        isAutoPlayOn: false, // Default to off
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioDataUriRef = useRef<string | null>(null);
    const hasInteractedRef = useRef(false);
    const lastPlayedTextRef = useRef<string | null>(null);
    
    useEffect(() => {
        // This ref should reflect the session storage, not be a separate boolean
        hasInteractedRef.current = !!sessionStorage.getItem(FIRST_INTERACTION_KEY);
        
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
                 // If parsing fails, set default
                setSettings({ isSpeakerOn: true, isAutoPlayOn: false });
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify({ isSpeakerOn: true, isAutoPlayOn: false }));
            }
        } else {
            // If no settings, this is likely the first run, so set defaults
            setSettings({ isSpeakerOn: true, isAutoPlayOn: false });
            localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify({ isSpeakerOn: true, isAutoPlayOn: false }));
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

    const fetchAndCacheAudio = useCallback(async (textToPlay: string, shouldPlay: boolean) => {
        if (!textToPlay || !settings.isSpeakerOn) return;

        // If we have the audio for the exact text cached, play it.
        if (audioDataUriRef.current && lastPlayedTextRef.current === textToPlay) {
            if (shouldPlay && hasInteractedRef.current && audioRef.current) {
                 if (audioRef.current.src !== audioDataUriRef.current) {
                    audioRef.current.src = audioDataUriRef.current;
                }
                audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
            }
            return;
        }

        // If not cached, fetch it.
        setIsLoading(true);
        try {
            const response = await textToSpeech(textToPlay);
            audioDataUriRef.current = response.audioDataUri;
            lastPlayedTextRef.current = textToPlay;
            if (shouldPlay && hasInteractedRef.current && audioRef.current) {
                audioRef.current.src = response.audioDataUri;
                audioRef.current.play().catch(e => console.error("Audio playback failed after fetch:", e));
            }
        } catch (error) {
            console.error("Failed to fetch narration audio:", error);
        } finally {
            setIsLoading(false);
        }
    }, [settings.isSpeakerOn]);

    useEffect(() => {
        if (settings.isAutoPlayOn && settings.isSpeakerOn && narrationText && hasInteractedRef.current) {
            fetchAndCacheAudio(narrationText, true);
        } else if (settings.isSpeakerOn && narrationText) {
             // Pre-fetch audio even if autoplay is off, but don't play it
            fetchAndCacheAudio(narrationText, false);
        }
    }, [narrationText, settings.isAutoPlayOn, settings.isSpeakerOn, fetchAndCacheAudio]);


    const playNarration = useCallback(async (textToPlay: string) => {
        if (!hasInteractedRef.current) {
            hasInteractedRef.current = true;
            sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
        }

        if (!settings.isSpeakerOn) {
             setSettings(prev => {
                const newSettings = { ...prev, isSpeakerOn: true };
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
                return newSettings;
            });
            // After enabling, it will try to play.
             fetchAndCacheAudio(textToPlay, true);
            return;
        };

        const audio = audioRef.current;
        if (!audio) return;
        
        if (isPlaying) {
            audio.pause();
            audio.currentTime = 0;
        } else {
            await fetchAndCacheAudio(textToPlay, true);
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

    