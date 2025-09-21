
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { textToSpeech } from '@/ai/flows/tts-flow';

const SPEAKER_SETTINGS_KEY = 'speaker-settings';
const FIRST_INTERACTION_KEY = 'user-has-interacted';

interface SpeakerSettings {
    isSpeakerOn: boolean;
    isGeneralAutoPlayOn: boolean;
    isCarouselAutoPlayOn: boolean;
}

export function useSpeaker(narrationText: string, autoPlayType: 'general' | 'carousel') {
    const [settings, setSettings] = useState<SpeakerSettings>({
        isSpeakerOn: true,
        isGeneralAutoPlayOn: false,
        isCarouselAutoPlayOn: false,
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioDataUriRef = useRef<string | null>(null);
    const hasInteractedRef = useRef(false);
    const lastPlayedTextRef = useRef<string | null>(null);
    
    useEffect(() => {
        hasInteractedRef.current = !!sessionStorage.getItem(FIRST_INTERACTION_KEY);
        
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

        const savedSettings = localStorage.getItem(SPEAKER_SETTINGS_KEY);
        const defaultSettings = { isSpeakerOn: true, isGeneralAutoPlayOn: false, isCarouselAutoPlayOn: false };

        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings({ ...defaultSettings, ...parsed });
            } catch (e) {
                console.error("Failed to parse speaker settings:", e);
                setSettings(defaultSettings);
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(defaultSettings));
            }
        } else {
            setSettings(defaultSettings);
            localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(defaultSettings));
        }

        return () => {
            audioEl.removeEventListener('play', handlePlay);
            audioEl.removeEventListener('ended', handleEnd);
            audioEl.removeEventListener('pause', handleEnd);
            if (audioEl) {
              audioEl.pause();
              audioEl.src = '';
            }
        }
    }, []);

    const fetchAndCacheAudio = useCallback(async (textToPlay: string, shouldPlay: boolean) => {
        if (!textToPlay || !settings.isSpeakerOn) return;

        if (audioDataUriRef.current && lastPlayedTextRef.current === textToPlay) {
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
        const isAutoPlayRelevant = (autoPlayType === 'general' && settings.isGeneralAutoPlayOn) || (autoPlayType === 'carousel' && settings.isCarouselAutoPlayOn);
        
        if (isAutoPlayRelevant && settings.isSpeakerOn && narrationText && hasInteractedRef.current) {
            fetchAndCacheAudio(narrationText, true);
        } else if (settings.isSpeakerOn && narrationText) {
            fetchAndCacheAudio(narrationText, false);
        }
    }, [narrationText, settings.isGeneralAutoPlayOn, settings.isCarouselAutoPlayOn, settings.isSpeakerOn, autoPlayType, fetchAndCacheAudio]);


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

    const toggleGeneralAutoPlay = useCallback(() => {
        setSettings(prev => {
            const newSettings = { ...prev, isGeneralAutoPlayOn: !prev.isGeneralAutoPlayOn };
            localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);
    
    const toggleCarouselAutoPlay = useCallback(() => {
        setSettings(prev => {
            const newSettings = { ...prev, isCarouselAutoPlayOn: !prev.isCarouselAutoPlayOn };
            localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
            return newSettings;
        });
    }, []);


    return {
        isSpeakerOn: settings.isSpeakerOn,
        isGeneralAutoPlayOn: settings.isGeneralAutoPlayOn,
        isCarouselAutoPlayOn: settings.isCarouselAutoPlayOn,
        isPlaying,
        isLoading,
        playNarration,
        toggleGeneralAutoPlay,
        toggleCarouselAutoPlay,
    };
}
