
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

// Static prompt to bypass the failing database lookup.
const staticThemePrompt = `You are an expert UI/UX designer with a deep understanding of color theory and accessibility. Your task is to generate a color theme for a web application based on three inspirational words and a mood.

You MUST return a JSON object with four HSL color objects: 'background', 'foreground', 'primary', and 'ring'. Each object must have 'h' (0-360), 's' (0-100), and 'l' (0-100) values.

Follow these rules precisely:
1.  **Word Association**: Use the three words ({{word1}}, {{word2}}, {{word3}}) as the primary inspiration. The AI should intelligently assign these words to the background, foreground, and primary color roles based on design best practices. Research how established color brands (like Pantone or paint companies) name their colors to derive realistic and aesthetically pleasing shades.
2.  **Mood Application**: Use the '{{mood}}' keyword to adjust the final palette. For example, 'Vibrant' should increase saturation, 'Calm' should be desaturated, and 'Dark' should use a dark background with light text. Accessibility moods like 'High Contrast' or color-blind-friendly options must be strictly followed.
3.  **Contrast and Accessibility**: The 'foreground' color MUST have a high contrast ratio with the 'background' color. The 'primary' color must also be highly visible against the 'background'.
4.  **Ring Color**: The 'ring' color is for focus indicators. It MUST be a derivative of the 'primary' color, but with a lightness value that is at least 15% lighter or darker to ensure it stands out clearly.
5.  **Derived Color Safety**: The app's CSS will automatically create secondary and muted colors by adjusting the lightness of your chosen primary and background colors. You MUST select base colors that will produce readable and accessible derived colors. For example, a mid-range grey background is dangerous because adding lightness might make it too close to white text.

Do not add any explanations. Only return the JSON object.`;


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
    retries: 3, // Automatically retry up to 3 times on failure
  },
  async (input) => {
    try {
      // 1. Define the prompt object with the static instructions.
      const themePrompt = ai.definePrompt({
          name: 'themePrompt',
          input: { schema: GenerateThemeInputSchema },
          output: { schema: GenerateThemeOutputSchema },
          prompt: staticThemePrompt,
      });

      // 2. Send the prompt to the AI and get the result.
      const response = await themePrompt(input);
      const output = response.output;

      if (!output) {
        throw new Error('The AI model failed to return a valid theme. This has been logged.');
      }
      
      // 3. Send the AI result (and version info) to the frontend.
      output.promptVersion = "static-v1.0"; // Indicate that a static prompt was used
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
