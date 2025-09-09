'use server';
/**
 * @fileOverview This file defines a Genkit flow for analyzing audio recordings to identify individual bird sounds and their corresponding species.
 *
 * - analyzeAudioForBirdSounds - Analyzes an audio recording to isolate and identify bird songs.
 * - AnalyzeAudioForBirdSoundsInput - The input type for the analyzeAudioForBirdSounds function.
 * - AnalyzeAudioForBirdSoundsOutput - The return type for the analyzeAudioForBirdSounds function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAudioForBirdSoundsInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio recording to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeAudioForBirdSoundsInput = z.infer<typeof AnalyzeAudioForBirdSoundsInputSchema>;

const AnalyzeAudioForBirdSoundsOutputSchema = z.array(z.object({
  birdSpecies: z.string().describe('The identified bird species in the audio segment.'),
  audioSegment: z.string().describe('A data URI containing the isolated audio segment of the bird song.'),
}));
export type AnalyzeAudioForBirdSoundsOutput = z.infer<typeof AnalyzeAudioForBirdSoundsOutputSchema>;

export async function analyzeAudioForBirdSounds(input: AnalyzeAudioForBirdSoundsInput): Promise<AnalyzeAudioForBirdSoundsOutput> {
  return analyzeAudioForBirdSoundsFlow(input);
}

const analyzeAudioForBirdSoundsPrompt = ai.definePrompt({
  name: 'analyzeAudioForBirdSoundsPrompt',
  input: {schema: AnalyzeAudioForBirdSoundsInputSchema},
  output: {schema: AnalyzeAudioForBirdSoundsOutputSchema},
  prompt: `You are an expert ornithologist with a specialization in analyzing audio recordings to identify bird species.

You will receive an audio recording and your task is to:

1.  Isolate individual bird songs within the recording.
2.  For each isolated bird song, identify the bird species.
3.  Return an array of JSON objects, where each object contains the identified bird species and a data URI of the isolated audio segment.

Input Audio: {{media url=audioDataUri}}

Ensure that the audio segments are valid data URIs with the appropriate MIME type and Base64 encoding.
`,
});

const analyzeAudioForBirdSoundsFlow = ai.defineFlow(
  {
    name: 'analyzeAudioForBirdSoundsFlow',
    inputSchema: AnalyzeAudioForBirdSoundsInputSchema,
    outputSchema: AnalyzeAudioForBirdSoundsOutputSchema,
  },
  async input => {
    const {output} = await analyzeAudioForBirdSoundsPrompt(input);
    return output!;
  }
);
