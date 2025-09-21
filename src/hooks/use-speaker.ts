
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

export function useSpeaker(narrationSource: string, autoPlayType: 'general' | 'carousel' = 'general') {
    const [settings, setSettings] = useState<SpeakerSettings>({
        isSpeakerOn: true,
        isGeneralAutoPlayOn: false,
        isCarouselAutoPlayOn: false,
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasInteractedRef = useRef(false);
    const lastPlayedSourceRef = useRef<string | null>(null);
    const lastDataUriRef = useRef<string | null>(null);

    const isLocalFile = (source: string) => source.startsWith('/audio/');

    // Initialize audio element and load settings from localStorage
    useEffect(() => {
        hasInteractedRef.current = !!sessionStorage.getItem(FIRST_INTERACTION_KEY);
        
        const audioEl = new Audio();
        audioRef.current = audioEl;
        
        const handlePlay = () => setIsPlaying(true);
        const handleEnd = () => {
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.currentTime = 0;
        };

        audioEl.addEventListener('play', handlePlay);
        audioEl.addEventListener('ended', handleEnd);
        audioEl.addEventListener('pause', handleEnd);

        const savedSettings = localStorage.getItem(SPEAKER_SETTINGS_KEY);
        const defaultSettings = { isSpeakerOn: true, isGeneralAutoPlayOn: false, isCarouselAutoPlayOn: false };

        if (savedSettings) {
            try {
                setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
            } catch (e) {
                console.error("Failed to parse speaker settings:", e);
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(defaultSettings));
            }
        } else {
            localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(defaultSettings));
        }

        return () => {
            audioEl.removeEventListener('play', handlePlay);
            audioEl.removeEventListener('ended', handleEnd);
            audioEl.removeEventListener('pause', handleEnd);
            audioEl.pause();
            audioEl.src = '';
        };
    }, []);

    // Effect for handling auto-play logic
    useEffect(() => {
        const isAutoPlayOn = (autoPlayType === 'general' && settings.isGeneralAutoPlayOn) || (autoPlayType === 'carousel' && settings.isCarouselAutoPlayOn);

        if (isAutoPlayOn && settings.isSpeakerOn && narrationSource && hasInteractedRef.current) {
            const audio = audioRef.current;
            if (audio) {
                // If the source is different, load and play it
                if (lastPlayedSourceRef.current !== narrationSource) {
                     loadAndPlayAudio(narrationSource);
                }
            }
        }
    }, [narrationSource, settings.isGeneralAutoPlayOn, settings.isCarouselAutoPlayOn, settings.isSpeakerOn, autoPlayType]);


    const loadAndPlayAudio = useCallback(async (sourceToPlay: string) => {
        const audio = audioRef.current;
        if (!audio) return;

        setIsLoading(true);

        try {
            if (isLocalFile(sourceToPlay)) {
                audio.src = sourceToPlay;
            } else {
                // If it's the same AI text, use the cached data URI
                if (lastPlayedSourceRef.current === sourceToPlay && lastDataUriRef.current) {
                    audio.src = lastDataUriRef.current;
                } else {
                    // Otherwise, fetch new TTS audio
                    const response = await textToSpeech(sourceToPlay);
                    if (!response.audioDataUri) {
                        console.warn('TTS returned empty audio data.');
                        setIsLoading(false);
                        return;
                    }
                    lastDataUriRef.current = response.audioDataUri;
                    audio.src = response.audioDataUri;
                }
            }
            
            lastPlayedSourceRef.current = sourceToPlay;
            await audio.play();

        } catch (error) {
            console.error("Failed to load or play audio:", error);
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    }, []);


    const playNarration = useCallback(async (sourceToPlayOverride?: string) => {
        const targetSource = sourceToPlayOverride || narrationSource;
        const audio = audioRef.current;
        if (!audio || !targetSource) return;

        // Handle first interaction
        if (!hasInteractedRef.current) {
            hasInteractedRef.current = true;
            sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
        }

        // If speaker is off, turn it on and play
        if (!settings.isSpeakerOn) {
            setSettings(prev => {
                const newSettings = { ...prev, isSpeakerOn: true };
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
                return newSettings;
            });
            loadAndPlayAudio(targetSource);
            return;
        }

        // If speaker is on, toggle play/pause
        if (isPlaying && lastPlayedSourceRef.current === targetSource) {
            audio.pause();
        } else {
            loadAndPlayAudio(targetSource);
        }
    }, [narrationSource, settings.isSpeakerOn, isPlaying, loadAndPlayAudio]);

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
