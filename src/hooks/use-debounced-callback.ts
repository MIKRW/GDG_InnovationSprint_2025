
'use client';

import { useRef, useEffect, useCallback } from 'react';

/**
 * Creates a debounced version of a callback function that will only be executed
 * after a specified delay since the last time it was invoked.
 *
 * @param callback The function to debounce.
 * @param delay The debounce delay in milliseconds.
 * @returns A memoized, debounced version of the callback function.
 */
export function useDebouncedCallback<A extends any[]>(
  callback: (...args: A) => void,
  delay: number
) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Ensure the callback is always the latest version
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // The actual debounced function that will be returned
  const debouncedCallback = useCallback(
    (...args: A) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  // Cleanup the timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}
