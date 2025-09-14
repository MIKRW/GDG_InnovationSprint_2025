
'use server';
/**
 * @fileOverview An AI flow for identifying bird species from audio recordings.
 * This flow now dynamically assembles its prompt at runtime based on the
 * active AI version configured in Firestore.
 *
 * - identifyBirdBySound - A function that analyzes an audio recording to identify a bird.
 * - IdentifyBirdInput - The input type for the identifyBirdBySound function.
 * - IdentifyBirdOutput - The return type for the identifyBirdBySound function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AppAIVersion, PromptContent, PromptVersion } from '@/lib/types';

// Helper function to replace placeholders in a template
function compileTemplate(template: string, data: Record<string, any>): string {
    let result = template;
    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const value = data[key];
            if (value !== undefined && value !== null) {
                 // Simple replacement for {{key}} and {{media url=key}}
                 result = result.replace(new RegExp(`{{media url=${key}}}`, 'g'), `{{media url=${value}}}`);
                 result = result.replace(new RegExp(`{{{?${key}}}}?`, 'g'), String(value));
            }
        }
    }
    // Handle conditional blocks like {{#if key}}...{{/if}}
    result = result.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
        return data[key] ? content : '';
    });

    return result;
}


// Helper function to fetch and compose the prompt dynamically from Firestore
async function getDynamicPrompt(systemId: string): Promise<string> {
    try {
        // 1. Get the active App AI Version ID
        const configDocSnap = await getDoc(doc(db, 'app_ai_config', 'main'));
        if (!configDocSnap.exists()) {
            throw new Error('FATAL: app_ai_config/main document not found.');
        }
        const activeAppVersionId = configDocSnap.data().activeAppAIVersion;

        // 2. Get the App AI Version manifest
        const appVersionDocSnap = await getDoc(doc(db, 'app_ai_versions', activeAppVersionId));
        if (!appVersionDocSnap.exists()) {
            throw new Error(`FATAL: Active App AI Version document '${activeAppVersionId}' not found.`);
        }
        const appVersionData = appVersionDocSnap.data() as AppAIVersion;

        // 3. Find the prompt_version ID for the requested system
        const promptVersionId = appVersionData.systems[systemId];
        if (!promptVersionId) {
            throw new Error(`System '${systemId}' not found in App AI Version '${activeAppVersionId}'.`);
        }

        // 4. Get the prompt_version document
        const promptVersionDocSnap = await getDoc(doc(db, 'prompt_versions', promptVersionId));
        if (!promptVersionDocSnap.exists()) {
            throw new Error(`Prompt version document '${promptVersionId}' not found.`);
        }
        const promptVersionData = promptVersionDocSnap.data() as PromptVersion;

        // 5. Fetch all required prompt_content documents
        const contentIds = Object.values(promptVersionData.composedPrompts);
        if (contentIds.length === 0) {
            return ''; // Return empty if no content is specified
        }

        const contentQuery = query(collection(db, 'prompt_content'), where('__name__', 'in', contentIds));
        const contentSnapshot = await getDocs(contentQuery);
        
        const contentsById = new Map<string, PromptContent>();
        contentSnapshot.forEach(doc => {
            contentsById.set(doc.id, doc.data() as PromptContent);
        });

        // 6. Assemble the prompt in the correct order
        const composedPrompt = Object.values(promptVersionData.composedPrompts)
            .map(id => contentsById.get(id)?.promptText)
            .filter(Boolean) // Filter out any undefined/missing content
            .join('\n\n'); // Join parts with double newlines

        return composedPrompt;

    } catch (error) {
        console.error("CRITICAL: Failed to assemble dynamic prompt.", error);
        // Fallback to a very basic, hardcoded prompt as a last resort
        return `You are an expert ornithologist. Analyze the provided audio and identify the bird.
        Audio data: {{media url=audioDataUri}}
        Return a JSON object with 'isBirdSong', 'commonName', 'scientificName', and 'description'.
        If no bird is identified, set 'isBirdSong' to false.`;
    }
}


const IdentifyBirdInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "A recording of a bird song, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
    timestamp: z.string().describe('The UTC timestamp of when the recording was made, in ISO 8601 format.'),
    latitude: z.number().optional().describe('The latitude of where the recording was made.'),
    longitude: z.number().optional().describe('The longitude of where the recording was made.'),
    locationDescription: z.string().optional().describe('A user-provided text description of the location (e.g., postcode, city, national park name).'),
    mode: z.enum(['newbie', 'twitcher']).describe('The application mode selected by the user, which may determine the expected audio quality and analysis depth.'),
});
export type IdentifyBirdInput = z.infer<typeof IdentifyBirdInputSchema>;

const IdentifyBirdOutputSchema = z.object({
  isBirdSong: z.boolean().describe('Whether or not the audio is believed to contain a bird song.'),
  commonName: z.string().optional().describe("The common name of the identified bird (e.g., 'American Robin')."),
  scientificName: z.string().optional().describe("The scientific name of the identified bird (e.g., 'Turdus migratorius')."),
  family: z.string().optional().describe("The taxonomic family of the bird (e.g., 'Psittacidae' for parrots)."),
  order: z.string().optional().describe("The taxonomic order of the bird (e.g., 'Passeriformes' for perching birds)."),
  description: z.string().optional().describe('A brief, interesting fact or description about the bird.'),
  imagePrompt: z.string().optional().describe('A simple, descriptive prompt for a text-to-image model to generate a picture of the bird (e.g., "photo of an American Robin on a branch").'),
  confidence: z.number().optional().describe('A number between 0 and 1 representing the AI\'s confidence in the identification.'),
  season: z.string().optional().describe("The season at the location of the recording (e.g., 'Summer', 'Winter')."),
  weather: z.string().optional().describe("A brief summary of the weather conditions (e.g., 'Clear, 15°C, light breeze')."),
});
export type IdentifyBirdOutput = z.infer<typeof IdentifyBirdOutputSchema>;

const getCurrentWeather = ai.defineTool(
    {
      name: 'getCurrentWeather',
      description: 'Gets the historical weather for a given location and timestamp.',
      inputSchema: z.object({
        latitude: z.number(),
        longitude: z.number(),
        date: z.string().describe('The date in ISO 8601 format (YYYY-MM-DD).'),
      }),
      outputSchema: z.object({
        season: z.string(),
        temperature_celsius: z.number(),
        precipitation_mm: z.number(),
        wind_speed_kmh: z.number(),
        conditions: z.string(),
      }),
    },
    async ({ latitude, date }) => {
      // In a real app, this would call a weather API.
      // For now, we simulate it based on latitude and date to demonstrate the tool's functionality.
      const month = new Date(date).getMonth() + 1;
      const isNorthernHemisphere = latitude > 0;
  
      let season = 'Spring';
      if (month >= 3 && month <= 5) season = isNorthernHemisphere ? 'Spring' : 'Autumn';
      if (month >= 6 && month <= 8) season = isNorthernHemisphere ? 'Summer' : 'Winter';
      if (month >= 9 && month <= 11) season = isNorthernHemisphere ? 'Autumn' : 'Spring';
      if (month === 12 || month <= 2) season = isNorthernHemisphere ? 'Winter' : 'Summer';
  
      // Simulate some weather variations
      const temp = Math.floor(Math.random() * 20) + (season === 'Summer' ? 15 : 5);
      const precip = Math.random() > 0.8 ? Math.random() * 10 : 0;
      const wind = Math.random() * 20;
  
      return {
        season,
        temperature_celsius: parseFloat(temp.toFixed(1)),
        precipitation_mm: parseFloat(precip.toFixed(1)),
        wind_speed_kmh: parseFloat(wind.toFixed(1)),
        conditions: precip > 0 ? 'Rainy' : 'Clear',
      };
    }
  );


export async function identifyBirdBySound(
  input: IdentifyBirdInput
): Promise<IdentifyBirdOutput> {
  return await identifyBirdFlow(input);
}


const identifyBirdFlow = ai.defineFlow(
  {
    name: 'identifyBirdFlow',
    inputSchema: IdentifyBirdInputSchema,
    outputSchema: IdentifyBirdOutputSchema,
    retries: 3,
  },
  async (input) => {
    
    const systemId = input.mode === 'twitcher' ? 'bird-identifier-ai-twitcher' : 'bird-identifier-ai-newbie';
    const promptTemplate = await getDynamicPrompt(systemId);
    
    const { output } = await ai.generate({
      prompt: compileTemplate(promptTemplate, input),
      model: 'googleai/gemini-2.5-flash',
      output: { schema: IdentifyBirdOutputSchema },
      tools: [getCurrentWeather]
    });

    if (!output) {
      throw new Error('The model failed to return a valid analysis.');
    }
    return output;
  }
);
