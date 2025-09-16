# AI-Powered Bird Song Identifier

This document outlines how the AI bird song identifier works and what factors it considers when analyzing audio recordings.

## Overview

The core of the application is the ability to record a sound and have an AI analyze it to identify the species of bird making the sound. The user journey is as follows:

1.  **Recording**: The user navigates to the "Record" page and uses the large record button to capture audio from their microphone.
2.  **Analysis**: Once the recording is complete, the audio data, along with any selected location information, is sent to a secure, cloud-based AI model for analysis.
3.  **Results**: The AI returns information about the identified bird, which is then displayed to the user.
4.  **Logging**: The results of each successful identification are saved as an entry in the user's "Bird Book" (the log page).

## Audio Analysis Factors

When the user submits an audio recording, the AI takes the following steps to identify the bird:

*   **Audio Input**: The audio is sent to the AI model as a data file. The prompt instructs the AI to treat this data as an audio recording of a bird song.
*   **Expert Persona**: The AI is prompted to act as an expert ornithologist. This ensures it draws upon a deep knowledge base of bird species and their vocalizations.
*   **Structured Output**: The AI is required to return a structured JSON object containing the bird's common name, its scientific name, a brief, interesting fact, and a prompt for generating an image. This ensures the data is predictable and easy to display in the app.
*   **Error Handling**: The prompt also instructs the AI on how to handle cases where the audio does not contain a discernible bird song. In such cases, it will return a clear message to the user.

## Location-Enhanced Analysis

To significantly improve identification accuracy, the AI can use location data to narrow down potential bird species based on their known geographic ranges and habitats. The user can choose from several modes in the Location Settings:

*   **Device & Manual Location (Coordinates)**: If the user provides precise GPS coordinates (either from their device or entered manually), the AI is instructed to treat this as an **absolute location**. It cross-references this point with scientific databases (e.g., government data, ornithological research) to filter for birds found in that specific habitat. A bird not native to the area is considered highly unlikely to be the correct identification.

*   **Location Description (Text)**: If the user provides a text description (e.g., "Yosemite National Park," "SW1A 0AA"), the AI is instructed to use this as a **strong hint**. It interprets the text to identify a geographical region and then consults reliable sources to determine which birds are commonly found there.

*   **Data Source Hierarchy**: For all location-based analysis, the AI is explicitly instructed to establish a hierarchy of data sources. It must prioritize reliable, scientific resources (like government databases, research papers, and expert field guides) over more general or crowd-sourced information.

*   **Privacy Mode**: If this mode is selected, no location data is sent to the AI. Identification is based solely on the audio recording itself, which may be less accurate due to the lack of geographical context.

## Online vs. Offline Functionality

A crucial aspect of the bird identifier is the distinction between analyzing new recordings and viewing past results:

*   **Online Requirement for Analysis**: The AI model that analyzes the audio is a powerful cloud-based service. Each time a user submits a new recording, the app sends the audio data to this service over the internet. Consequently, **an active internet connection is required to identify new bird songs.**

*   **Offline Access to Logged Results**: Any identification result that is saved to the "Bird Book" is stored on the user's device. This means you will be able to view all your previously identified birds at any time, **even without an internet connection,** once they have been loaded onto your device.

## Detailed Recommendation Version 1

### Implementation Plan: Audio Recording and AI Analysis

Here is a step-by-step plan on how we can implement this.

#### **Phase 1: Capturing Audio on the Client**

This phase focuses on turning the `RecordButton` into a functional audio recorder.

1.  **State Management:** We'll update the `RecordButton` component to manage several states:
    *   `isRecording`: To track if the microphone is currently active.
    *   `isProcessing`: To give the user feedback while the AI is analyzing the audio.
    *   `hasPermission`: To know if we can access the microphone.
    *   `error`: To display any errors, like permission being denied.

2.  **Requesting Permissions:** The first time the user visits the `record` page, the app needs to request permission to use their microphone. We'll use a `useEffect` hook to call `navigator.mediaDevices.getUserMedia({ audio: true })`. We must also handle the case where the user denies permission, displaying a clear message.

3.  **Recording Logic:** We will use the browser's `MediaRecorder` API to handle the actual recording.
    *   When the user clicks the `RecordButton`, we'll start the `MediaRecorder`.
    *   The UI will update to show that recording is in progress (e.g., the button text could change to "Stop Recording").
    *   When the user clicks the button again, we'll stop the `MediaRecorder`. The recorded audio will be compiled into a single file (like a `.wav` or `.webm`).

4.  **Data Conversion:** The recorded audio needs to be sent to our AI backend. The most reliable way to do this is to convert the audio file into a Base64-encoded string, which is a standard way to represent file data as text.

#### **Phase 2: Creating the AI Analysis Flow**

This phase involves building the "brains" of our bird song identifier.

1.  **New Genkit Flow:** We will create a new file, `src/ai/flows/identify-bird-flow.ts`, to define our AI logic.

2.  **Defining Input/Output:**
    *   **Input:** The flow will accept one input: the Base64-encoded audio data string. We'll define a Zod schema to ensure the input is always correctly formatted.
    *   **Output:** The flow will be prompted to return a structured JSON object containing the identified bird's common name, its scientific name, and a short, interesting fact about it. We'll also define this structure with a Zod schema.

3.  **The AI Prompt:** We will write a carefully crafted prompt for the Gemini model. It will instruct the AI to act as an expert ornithologist. The prompt will look something like this:
    > "You are an expert ornithologist. Analyze the following audio data, which contains a bird song. Identify the species of the bird and provide its common name, scientific name, and a brief, engaging description. If you cannot identify a bird or if the audio does not contain a bird song, please indicate that."

4.  **Server Action:** We'll expose this Genkit flow as a server action that our `RecordButton` component can call directly from the client-side. This is a modern Next.js approach that avoids the need to create a separate API endpoint.

#### **Phase 3: Displaying the Results**

This phase is about showing the user what the AI found.

1.  **Calling the AI:** After the recording stops, the `RecordButton` component will call our new server action, sending the Base64 audio data. The UI will show a loading indicator while it waits for the response.

2.  **New Results Page:** We will create a new page, for example `/log/[id]`. After the AI analysis is complete, the app will navigate the user to this page.

3.  **Displaying Data:** The results page will take the analysis data from the AI (common name, scientific name, description) and display it in a clean, readable format. As a bonus, we could use a text-to-image model in a separate flow to generate an image of the identified bird to make the page more visually appealing, as we discussed in Recommendation 2.
