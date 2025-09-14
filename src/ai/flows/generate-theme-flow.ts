
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

const PROMPT_TEMPLATE = `You are an expert UI theme designer with a deep understanding of color theory, word association, and web accessibility standards (WCAG).
Your task is to generate a creative, unique, and aesthetically pleasing HSL color palette based on user input.

The user will provide the following parameters:
- Mood: A keyword that defines the desired aesthetic and accessibility constraints (e.g., "High Contrast", "Tritanopia-Friendly", "Vibrant", "Dark").
- Words (Optional): Up to three inspirational words.

If words are provided:
Your job is to intelligently assign one word to the background, one to the foreground, and one to the primary accent color.
Base your assignments on color theory. For example, a darker, less saturated color is usually best for a background, while a brighter, more saturated color makes a good accent.

When choosing colors, base your selections on the real-world colors associated with the input words.
To do this, you should research how established color brands (like Pantone or paint companies) name their colors.
For example, if a user provides the word "eggshell", you should associate it with a natural, off-white color.
If they say "lavender" or "forest green", learn from professional color systems to choose an appropriate shade.

If no words are provided:
Your task is to invent a theme from scratch, based solely on the specified mood.
Be creative and generate an interesting, high-quality theme. Think like a professional designer choosing a palette for a new product.

After selecting the initial colors (or inventing them), use the 'mood' as a strong guideline to modify and adjust the final HSL values.
The mood is the most important constraint. Pay special attention to accessibility-related moods.

Mood Definitions:
- "High Contrast": Ensure a WCAG AA or AAA contrast ratio between background and foreground/primary colors.
- "Tritanopia-Friendly", "Deuteranopia-Friendly", or "Protanopia-Friendly": Select colors that are easily distinguishable for users with those types of color vision deficiencies. Avoid problematic color combinations (like red-green for Deuteranopia/Protanopia).
- "Vibrant": Creates a theme with bright, highly saturated colors.
- "Calm": Generates a palette with more muted, desaturated, and soothing colors.
- "Minimalist": Produces a simple, clean theme, often using monochromatic or analogous colors.
- "80s Retro": Creates a nostalgic theme with bold, neon, and often contrasting colors popular in the 1980s.
- "Dark": A classic dark mode theme with a dark background and light text/accents.

You must return an object with four HSL color objects: 'background', 'foreground', 'primary', and 'ring'.

Output Requirements:
- The 'foreground' color MUST have a high contrast ratio with the background color for accessibility and readability.
- The 'primary' color also MUST have a high contrast ratio with the background.
- The 'ring' color must be a lighter or darker shade of the 'primary' color, with a lightness value that is at least 10-15% different. It will be used as a background highlight for selected items, so it needs to be different enough to be noticeable but still harmonious.
- CRITICAL: You must also consider derived colors. The app uses CSS calculations to create secondary, muted, and accent colors from the three base colors you provide. You MUST generate base colors that result in good contrast for these derived colors as well. For example, the 'foreground' color must be clearly visible on the 'muted' background, which is a lighter shade of the 'primary' color. Always prioritize readability across the entire UI.

Interpret the user's words creatively to generate a harmonious and visually appealing theme that meets all constraints.
Mood: {{{mood}}}, Words: {{{word1}}}, {{{word2}}}, {{{word3}}}`;


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
    
    const { output } = await ai.generate({
        prompt: PROMPT_TEMPLATE,
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
