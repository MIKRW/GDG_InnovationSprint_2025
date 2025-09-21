
'use server';
/**
 * @fileOverview A Text-to-Speech (TTS) AI flow.
 *
 * - textToSpeech - A function that converts text into audible speech.
 * - TextToSpeechInput - The input type for the textToSpeech function.
 * - TextToSpeechOutput - The return type for the textToSpeech function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { googleAI } from '@genkit-ai/googleai';
import { convertToWav } from '@/lib/actions';

export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;
const TextToSpeechInputSchema = z.string();

export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;
const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("The generated audio as a data URI in WAV format. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});


const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (text) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Erinome' },
          },
        },
      },
      prompt: text,
    });

    if (!media) {
      throw new Error('TTS generation failed to return media.');
    }
    
    // The raw PCM data is returned as a base64 string in the URL.
    const pcmBase64 = media.url.substring(media.url.indexOf(',') + 1);
    
    // We call a separate server action to handle the conversion to WAV
    // to keep the `wav` package isolated from client-side bundles.
    const wavBase64 = await convertToWav(pcmBase64);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);


export async function textToSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
  return textToSpeechFlow(input);
}
