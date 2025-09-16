# AI Strategy & Prompting Philosophy Summary

This document summarizes the key principles and strategies behind the AI implementation in this application.

## 1. We Use a "Mixture of Experts"

We use a family of different Google AI models, each chosen for its specific strengths, rather than a single model for all tasks.
- **For complex analysis and reasoning** (like bird identification or theme generation), we use **Gemini 2.5 Flash**. It is a powerful multimodal model that is optimized for speed and cost-effectiveness, providing a great user experience.
- **For creative tasks** (like generating bird images), we use a specialized model like **Imagen**, which is designed specifically for high-quality text-to-image generation.

## 2. Developer API vs. Public Chat

Our application uses Genkit to connect directly to the underlying Google AI **developer APIs**. This gives us access to the full, raw power of the models, including their native ability to process audio. This is different from the public Gemini chat website, which is an *application* built on top of the same APIs and may not expose all features to the general public.

## 3. Prompting Style Depends on the Task

The way we prompt the AI is tailored to the model and the complexity of the job.
- **Instructional Prompts:** For single-purpose models like Imagen, we use simple, direct commands (e.g., "photo of an American Robin on a branch").
- **Contextual Prompts:** For complex analytical tasks with Gemini, we provide rich context to guide its reasoning. We give it a persona ("You are an expert ornithologist"), provide critical data (location, time), and specify the output format. We are guiding its internal thought process, not just giving it an order.

## 4. The AI's Knowledge is Internal; Our Context is the Guide

The AI models do not have a "database" they search in real-time. Their knowledge comes from the vast, static dataset they were trained on. They are pattern-matching engines.
- **Our Role:** We do not need to provide the AI with a library of reference audio. Our job is to provide high-quality **context** (like location and time) that helps the AI narrow down possibilities from its own vast internal knowledge.

## 5. We Cannot Trust Blindly; We Must Verify

The only way to be confident in our AI's accuracy is to build a robust **Developer Testing Framework**.
- **The Goal:** To create a repeatable, data-driven way to measure the performance of our AI prompts and models.
- **The Method:** We will use a "ground truth" of master audio files to test the AI. The results will be logged and analyzed, giving us a concrete accuracy score. This framework is the most critical component for professionally managing and improving our AI.

## 6. Long-Term Improvement Strategy

The AI improves in two ways:
1.  **Base Model Updates (By Google):** Google periodically releases new and improved versions of its base models. We can upgrade to these models and use our testing framework to verify that they improve our app's performance.
2.  **Fine-Tuning (By Us, in the future):** We can use the high-quality, user-verified data we collect (`all_analysis_runs`) to perform additional training on a base model, creating a custom "specialist" version that is even better at bird identification.

## 7. Online vs. Offline Functionality

- **Online Required:** Identifying a **new** bird song will always require an internet connection to communicate with the cloud-based AI models.
- **Offline Capable:** Viewing the **saved results** in the "Bird Book" works offline, as this data is synced to the user's device.
