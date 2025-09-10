
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

const ThemeColorSchema = z.object({
  h: z.number().describe('The hue value (0-360).'),
  s: z.number().describe('The saturation value (0-100).'),
  l: z.number().describe('The lightness value (0-100).'),
});

const GenerateThemeOutputSchema = z.object({
  background: ThemeColorSchema.describe('The background color of the theme.'),
  foreground: ThemeColorSchema.describe('The primary text/content color, ensuring high contrast with the background.'),
  primary: ThemeColorSchema.describe('The main accent color for buttons and highlights, ensuring high contrast with the background.'),
  ring: ThemeColorSchema.describe("A color for UI highlights like selections. It should be a shade of the 'primary' color, either slightly lighter or darker, to indicate selection without clashing with the theme."),
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

const prompt = ai.definePrompt({
  name: 'generateThemePrompt',
  input: { schema: GenerateThemeInputSchema },
  output: { schema: GenerateThemeOutputSchema },
  prompt: `
    You are an expert UI theme designer with a deep understanding of color theory, word association, and web accessibility standards (WCAG).
    Your task is to generate a creative, unique, and aesthetically pleasing HSL color palette based on user input.

    The user has provided the following parameters:
    - Mood: "{{mood}}"
    {{#if word1}}- Words: "{{word1}}", "{{word2}}", "{{word3}}"{{/if}}

    {{#if word1}}
    Your job is to intelligently assign one word to the background, one to the foreground, and one to the primary accent color.
    Base your assignments on color theory. For example, a darker, less saturated color is usually best for a background, while a brighter, more saturated color makes a good accent.

    When choosing colors, base your selections on the real-world colors associated with the input words.
    To do this, you should research how established color brands (like Pantone or paint companies) name their colors.
    For example, if a user provides the word "eggshell", you should associate it with a natural, off-white color.
    If they say "lavender" or "forest green", learn from professional color systems to choose an appropriate shade.
    {{else}}
    The user has not provided any words. Your task is to invent a theme from scratch, based solely on the specified mood.
    Be creative and generate an interesting, high-quality theme. Think like a professional designer choosing a palette for a new product.
    {{/if}}
    
    After selecting the initial colors (or inventing them), use the 'mood' as a strong guideline to modify and adjust the final HSL values.
    The mood is the most important constraint. Pay special attention to accessibility-related moods.
    For "High Contrast", ensure a WCAG AA or AAA contrast ratio between background and foreground/primary colors.
    For "Tritanopia-Friendly", "Deuteranopia-Friendly", or "Protanopia-Friendly", select colors that are easily distinguishable for users with those types of color vision deficiencies. Avoid problematic color combinations (like red-green for Deuteranopia/Protanopia).
    For other moods like 'dark', 'vibrant', or '80s Retro', adjust the palette accordingly (e.g., lower lightness for 'dark', higher saturation for 'vibrant').

    You must return an object with four HSL color objects: 'background', 'foreground', 'primary', and 'ring'.
    
    - The 'foreground' color MUST have a high contrast ratio with the background color for accessibility and readability.
    - The 'primary' color also MUST have a high contrast ratio with the background.
    - The 'ring' color must be a slightly lighter or darker shade of the 'primary' color. It will be used as a background highlight for selected items, so it needs to be different enough to be noticeable but still harmonious.
    - CRITICAL: You must also consider derived colors. The app uses CSS calculations to create secondary, muted, and accent colors from the three base colors you provide. You MUST generate base colors that result in good contrast for these derived colors as well. For example, the 'foreground' color must be clearly visible on the 'muted' background, which is a lighter shade of the 'primary' color. Always prioritize readability across the entire UI.
    
    Interpret the user's words creatively to generate a harmonious and visually appealing theme that meets all constraints.
  `,
});


const generateThemeFlow = ai.defineFlow(
  {
    name: 'generateThemeFlow',
    inputSchema: GenerateThemeInputSchema,
    outputSchema: GenerateThemeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate theme from the model.');
    }
    return output;
  }
);
