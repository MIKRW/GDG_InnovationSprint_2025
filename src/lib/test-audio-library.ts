/**
 * @fileOverview A centralized library for storing metadata about test audio files.
 * This allows for a single, structured source of truth for all test cases.
 */

/**
 * Defines the structure for a single test audio file's metadata.
 */
export interface TestAudioMetadata {
  id: string;
  fileName: string; // The corresponding .wav file in /public/test-audio/
  sourceUrl: string;
  author: string;
  license: string;
  description: string;
  hardware: string;
  location: string;
}

/**
 * An array containing all the metadata for the test audio files.
 * To add a new test case, add its .wav file to the /public/test-audio/ directory
 * and add a corresponding metadata object to this array.
 */
export const testAudioLibrary: TestAudioMetadata[] = [
  {
    id: 'test_audio_1',
    fileName: 'test_audio_1.wav',
    sourceUrl: 'https://freesound.org/s/584903/',
    author: 'kangaroovindaloo',
    license: 'Creative Commons 0',
    description: 'The sound of a magpie in Fryers Forest.',
    hardware: 'Mid-side configuration: Sennheiser MKH 416 & MKH 30 into a Zoom F4.',
    location: 'Fryers Forest',
  },
  // Add new test audio metadata objects here
];
