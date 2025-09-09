"use client";

import { useState, useEffect } from 'react';

export function useWindowSize(minWidth: number, minHeight: number) {
  const [isTooSmall, setIsTooSmall] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsTooSmall(window.innerWidth < minWidth || window.innerHeight < minHeight);
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, [minWidth, minHeight]);

  return isTooSmall;
}
