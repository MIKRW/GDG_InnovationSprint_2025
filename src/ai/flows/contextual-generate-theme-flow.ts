
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
import { getActiveAIConfig } from '@/lib/actions';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppAIVersion, PromptVersion, PromptContent } from '@/lib/types';

// A local utitlity does not need to be exported unlike the next two const.
const ThemeColorSchema = z.object({
  h: z.number().describe('The hue value (0-360).'),
  s: z.number().describe('The saturation value (0-100).'),
  l: z.number().describe('The lightness value (0-100).'),
});

const GenerateThemeOutputSchema = z.object({
  background: ThemeColorSchema.describe('The background color of the theme.'),
  foreground: ThemeColorSchema.describe(
    'The primary text/content color, ensuring high contrast with the background.'
  ),
  primary: ThemeColorSchema.describe(
    'The main accent color for buttons and highlights, ensuring high contrast with the background.'
  ),
  ring: ThemeColorSchema.describe(
    "A color for UI highlights like selections. It should be a shade of the 'primary' color, with a lightness value that is at least 10-15% lighter or darker to ensure it is always visible as a selection state."
  ),
  promptVersion: z
    .string()
    .optional()
    .describe('The version of the AI system used for this generation.'),
});
export type GenerateThemeOutput = z.infer<typeof GenerateThemeOutputSchema>;

const GenerateThemeInputSchema = z.object({
  word1: z.string().optional().describe('A word to inspire a color.'),
  word2: z.string().optional().describe('A second word to inspire a color.'),
  word3: z.string().optional().describe('A third word to inspire a color.'),
  mood: z.string().describe(
    'A keyword that defines the desired aesthetic and accessibility constraints (e.g., "High Contrast", "Tritanopia-Friendly", "Vibrant", "Dark").'
  ),
});
export type GenerateThemeInput = z.infer<typeof GenerateThemeInputSchema>;

// This is now defined statically. The dynamic content will be passed into it.
const themePrompt = ai.definePrompt({
  name: 'themePrompt',
  input: {
    schema: GenerateThemeInputSchema.extend({
      baseInstruction: z.string(),
    }),
  },
  output: { schema: GenerateThemeOutputSchema },
  config: {
    temperature: 0.7, // Increase creativity and reduce repetition.
  },
  prompt: `{{{baseInstruction}}}

Here is the user's input:
- Word 1: {{{word1}}}
- Word 2: {{{word2}}}
- Word 3: {{{word3}}}
- Mood: {{{mood}}}`,
});

const DEFAULT_THEME_PROMPT = `You are a professional UI/UX designer specializing in color theory and accessibility. Your task is to generate a color palette for a web application based on three inspirational words and a 'mood'. The output must be a JSON object with 'background', 'foreground', 'primary', and 'ring' colors in HSL format.

While maintaining accessibility, strive for creative and colorful palettes. High contrast does not exclusively mean using white or near-white backgrounds; explore a wider range of base colors that can still provide good readability.

You must ensure that the contrast ratios between background, foreground, and primary colors are WCAG AA compliant at a minimum, aiming for AAA where possible, especially for 'High-Contrast' mood. The 'ring' color must be a perceptibly lighter or darker shade of the 'primary' color to be visible as a selection indicator. The mood provides the artistic direction and accessibility constraints. For color-blindness-friendly moods, you must avoid color combinations that are difficult to distinguish for that specific type of color vision deficiency.`;

export async function generateTheme(
  input: GenerateThemeInput
): Promise<GenerateThemeOutput> {
  return await generateThemeFlow(input);
}

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
    let promptVersion = 'v1.0.0-fallback';
    let baseInstruction = DEFAULT_THEME_PROMPT;
    
    try {
      // Logic to fetch dynamic prompt is now correctly inside the flow
      const appConfig = await getActiveAIConfig();
      const systemId = 'theme-generator-ai';

      if (appConfig?.activeAppAIVersion) {
        const appVersionDoc = await getDoc(
          doc(db, 'app_ai_versions', appConfig.activeAppAIVersion)
        );

        if (appVersionDoc.exists()) {
          const appVersionData = appVersionDoc.data() as AppAIVersion;
          const systemVersionId = appVersionData.systems[systemId];

          if (systemVersionId) {
            const versionDoc = await getDoc(
              doc(db, 'prompt_versions', systemVersionId)
            );
            if (versionDoc.exists()) {
              const versionData = versionDoc.data() as PromptVersion;
              promptVersion = versionData.version;

              const contentId = versionData.composedPrompts['base_instruction'];
              if (contentId) {
                const contentDoc = await getDoc(
                  doc(db, 'prompt_content', contentId)
                );
                if (contentDoc.exists()) {
                  baseInstruction = (
                    contentDoc.data() as PromptContent
                  ).promptText;
                }
              }
            }
          }
        }
      }
    } catch (configError) {
      console.warn(
        'Could not fetch dynamic AI config, using fallback prompt.',
        configError
      );
      // Non-fatal error, we will proceed with the default prompt.
    }
    
    try {
      const response = await themePrompt({ ...input, baseInstruction });
      const output = response.output;

      if (!output) {
        const finishReason = response.finishReason;

        if (finishReason === 'safety') {
            await logErrorToFirestore(new Error('AI safety filters triggered'), 'theme-gen-safety-failure', {
                input,
                finishReason,
            });
            throw new Error('The AI refused to generate a theme due to its safety filters. Please try different words.');
        }

        throw new Error(
          'The AI model failed to return a valid theme. This has been logged.'
        );
      }

      // Manually add the determined prompt version to the final output
      output.promptVersion = promptVersion;

      return output;

    } catch (generationError) {
      console.error('Error in generateThemeFlow during AI generation:', generationError);
      
      if ((generationError as Error).message.includes('safety filters')) {
        throw generationError;
      }
      
      let errorMessage = 'Could not generate the theme. This error has been logged.';
      const rawError = (generationError as Error).message || '';
      
      if (rawError.includes('429') || rawError.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = 'The AI service is currently busy. Please try again in a moment.';
      } else if (rawError.includes('503') || rawError.toLowerCase().includes('overloaded')) {
          errorMessage = 'The AI service is temporarily overloaded. Please try again shortly.';
      } else if (rawError.toLowerCase().includes('failed precondition')) {
          errorMessage = 'A cloud configuration error occurred. Please ensure billing and the Vertex AI API are enabled on the project.';
      }
      
      await logErrorToFirestore(generationError as Error, 'theme-generation-failure', {
        input: input,
        flow: 'generateThemeFlow',
      });

      throw new Error(errorMessage);
    }
  }
);
