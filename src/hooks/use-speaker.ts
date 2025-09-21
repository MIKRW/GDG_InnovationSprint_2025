
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
    const lastPlayedSourceRef = useRef<string | null>(null);
    const lastDataUriRef = useRef<string | null>(null);
    const hasInteractedRef = useRef(false);

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

    const getAudioDataUri = useCallback(async (source: string): Promise<string | null> => {
        setIsLoading(true);
        try {
            if (source.endsWith('.wav')) {
                return source;
            }
    
            if (lastPlayedSourceRef.current === source && lastDataUriRef.current) {
                return lastDataUriRef.current;
            }
    
            const response = await textToSpeech(source);
            if (!response.audioDataUri) {
                console.warn('TTS returned empty audio data, likely due to a quota limit. Aborting playback.');
                return null;
            }
            lastDataUriRef.current = response.audioDataUri;
            lastPlayedSourceRef.current = source;
            return response.audioDataUri;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const playAudio = useCallback(async (source: string) => {
        const audio = audioRef.current;
        if (!audio) return;

        // Always stop any currently playing audio before starting a new one.
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
        
        try {
            const dataUri = await getAudioDataUri(source);
            if (dataUri) {
                audio.src = dataUri;
                await audio.play();
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Audio playback was interrupted by a new request. This is normal.');
                return;
            }
            console.error("Failed to load or play audio:", error);
            setIsPlaying(false);
            setIsLoading(false);
        }
    }, [getAudioDataUri]);

    const playNarration = useCallback(async (sourceToPlayOverride?: string) => {
        const targetSource = sourceToPlayOverride || narrationSource;
        const audio = audioRef.current;
        if (!audio || !targetSource) return;

        if (!hasInteractedRef.current) {
            hasInteractedRef.current = true;
            sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
        }
        
        if (isPlaying && audio.src.endsWith(targetSource)) {
            audio.pause();
        } else {
            if (!settings.isSpeakerOn) {
                setSettings(prev => {
                    const newSettings = { ...prev, isSpeakerOn: true };
                    localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
                    return newSettings;
                });
            }
            playAudio(targetSource);
        }
    }, [narrationSource, isPlaying, settings.isSpeakerOn, playAudio]);

    // Effect for handling auto-play logic
    useEffect(() => {
        const isAutoPlayOn = (autoPlayType === 'general' && settings.isGeneralAutoPlayOn) || (autoPlayType === 'carousel' && settings.isCarouselAutoPlayOn);
        if (isAutoPlayOn && settings.isSpeakerOn && narrationSource && hasInteractedRef.current) {
            playAudio(narrationSource);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [narrationSource, settings.isGeneralAutoPlayOn, settings.isCarouselAutoPlayOn, settings.isSpeakerOn, autoPlayType]);


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
