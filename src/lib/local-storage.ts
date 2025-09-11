
// This file is no longer the primary source of truth for logs.
// It is being kept temporarily for reference but will be removed.
// The app now reads and writes logs directly to Firestore.

import type { BirdLog } from './types';

const LOG_STORAGE_KEY = 'bird-identification-logs';

/**
 * @deprecated Logs are now stored in Firestore. This function reads from a legacy localStorage cache.
 * Retrieves all bird logs from localStorage.
 * @returns An array of BirdLog objects.
 */
export function getLogs(): BirdLog[] {
  if (typeof window === 'undefined') return [];
  const logsJson = localStorage.getItem(LOG_STORAGE_KEY);
  if (!logsJson) return [];

  try {
    const logs = JSON.parse(logsJson) as BirdLog[];
    // Sort by timestamp descending (newest first)
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Failed to parse bird logs from localStorage:', error);
    return [];
  }
}

/**
 * @deprecated Logs are now stored in Firestore. This function writes to a legacy localStorage cache.
 * Adds a new bird log to localStorage.
 * @param log - The BirdLog object to add.
 */
export function addLog(log: BirdLog): void {
  if (typeof window === 'undefined') return;
  const logs = getLogs();
  logs.push(log);
  localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
}

/**
 * @deprecated Logs are now stored in Firestore. This function reads from a legacy localStorage cache.
 * Retrieves a single bird log by its ID from localStorage.
 * @param id - The ID of the log to retrieve.
 * @returns The BirdLog object if found, otherwise null.
 */
export function getLogById(id: string): BirdLog | null {
  if (typeof window === 'undefined') return null;
  const logs = getLogs();
  return logs.find((log) => log.id === id) || null;
}
