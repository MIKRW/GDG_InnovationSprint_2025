
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
import { logErrorToFirestore } from '@/lib/error-logging';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppAIConfig, AppAIVersion, PromptVersion, PromptContent } from '@/lib/types';


// A local utitlity does not need to be exported unlike the next two const. 
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

// A map to hold different versions of the prompt text.
const THEME_GENERATOR_PROMPTS: Record<string, string> = {
  'v1.0.0': `You are a professional UI/UX designer specializing in color theory and accessibility. Your task is to generate a color palette for a web application based on three inspirational words and a 'mood'. The output must be a JSON object with 'background', 'foreground', 'primary', and 'ring' colors in HSL format. You must ensure that the contrast ratios between background, foreground, and primary colors are WCAG AA compliant at a minimum, aiming for AAA where possible, especially for 'High Contrast' mood. The 'ring' color must be a perceptibly lighter or darker shade of the 'primary' color to be visible as a selection indicator. The mood provides the artistic direction and accessibility constraints. For color-blindness-friendly moods, you must avoid color combinations that are difficult to distinguish for that specific type of color vision deficiency.`,
  // Future prompt versions can be added here, e.g. 'v1.1.0': `... a new prompt ...`
};

const DEFAULT_PROMPT = THEME_GENERATOR_PROMPTS['v1.0.0'];

const generateThemeFlow = ai.defineFlow(
  {
    name: 'generateThemeFlow',
    inputSchema: GenerateThemeInputSchema,
    outputSchema: GenerateThemeOutputSchema,
    config: {
      retries: 3, // Automatically retry up to 3 times on failure
    },
  },
  async (input) => {
    try {
      // Determine if we're in dev mode.
      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

      const configDoc = await getDoc(doc(db, 'app_ai_config', 'main'));
      const appConfig = configDoc.data() as AppAIConfig;
      const systemId = 'theme-generator-ai';
      
      let promptText = DEFAULT_PROMPT;
      let promptVersion = 'v1.0.0-default';

      if (appConfig) {
        const activeAppVersionId = isDevMode ? appConfig.developmentAppAIVersion : appConfig.activeAppAIVersion;
        const appVersionDoc = await getDoc(doc(db, 'app_ai_versions', activeAppVersionId));

        if (appVersionDoc.exists()) {
          const appVersionData = appVersionDoc.data() as AppAIVersion;
          const systemVersionId = appVersionData.systems[systemId];

          if (systemVersionId) {
            const versionDoc = await getDoc(doc(db, 'prompt_versions', systemVersionId));
            if (versionDoc.exists()) {
              const versionData = versionDoc.data() as PromptVersion;
              promptVersion = versionData.version;

              const contentId = versionData.composedPrompts['base_instruction'];
              if (contentId) {
                const contentDoc = await getDoc(doc(db, 'prompt_content', contentId));
                if (contentDoc.exists()) {
                  promptText = (contentDoc.data() as PromptContent).promptText;
                }
              }
            }
          }
        }
      }

      const themePrompt = ai.definePrompt({
          name: 'themePrompt',
          prompt: promptText,
          input: { schema: GenerateThemeInputSchema },
          output: { schema: GenerateThemeOutputSchema },
      });

      const response = await themePrompt(input);
      const output = response.output;

      if (!output) {
        throw new Error('The AI model failed to return a valid theme. This has been logged.');
      }
      
      output.promptVersion = promptVersion;
      return output;

    } catch (error) {
        console.error("Error in generateThemeFlow:", error);
        await logErrorToFirestore(error as Error, 'theme-generation-failure', {
            input: input,
            flow: 'generateThemeFlow',
        });
        throw error;
    }
  }
);
