
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

const NEWBIE_PROMPT_TEMPLATE = `You are an expert ornithologist with a special talent for making bird identification accessible and exciting for beginners. Your main goal is to listen to an audio recording and figure out what bird is singing.

Here's the information you'll be working with:
- A timestamp of when the recording was made.
- The audio data itself.
{{#if latitude}}- The user's location (latitude and longitude).{{/if}}
{{#if locationDescription}}- A text description of where the user is.{{/if}}

Your most important job is to identify the bird from its song.

If you are given a location, use it! It's a huge clue. Figure out the geographic area and check reliable bird-watching resources (like government wildlife websites, university research, or digital field guides) to see which birds are expected to be in that specific area during that time of year. If a bird isn't native to the location, it's probably not the right one.

You also have a tool called 'getCurrentWeather'. Please use it to find out the season and weather conditions when the recording was made. You'll need to include this information in your final answer.

For the description, write a fun, interesting fact about the bird that a beginner would enjoy.
For the image prompt, give a simple, clear instruction for an image generator (e.g., "photo of a European Robin perched on a mossy branch").
Also, provide your confidence in the identification.

If you're not confident you heard a bird, or if it's just noise, please indicate that.`;


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
    
    // Simplified: Always use the same prompt for now.
    // This will be replaced with logic to fetch the correct prompt from Firestore.
    const promptTemplate = NEWBIE_PROMPT_TEMPLATE;
    
    const { output } = await ai.generate({
      prompt: promptTemplate,
      input: input,
      model: 'googleai/gemini-2.5-flash',
      output: { schema: IdentifyBirdOutputSchema },
      tools: [getCurrentWeather],
    });

    if (!output) {
      throw new Error('The model failed to return a valid analysis.');
    }
    return output;
  }
);
