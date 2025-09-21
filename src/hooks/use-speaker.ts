
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useToast } from './use-toast';

const SPEAKER_SETTINGS_KEY = 'speaker-settings';
const FIRST_INTERACTION_KEY = 'user-has-interacted';

interface SpeakerSettings {
    isSpeakerOn: boolean;
    isAutoPlayOn: boolean;
}

// A simple in-memory cache for audio data URIs
const audioCache = new Map<string, string>();

export function useSpeaker(narrationSource: string, autoPlayType: 'general' | 'carousel' = 'general') {
    const { toast } = useToast();
    const [settings, setSettings] = useState<SpeakerSettings>({
        isSpeakerOn: true,
        isAutoPlayOn: false,
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasInteractedRef = useRef(false);

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
        const defaultSettings = { isSpeakerOn: true, isAutoPlayOn: false };

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
        if (source.endsWith('.wav')) {
            return source; // It's a static file path
        }
        
        // It's dynamic text, check cache first
        if (audioCache.has(source)) {
            return audioCache.get(source)!;
        }

        setIsLoading(true);
        try {
            const response = await textToSpeech(source);
            const dataUri = response.audioDataUri;
            audioCache.set(source, dataUri); // Cache the result
            return dataUri;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const playAudio = useCallback(async (source: string) => {
        const audio = audioRef.current;
        if (!audio) return;

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
                return;
            }
             if (error.message === 'TTS_QUOTA_EXCEEDED') {
                toast({
                    variant: 'destructive',
                    title: 'TTS Narration Unavailable',
                    description: 'The AI audio generation service is temporarily unavailable due to quota limits.',
                });
            } else {
                console.error("Failed to load or play audio:", error);
            }
            setIsPlaying(false);
            setIsLoading(false);
        }
    }, [getAudioDataUri, toast]);

    const playNarration = useCallback(async (sourceToPlayOverride?: string) => {
        const targetSource = sourceToPlayOverride || narrationSource;
        const audio = audioRef.current;
        if (!audio || !targetSource) return;

        if (!hasInteractedRef.current) {
            hasInteractedRef.current = true;
            sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
        }
        
        if (isPlaying && audio.src === audioCache.get(targetSource)) {
             audio.pause();
             audio.currentTime = 0;
             setIsPlaying(false);
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

    // This effect handles auto-play for STATIC .wav files ONLY.
    useEffect(() => {
        if (settings.isAutoPlayOn && settings.isSpeakerOn && narrationSource && hasInteractedRef.current) {
            // Only autoplay if it's a pre-recorded file.
            if (narrationSource.endsWith('.wav')) {
                playAudio(narrationSource);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [narrationSource, settings.isAutoPlayOn, settings.isSpeakerOn]);


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

    
