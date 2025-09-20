import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if the app is running in a development-like mode.
 * In a standard Next.js app, `process.env.NODE_ENV` is 'development' when running `next dev`
 * and 'production' when running `next build` and `next start`.
 * We also check for a `NEXT_PUBLIC_DEV_MODE` flag which can be set in a local `.env` file
 * to explicitly enable developer tools even in a production build locally.
 * @returns {boolean} `true` if in development mode or if the dev flag is explicitly set, otherwise `false`.
 */
export function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_MODE === 'true';
}
