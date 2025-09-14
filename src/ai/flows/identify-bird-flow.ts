
'use server';
/**
 * @fileOverview An AI flow for identifying bird species from audio recordings.
 *
 * - identifyBirdBySound - A function that analyzes an audio recording to identify a bird.
 * - IdentifyBirdInput - The input type for the identifyBirdBySound function.
 * - IdentifyBirdOutput - The return type for the identifyBirdBySound function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const newbiePromptText = `You are an expert ornithologist assisting a curious beginner. Your tone should be encouraging and accessible.
Focus on providing a clear identification and an interesting, memorable fact.

Analyze the following audio data to identify the bird species.
Audio data: {{media url=audioDataUri}}

When using location to assist with identification, you must cross-reference against publicly available data to understand the bird's known geographic range and habitat.
You must establish a hierarchy of data sources, prioritizing reliable, scientific, and field-specific resources (such as government databases, ornithological research papers, and well-known field guides) over general public information or crowd-sourced data.

{{#if locationDescription}}
The recording was made in or near: "{{locationDescription}}".
Use this information as a strong hint to narrow down the possible bird species. A bird not typically found in this location is less likely to be the correct identification.
{{else if latitude}}
The recording was made at the absolute location of latitude: {{latitude}}, longitude: {{longitude}}.
Use this precise location as a primary factor to determine the possible bird species. A bird that is not found in this exact area is highly unlikely to be the correct identification.
{{/if}}

If location and timestamp are provided, you MUST use the 'getCurrentWeather' tool to fetch the weather conditions.
In your analysis, consider the time of day, season, and weather, as these factors influence bird behavior and vocalizations.
In your final output, include the season and a summary of the weather.

Your task is to return a JSON object with the following structure:
- isBirdSong: A boolean indicating if you are confident a bird song is present in the audio.
- commonName: The common name of the bird.
- scientificName: The scientific (Latin) name of the bird.
- family: The taxonomic family of the bird (e.g., 'Psittacidae' for parrots).
- order: The taxonomic order of the bird (e.g., 'Passeriformes' for perching birds).
- description: A brief, interesting fact about the bird.
- imagePrompt: A simple but effective text-to-image prompt to generate a photo of this bird.
- season: The season at the location of the recording (e.g., 'Summer', 'Winter').
- weather: A brief summary of the weather conditions (e.g., 'Clear, 15°C, light breeze').


CRITICAL: If the audio does not contain a discernible bird song, or if you are not highly confident in your identification, you MUST set "isBirdSong" to false and leave the other fields empty.
Do not guess or invent a bird. It is better to indicate that no bird song was identified than to provide a potentially incorrect answer.`;

const twitcherPromptText = `You are an expert ornithologist assisting a researcher or serious hobbyist. Your analysis must be as precise as possible.
Prioritize scientific accuracy and detail. Use the provided high-fidelity audio.

Analyze the following audio data to identify the bird species.
Audio data: {{media url=audioDataUri}}

When using location to assist with identification, you must cross-reference against publicly available data to understand the bird's known geographic range and habitat.
You must establish a hierarchy of data sources, prioritizing reliable, scientific, and field-specific resources (such as government databases, ornithological research papers, and well-known field guides) over general public information or crowd-sourced data.

{{#if locationDescription}}
The recording was made in or near: "{{locationDescription}}".
Use this information as a strong hint to narrow down the possible bird species. A bird not typically found in this location is less likely to be the correct identification.
{{else if latitude}}
The recording was made at the absolute location of latitude: {{latitude}}, longitude: {{longitude}}.
Use this precise location as a primary factor to determine the possible bird species. A bird that is not found in this exact area is highly unlikely to be the correct identification.
{{/if}}

If location and timestamp are provided, you MUST use the 'getCurrentWeather' tool to fetch the weather conditions.
In your analysis, consider the time of day, season, and weather, as these factors influence bird behavior and vocalizations.
In your final output, include the season and a summary of the weather.

Your task is to return a JSON object with the following structure:
- isBirdSong: A boolean indicating if you are confident a bird song is present in the audio.
- commonName: The common name of the bird.
- scientificName: The scientific (Latin) name of the bird.
- family: The taxonomic family of the bird (e.g., 'Psittacidae' for parrots).
- order: The taxonomic order of the bird (e.g., 'Passeriformes' for perching birds).
- description: A brief, interesting fact about the bird.
- imagePrompt: A simple but effective text-to-image prompt to generate a photo of this bird.
- season: The season at the location of the recording (e.g., 'Summer', 'Winter').
- weather: A brief summary of the weather conditions (e.g., 'Clear, 15°C, light breeze').


CRITICAL: If the audio does not contain a discernible bird song, or if you are not highly confident in your identification, you MUST set "isBirdSong" to false and leave the other fields empty.
Do not guess or invent a bird. It is better to indicate that no bird song was identified than to provide a potentially incorrect answer.`;

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

const newbieIdentifyBirdPrompt = ai.definePrompt({
  name: 'newbieIdentifyBirdPrompt',
  input: { schema: IdentifyBirdInputSchema },
  output: { schema: IdentifyBirdOutputSchema },
  prompt: newbiePromptText,
  tools: [getCurrentWeather],
});

const twitcherIdentifyBirdPrompt = ai.definePrompt({
  name: 'twitcherIdentifyBirdPrompt',
  input: { schema: IdentifyBirdInputSchema },
  output: { schema: IdentifyBirdOutputSchema },
  prompt: twitcherPromptText,
  tools: [getCurrentWeather],
});

const identifyBirdFlow = ai.defineFlow(
  {
    name: 'identifyBirdFlow',
    inputSchema: IdentifyBirdInputSchema,
    outputSchema: IdentifyBirdOutputSchema,
  },
  async (input) => {
    let response;

    if (input.mode === 'twitcher') {
      response = await twitcherIdentifyBirdPrompt(input);
    } else {
      response = await newbieIdentifyBirdPrompt(input);
    }

    const { output } = response;
    if (!output) {
      throw new Error('The model failed to return a valid analysis.');
    }
    return output;
  }
);

    