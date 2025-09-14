
'use server';

/**
 * @fileOverview An AI flow for generating a custom theme palette from three words.
 *
 * - generateTheme - A function that creates a color theme from words.
 * - GenerateThemeInput - The input type for the generateTheme function.
 * - GenerateThemeOutput - The return type for the generateTheme function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ThemeColor } from '@/lib/types';
import { logErrorToFirestore } from '@/lib/error-logging';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Helper function to fetch prompt text from Firestore-managed storage
async function getPromptFromStorage(path: string): Promise<string> {
    try {
        const fileRef = ref(storage, path);
        const url = await getDownloadURL(fileRef);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch prompt from ${path}: ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error(`Error fetching prompt from storage, which is expected during initial migration. Path: ${path}`, error);
        // During migration, the file won't exist yet, so we fall back to a hardcoded default.
        // This can be removed after the first successful migration.
        return `You are an expert UI theme designer. Your task is to generate a HSL color palette.
        You must return an object with four HSL color objects: 'background', 'foreground', 'primary', and 'ring'.
        The 'foreground' and 'primary' colors MUST have a high contrast ratio with the background for accessibility.
        The 'ring' color must be a lighter or darker shade of the 'primary' color.
        Mood: {{{mood}}}, Words: {{{word1}}}, {{{word2}}}, {{{word3}}}`;
    }
}


const ThemeColorSchema = z.object({
  h: z.number().describe('The hue value (0-360).'),
  s: z.number().describe('The saturation value (0-100).'),
  l: z.number().describe('The lightness value (0-100).'),
});

const GenerateThemeOutputSchema = z.object({
  background: ThemeColorSchema.describe('The background color of the theme.'),
  foreground: ThemeColorSchema.describe('The primary text/content color, ensuring high contrast with the background.'),
  primary: ThemeColorSchema.describe('The main accent color for buttons and highlights, ensuring high contrast with the background.'),
  ring: ThemeColorSchema.describe("A color for UI highlights like selections. It should be a shade of the 'primary' color, with a lightness value that is at least 10-15% lighter or darker to ensure it is always visible as a selection state."),
});
export type GenerateThemeOutput = z.infer<typeof GenerateThemeOutputSchema>;

const GenerateThemeInputSchema = z.object({
  word1: z.string().optional().describe('A word to inspire a color.'),
  word2: z.string().optional().describe('A second word to inspire a color.'),
  word3: z.string().optional().describe('A third word to inspire a color.'),
  mood: z.string().describe('A keyword that defines the desired aesthetic and accessibility constraints (e.g., "High Contrast", "Tritanopia-Friendly", "Vibrant", "Dark").'),
});
export type GenerateThemeInput = z.infer<typeof GenerateThemeInputSchema>;


export async function generateTheme(
  words: GenerateThemeInput
): Promise<GenerateThemeOutput> {
  return await generateThemeFlow(words);
}

const generateThemeFlow = ai.defineFlow(
  {
    name: 'generateThemeFlow',
    inputSchema: GenerateThemeInputSchema,
    outputSchema: GenerateThemeOutputSchema,
  },
  async (input) => {
    
    const promptText = await getPromptFromStorage('prompts/theme-generation-prompt.txt');

    const { output } = await ai.generate({
        prompt: promptText,
        input: input,
        model: 'googleai/gemini-2.5-flash',
        output: {
            schema: GenerateThemeOutputSchema
        }
    });

    if (!output) {
      throw new Error('Failed to generate theme from the model.');
    }
    return output;
  }
);
