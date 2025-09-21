
'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useToast } from './use-toast';
import { getSpeakerSettings, setSpeakerSettings as setGlobalSpeakerSettings, defaultSettings } from '@/lib/speaker-store';

const FIRST_INTERACTION_KEY = 'user-has-interacted';
const audioCache = new Map<string, string>();

export function useSpeaker(narrationSource: string, autoPlayType: 'general' | 'carousel' = 'general') {
    const { toast } = useToast();
    
    const speakerSettings = useSyncExternalStore(
        (onStoreChange) => {
            window.addEventListener('speaker-settings-change', onStoreChange);
            return () => window.removeEventListener('speaker-settings-change', onStoreChange);
        },
        getSpeakerSettings,
        () => defaultSettings
    );

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
    const sfxAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const hasInteracted = !!sessionStorage.getItem(FIRST_INTERACTION_KEY);
        
        if (!narrationAudioRef.current) {
            const narrationPlayer = new Audio();
            narrationAudioRef.current = narrationPlayer;

            const handleNarrationEnd = () => setIsPlaying(false);
            const handleNarrationPlay = () => setIsPlaying(true);

            narrationPlayer.addEventListener('play', handleNarrationPlay);
            narrationPlayer.addEventListener('pause', handleNarrationEnd);
            narrationPlayer.addEventListener('ended', handleNarrationEnd);
        }

        if (!sfxAudioRef.current) {
            sfxAudioRef.current = new Audio();
        }

        if (speakerSettings.isAutoPlayOn && narrationSource && hasInteracted && narrationSource.endsWith('.wav') && autoPlayType === 'general') {
            const audio = narrationAudioRef.current;
            if (audio && audio.src !== narrationSource) {
                 audio.src = narrationSource;
                 audio.play().catch(e => console.error("Autoplay failed:", e));
            }
        }
        
        // This effect should only run once to set up the audio players.
        // We add a cleanup function to be safe.
        const player = narrationAudioRef.current;
        return () => {
            if (player) {
                player.pause();
            }
        };
    }, [narrationSource, speakerSettings.isAutoPlayOn, autoPlayType]);


    const playNarration = useCallback(async (sourceToPlayOverride?: string) => {
        const targetSource = sourceToPlayOverride || narrationSource;
        const audio = narrationAudioRef.current;
        if (!audio || !targetSource) return;

        if (!sessionStorage.getItem(FIRST_INTERACTION_KEY)) {
            sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
        }

        if (isPlaying) {
             audio.pause();
             audio.currentTime = 0;
             return;
        }

        if (!speakerSettings.isSpeakerOn) {
            return;
        }
        
        setIsLoading(true);
        try {
            let dataUri: string | null = null;
            if (targetSource.endsWith('.wav')) {
                dataUri = targetSource;
            } else {
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
    }, [narrationSource, isPlaying, speakerSettings.isSpeakerOn, toast]);

    const playSfx = useCallback((sfxPath: string) => {
        const sfxPlayer = sfxAudioRef.current;
        if (sfxPlayer && speakerSettings.isSpeakerOn) {
            sfxPlayer.src = sfxPath;
            sfxPlayer.play().catch(e => console.error("SFX play failed:", e));
        }
    }, [speakerSettings.isSpeakerOn]);
    
    return {
        isSpeakerOn: speakerSettings.isSpeakerOn,
        isAutoPlayOn: speakerSettings.isAutoPlayOn,
        isPlaying,
        isLoading,
        playNarration,
        playSfx,
    };
}
