
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

const audioCache = new Map<string, string>();

export function useSpeaker(narrationSource: string, autoPlayType: 'general' | 'carousel' = 'general') {
    const { toast } = useToast();
    const [settings, setSettings] = useState<SpeakerSettings>({
        isSpeakerOn: true,
        isAutoPlayOn: true,
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Refs for the two audio players
    const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
    const sfxAudioRef = useRef<HTMLAudioElement | null>(null);

    // Effect to initialize everything on mount
    useEffect(() => {
        const hasInteracted = !!sessionStorage.getItem(FIRST_INTERACTION_KEY);
        
        // Initialize Narration Player
        const narrationPlayer = new Audio();
        narrationAudioRef.current = narrationPlayer;
        const handleNarrationEnd = () => setIsPlaying(false);
        narrationPlayer.addEventListener('play', () => setIsPlaying(true));
        narrationPlayer.addEventListener('pause', handleNarrationEnd);
        narrationPlayer.addEventListener('ended', handleNarrationEnd);

        // Initialize SFX Player
        sfxAudioRef.current = new Audio();

        // Load settings from localStorage
        const savedSettings = localStorage.getItem(SPEAKER_SETTINGS_KEY);
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch (e) {
                console.error("Failed to parse speaker settings:", e);
            }
        }

        // Auto-play logic for page load
        if (settings.isAutoPlayOn && narrationSource && hasInteracted && narrationSource.endsWith('.wav') && autoPlayType === 'general') {
            narrationPlayer.src = narrationSource;
            narrationPlayer.play().catch(e => console.error("Autoplay failed:", e));
        }

        return () => {
            narrationPlayer.removeEventListener('play', () => setIsPlaying(true));
            narrationPlayer.removeEventListener('pause', handleNarrationEnd);
            narrationPlayer.removeEventListener('ended', handleNarrationEnd);
            narrationPlayer.pause();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [narrationSource]);


    const playNarration = useCallback(async (sourceToPlayOverride?: string) => {
        const targetSource = sourceToPlayOverride || narrationSource;
        const audio = narrationAudioRef.current;
        if (!audio || !targetSource) return;

        // Mark user as interacted if they haven't already
        if (!sessionStorage.getItem(FIRST_INTERACTION_KEY)) {
            sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
        }

        // If this exact sound is already playing, stop it.
        if (isPlaying) {
             audio.pause();
             audio.currentTime = 0;
             return;
        }

        // If the speaker is off, turn it on first.
        if (!settings.isSpeakerOn) {
            setSettings(prev => {
                const newSettings = { ...prev, isSpeakerOn: true };
                localStorage.setItem(SPEAKER_SETTINGS_KEY, JSON.stringify(newSettings));
                return newSettings;
            });
        }
        
        setIsLoading(true);
        try {
            let dataUri: string | null = null;
            if (targetSource.endsWith('.wav')) {
                dataUri = targetSource;
            } else {
                // It's text for TTS
                if (audioCache.has(targetSource)) {
                    dataUri = audioCache.get(targetSource)!;
                } else {
                    const response = await textToSpeech(targetSource);
                    dataUri = response.audioDataUri;
                    audioCache.set(targetSource, dataUri);
                }
            }
            
            if (dataUri) {
                audio.src = dataUri;
                await audio.play();
            }

        } catch (error: any) {
             if (error.message === 'TTS_QUOTA_EXCEEDED') {
                toast({
                    variant: 'destructive',
                    title: 'TTS Narration Unavailable',
                    description: 'The AI audio generation service is temporarily unavailable due to quota limits.',
                });
            } else {
                console.error("Failed to load or play audio:", error);
                toast({ variant: 'destructive', title: "Audio Error", description: "Could not play the requested audio."});
            }
        } finally {
            setIsLoading(false);
        }
    }, [narrationSource, isPlaying, settings.isSpeakerOn, toast]);

    const playSfx = useCallback((sfxPath: string) => {
        const sfxPlayer = sfxAudioRef.current;
        if (sfxPlayer && settings.isSpeakerOn) {
            sfxPlayer.src = sfxPath;
            sfxPlayer.play().catch(e => console.error("SFX play failed:", e));
        }
    }, [settings.isSpeakerOn]);
    
    return {
        isSpeakerOn: settings.isSpeakerOn,
        isAutoPlayOn: settings.isAutoPlayOn,
        isPlaying,
        isLoading,
        playNarration,
        playSfx,
    };
}
