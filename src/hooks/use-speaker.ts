
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
    const audioDataUriRef = useRef<string | null>(null);
    const hasInteractedRef = useRef(false);
    const lastPlayedTextRef = useRef<string | null>(null);

    const isLocalFile = (source: string) => source.startsWith('/audio/');
    
    useEffect(() => {
        hasInteractedRef.current = !!sessionStorage.getItem(FIRST_INTERACTION_KEY);
        
        const audioEl = new Audio();
        audioRef.current = audioEl;
        
        const handlePlay = () => setIsPlaying(true);
        const handleEnd = () => {
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
            }
        };

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

    const fetchAndCacheAudio = useCallback(async (sourceToPlay: string, shouldPlay: boolean) => {
        if (!sourceToPlay || !settings.isSpeakerOn || !audioRef.current) return;
    
        const audio = audioRef.current;
    
        // If it's a local file, we don't need to fetch anything from the AI
        if (isLocalFile(sourceToPlay)) {
            const fullUrl = new URL(sourceToPlay, window.location.origin).href;
            if (audio.src !== fullUrl) {
                audio.src = fullUrl;
            }
            if (shouldPlay && hasInteractedRef.current) {
                audio.play().catch(e => console.error("Audio playback failed:", e));
            }
            return;
        }
    
        // If it's TTS and we have it cached, play it
        if (audioDataUriRef.current && lastPlayedTextRef.current === sourceToPlay) {
            if (audio.src !== audioDataUriRef.current) {
                audio.src = audioDataUriRef.current;
            }
            if (shouldPlay && hasInteractedRef.current) {
                audio.play().catch(e => console.error("Audio playback failed:", e));
            }
            return;
        }
    
        setIsLoading(true);
        try {
            const response = await textToSpeech(sourceToPlay);
            if (!response.audioDataUri) {
                console.warn('TTS returned empty audio data.');
                return;
            }
            audioDataUriRef.current = response.audioDataUri;
            lastPlayedTextRef.current = sourceToPlay;
            audio.src = response.audioDataUri;
            if (shouldPlay && hasInteractedRef.current) {
                audio.play().catch(e => console.error("Audio playback failed after fetch:", e));
            }
        } catch (error) {
            console.error("Failed to fetch narration audio:", error);
        } finally {
            setIsLoading(false);
        }
    }, [settings.isSpeakerOn]);

    useEffect(() => {
        const isAutoPlayRelevant = (autoPlayType === 'general' && settings.isGeneralAutoPlayOn) || (autoPlayType === 'carousel' && settings.isCarouselAutoPlayOn);
        
        if (isAutoPlayRelevant && settings.isSpeakerOn && narrationSource && hasInteractedRef.current) {
            fetchAndCacheAudio(narrationSource, true);
        } else if (settings.isSpeakerOn && narrationSource && !isLocalFile(narrationSource)) {
            // Pre-fetch but don't play if auto-play is off, and it's not a local file
            fetchAndCacheAudio(narrationSource, false);
        }
    }, [narrationSource, settings.isGeneralAutoPlayOn, settings.isCarouselAutoPlayOn, settings.isSpeakerOn, autoPlayType, fetchAndCacheAudio]);


    const playNarration = useCallback(async (sourceToPlay?: string) => {
        const targetSource = sourceToPlay || narrationSource;
    
        if (!hasInteractedRef.current) {
            hasInteractedRef.current = true;
            sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
        }
    
        const audio = audioRef.current;
        if (!audio) return;
    
        if (!settings.isSpeakerOn) {
            // If speaker is off, turn it on and play
            setSettings(prev => {
                const newSettings = { ...prev, isSpeakerOn: true };
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
                return newSettings;
            });
            // We fetchAndCacheAudio here, which will then play if interaction has happened.
            await fetchAndCacheAudio(targetSource, true);
        } else {
            // Speaker is on, toggle play/pause
            if (isPlaying) {
                audio.pause();
            } else {
                await fetchAndCacheAudio(targetSource, true);
            }
        }
    }, [settings.isSpeakerOn, isPlaying, fetchAndCacheAudio, narrationSource]);

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
