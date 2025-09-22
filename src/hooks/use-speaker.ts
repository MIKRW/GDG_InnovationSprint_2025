
'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useToast } from './use-toast';
import { getSpeakerSettings, defaultSettings } from '@/lib/speaker-store';

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

    // Effect to initialize and clean up the audio players
    useEffect(() => {
        const narrationPlayer = new Audio();
        narrationAudioRef.current = narrationPlayer;

        const handleNarrationEnd = () => setIsPlaying(false);
        const handleNarrationPlay = () => setIsPlaying(true);

        narrationPlayer.addEventListener('play', handleNarrationPlay);
        narrationPlayer.addEventListener('pause', handleNarrationEnd);
        narrationPlayer.addEventListener('ended', handleNarrationEnd);
        
        sfxAudioRef.current = new Audio();

        // Autoplay logic for general page narrations
        const hasInteracted = !!sessionStorage.getItem(FIRST_INTERACTION_KEY);
        if (speakerSettings.isAutoPlayOn && narrationSource && hasInteracted && narrationSource.endsWith('.wav') && autoPlayType === 'general') {
            if (narrationPlayer.src !== narrationSource) {
                 narrationPlayer.src = narrationSource;
                 narrationPlayer.play().catch(e => console.error("Autoplay failed:", e));
            }
        }
        
        // Cleanup function
        return () => {
            narrationPlayer.removeEventListener('play', handleNarrationPlay);
            narrationPlayer.removeEventListener('pause', handleNarrationEnd);
            narrationPlayer.removeEventListener('ended', handleNarrationEnd);
            narrationPlayer.pause();
        };
    }, [narrationSource, speakerSettings.isAutoPlayOn, autoPlayType]);


    const playNarration = useCallback(async (sourceToPlayOverride?: string) => {
        const targetSource = sourceToPlayOverride || narrationSource;
        const audio = narrationAudioRef.current;

        if (isLoading || !audio || !targetSource) {
            return;
        }

        // Always ensure the interaction flag is set
        if (!sessionStorage.getItem(FIRST_INTERACTION_KEY)) {
            sessionStorage.setItem(FIRST_INTERACTION_KEY, 'true');
        }

        // If the user clicks the button for the currently playing sound, treat it as a "stop" action.
        if (isPlaying && audio.src && audio.src.endsWith(targetSource.substring(targetSource.lastIndexOf('/')))) {
            audio.pause();
            audio.currentTime = 0;
            return;
        }

        // If another sound is already playing, stop it completely before proceeding.
        if (isPlaying) {
            audio.pause();
            audio.currentTime = 0;
        }

        if (!speakerSettings.isSpeakerOn) return;

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
            } else if (error.name !== 'AbortError') { // Ignore user-initiated aborts
                console.error("Failed to load or play audio:", error);
                toast({ variant: 'destructive', title: "Audio Error", description: "Could not play the requested audio."});
            }
        } finally {
            setIsLoading(false);
        }
    }, [narrationSource, isPlaying, isLoading, speakerSettings.isSpeakerOn, toast]);
    

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
        narrationAudioRef,
        playSfx,
    };
}
