# AI-Powered Bird Song Identifier

This document outlines how the AI bird song identifier works and what factors it considers when analyzing audio recordings.

## Overview

The core of the application is the ability to record a sound and have an AI analyze it to identify the species of bird making the sound. The user journey is as follows:

1.  **Recording**: The user navigates to the "Record" page and uses the large record button to capture audio from their microphone.
2.  **Analysis**: Once the recording is complete, the audio data is sent to a secure, cloud-based AI model for analysis.
3.  **Results**: The AI returns information about the identified bird, which is then displayed to the user.
4.  **Logging**: The results of each successful identification are saved as an entry in the user's "Bird Book" (the log page).

## Audio Analysis Factors

When the user submits an audio recording, the AI takes the following steps to identify the bird:

*   **Audio Input**: The audio is sent to the AI model as a data file. The prompt instructs the AI to treat this data as an audio recording of a bird song.
*   **Expert Persona**: The AI is prompted to act as an expert ornithologist. This ensures it draws upon a deep knowledge base of bird species and their vocalizations.
*   **Structured Output**: The AI is required to return a structured JSON object containing the bird's common name, its scientific name, and a brief, interesting fact about it. This ensures the data is predictable and easy to display in the app.
*   **Error Handling**: The prompt also instructs the AI on how to handle cases where the audio does not contain a discernible bird song or if the species cannot be identified. In such cases, it will return a clear message to the user.

## Online vs. Offline Functionality

A crucial aspect of the bird identifier is the distinction between analyzing new recordings and viewing past results:

*   **Online Requirement for Analysis**: The AI model that analyzes the audio is a powerful cloud-based service. Each time a user submits a recording, the app sends the audio data to this service over the internet. Consequently, **an active internet connection is required to identify new bird songs.**

*   **Offline Access to Logged Results**: Any identification result that is saved to the "Bird Book" will be stored using Firebase. This means you will be able to view all your previously identified birds at any time, **even without an internet connection,** once they have been loaded onto your device.