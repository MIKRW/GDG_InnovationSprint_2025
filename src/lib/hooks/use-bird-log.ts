"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Bird } from '@/lib/types';

const STORAGE_KEY = 'chirp-id-bird-log';

export const useBirdLog = () => {
  const [loggedBirds, setLoggedBirds] = useState<Bird[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const items = window.localStorage.getItem(STORAGE_KEY);
      if (items) {
        setLoggedBirds(JSON.parse(items));
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedBirds));
      } catch (error) {
        console.error("Failed to write to localStorage", error);
      }
    }
  }, [loggedBirds, isInitialized]);

  const addBirdToLog = useCallback((bird: Bird) => {
    setLoggedBirds(prevBirds => {
      // Avoid duplicates
      if (prevBirds.some(b => b.scientificName === bird.scientificName)) {
        return prevBirds;
      }
      return [bird, ...prevBirds];
    });
  }, []);

  const removeBirdFromLog = useCallback((scientificName: string) => {
    setLoggedBirds(prevBirds => prevBirds.filter(b => b.scientificName !== scientificName));
  }, []);

  const clearLog = useCallback(() => {
    setLoggedBirds([]);
  }, []);

  return { loggedBirds, addBirdToLog, removeBirdFromLog, clearLog, isInitialized };
};
