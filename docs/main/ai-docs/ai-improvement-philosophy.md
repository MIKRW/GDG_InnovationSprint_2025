# AI Improvement Philosophy: The "Scorecard"

This document outlines the core philosophy behind the developer testing framework and, specifically, the purpose of the historical test log.

## The Goal: A More Accurate AI

The primary objective of the testing framework is to provide a structured, repeatable way to measure and improve the accuracy of our AI bird song identifier. The AI's "brain" is the prompt we provide to it in the Genkit flow. To make the AI smarter, we must refine this prompt.

## The Test Log is Our Scorecard

The historical log of test results (stored in a `test-runs` collection in Firestore) is **not for the AI to read directly**. The AI model is a self-contained service; it cannot access our database to "learn" from past results in real-time.

Instead, the test log is our **scorecard**. It is a tool for us, the developers, to measure the impact of our work.

We will use this scorecard to:

1.  **Establish a Baseline:** By running a set of high-quality master audio files through the AI, we get a baseline measurement of its current accuracy.

2.  **Measure Prompt Changes:** When we modify the AI's prompt to try and improve its performance, we can re-run our entire test suite. By comparing the new results to the baseline, we can objectively answer the question: "Did this change make the AI better or worse?"

3.  **Identify Weaknesses:** The log will clearly show us where the AI is struggling. If it consistently fails to identify a specific species or a particular type of call (e.g., a warning call), we know exactly where to focus our prompt engineering efforts.

4.  **Prevent Regressions:** As we add new capabilities, we can use the test log to ensure we haven't accidentally made the AI less accurate on identifications it could previously handle.

In short, the test log is the foundation of our evidence-based approach to improving the AI. It transforms the art of "prompt engineering" into a measurable science, allowing us to build a genuinely world-class bird identification tool.
