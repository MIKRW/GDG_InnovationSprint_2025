'use server';

import { z } from 'zod';
import { generateEnvironmentProfile } from '@/ai/flows/generate-environment-profile';
import { predictPossibleBirds } from '@/ai/flows/predict-possible-birds';
import { rankBirdLikelihood } from '@/ai/flows/rank-bird-likelihood';
import { analyzeAudioForBirdSounds } from '@/ai/flows/analyze-audio-for-bird-sounds';
import { suggestTopBirds } from '@/ai/flows/suggest-top-birds';
import type { Bird } from '@/lib/types';
import type { PredictPossibleBirdsOutput } from '@/ai/flows/predict-possible-birds';

const actionSchema = z.object({
  audioDataUri: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  manualInput: z.string().optional(),
});

type ActionInput = z.infer<typeof actionSchema>;

export async function getBirdAnalysis(input: ActionInput): Promise<{ birds?: Bird[]; error?: string }> {
  try {
    const validatedInput = actionSchema.parse(input);

    let environmentProfile = '';
    let birdPredictions: PredictPossibleBirdsOutput = [];
    
    const profileInput = validatedInput.location 
      ? { locationData: `lat: ${validatedInput.location.latitude}, lon: ${validatedInput.location.longitude}` }
      : { manualInput: validatedInput.manualInput };

    // Generate environment profile
    const envProfileOutput = await generateEnvironmentProfile(profileInput);
    environmentProfile = envProfileOutput.environmentProfile;

    // Predict possible birds
    const predictionInput = validatedInput.location
      ? { latitude: validatedInput.location.latitude, longitude: validatedInput.location.longitude }
      : { environmentDetails: validatedInput.manualInput };
    birdPredictions = await predictPossibleBirds(predictionInput);
    const predictedBirdNames = birdPredictions.map(b => b.speciesName);

    // Rank likelihood (only if location is available, as required by the flow)
    let rankedBirdNames: string[] = [];
    if(validatedInput.location){
        const likelihoodRankingOutput = await rankBirdLikelihood({
            environmentProfile,
            locationData: `lat: ${validatedInput.location.latitude}, lon: ${validatedInput.location.longitude}`,
        });
        rankedBirdNames = likelihoodRankingOutput.map(b => b.birdSpecies);
    }

    // Analyze audio for bird sounds
    const audioAnalysisOutput = await analyzeAudioForBirdSounds({ audioDataUri: validatedInput.audioDataUri });
    const analyzedBirdNames = audioAnalysisOutput.map(a => a.birdSpecies);

    // Suggest top birds
    const topBirdsOutput = await suggestTopBirds({
      birdPrediction: predictedBirdNames,
      audioAnalysis: analyzedBirdNames,
      likelihoodRanking: rankedBirdNames,
    });
    
    if (!topBirdsOutput.topBirds || topBirdsOutput.topBirds.length === 0) {
      return { error: "The AI could not determine the top bird suggestions. The audio might be unclear." };
    }

    // Map results to our Bird type
    const finalBirds: Bird[] = topBirdsOutput.topBirds.map((name, index) => {
      const birdDetail = birdPredictions.find(p => p.speciesName.toLowerCase() === name.toLowerCase());
      const speciesWords = name.split(' ');
      const hint = speciesWords.length > 1 ? `${speciesWords[0]} ${speciesWords[1]}` : speciesWords[0];

      return {
        speciesName: birdDetail?.speciesName || name,
        scientificName: birdDetail?.scientificName || 'N/A',
        description: birdDetail?.description || 'No detailed description available.',
        imageUrl: `https://picsum.photos/seed/${name.replace(/\s/g, '')}/600/400`,
        dataAiHint: hint,
      };
    });

    return { birds: finalBirds };

  } catch (error) {
    console.error("Error in getBirdAnalysis server action:", error);
    if (error instanceof z.ZodError) {
      return { error: 'Invalid input provided for analysis.' };
    }
    // It's better to return a generic error message to the client
    return { error: 'An unexpected error occurred on the server. Please check server logs for details.' };
  }
}
