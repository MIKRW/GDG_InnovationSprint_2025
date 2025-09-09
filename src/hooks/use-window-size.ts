"use client";

import { useState, useEffect } from 'react';

const RESIZE_DEBOUNCE_TIME = 300; // ms

export function useWindowSize(minWidth: number, minHeight: number) {
  const [isTooSmall, setIsTooSmall] = useState(false);

  useEffect(() => {
    // Set the initial state without a timeout
    setIsTooSmall(window.innerWidth < minWidth || window.innerHeight < minHeight);
    
    let timeoutId: NodeJS.Timeout;

    function handleResize() {
      // Clear the previous timeout if it exists
      clearTimeout(timeoutId);
      
      // Set a new timeout
      timeoutId = setTimeout(() => {
        setIsTooSmall(window.innerWidth < minWidth || window.innerHeight < minHeight);
      }, RESIZE_DEBOUNCE_TIME);
    }

    window.addEventListener('resize', handleResize);

    // Cleanup function to remove the event listener and clear the timeout
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [minWidth, minHeight]);

  return isTooSmall;
}
