
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
import { getComposedPrompt } from '@/lib/actions';

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
  promptVersion: z.string().optional().describe('The version of the AI system used for this generation.'),
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
    try {
      // 1. Ask the backend for the correct prompt based on the current mode (dev/live).
      const composedPrompt = await getComposedPrompt('theme-generator-ai');
      
      if (!composedPrompt || !composedPrompt.prompt) {
        // This error is now protected by the robust database initialization.
        throw new Error('Failed to retrieve a valid prompt for theme generation.');
      }

      // 2. Define the prompt object with the retrieved instructions.
      const themePrompt = ai.definePrompt({
          name: 'themePrompt',
          input: { schema: GenerateThemeInputSchema },
          output: { schema: GenerateThemeOutputSchema },
          prompt: composedPrompt.prompt,
      });

      // 3. Send the prompt to the AI and get the result.
      const response = await themePrompt(input);
      const output = response.output;

      if (!output) {
        throw new Error('The AI model failed to return a valid theme. This has been logged.');
      }
      
      // 4. Send the AI result (and version info) to the frontend.
      output.promptVersion = composedPrompt.version;
      return output;

    } catch (error) {
        console.error("Error in generateThemeFlow:", error);
        // Log the specific error to Firestore for better debugging.
        await logErrorToFirestore(error as Error, 'theme-generation-failure', {
            input: input,
            flow: 'generateThemeFlow',
        });
        // Re-throw the error to be caught by the calling client component
        // so it can display a message to the user.
        throw error;
    }
  }
);
