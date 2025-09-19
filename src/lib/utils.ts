import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A simple utility function to check if the app is running in development mode.
 * It checks the `NODE_ENV` environment variable.
 * @returns {boolean} `true` if in development mode, otherwise `false`.
 */
export function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development';
}
