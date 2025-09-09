'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Bird } from '@/lib/types';

const BIRD_LOG_STORAGE_KEY = 'chirp-id-bird-log';

export function useBirdLog() {
  const [loggedBirds, setLoggedBirds] = useState<Bird[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedBirds = localStorage.getItem(BIRD_LOG_STORAGE_KEY);
      if (storedBirds) {
        setLoggedBirds(JSON.parse(storedBirds));
      }
    } catch (error) {
      console.error("Failed to read from local storage", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(BIRD_LOG_STORAGE_KEY, JSON.stringify(loggedBirds));
      } catch (error) {
        console.error("Failed to write to local storage", error);
      }
    }
  }, [loggedBirds, isInitialized]);

  const addBirdToLog = useCallback((bird: Bird) => {
    setLoggedBirds(prevBirds => {
      // Avoid adding duplicates
      if (prevBirds.some(b => b.scientificName === bird.scientificName)) {
        return prevBirds;
      }
      return [...prevBirds, bird];
    });
  }, []);

  const removeBirdFromLog = useCallback((scientificName: string) => {
    setLoggedBirds(prevBirds => prevBirds.filter(b => b.scientificName !== scientificName));
  }, []);

  const clearLog = useCallback(() => {
    setLoggedBirds([]);
  }, []);

  return { loggedBirds, addBirdToLog, removeBirdFromLog, clearLog, isInitialized };
}
