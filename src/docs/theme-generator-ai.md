# AI-Powered Custom Theme Generator

This document outlines how the AI custom theme generator works and what factors it considers when creating a color palette for your application.

## Overview

The theme generator is powered by an AI model that has been instructed to act as an expert UI theme designer with a deep understanding of color theory and word association. Its primary goal is to translate your creative input into a unique, aesthetically pleasing, and accessible color theme.

## Color Generation Factors

When you click the "Generate Theme" button, the AI takes the following parameters into account to create a theme:

*   **Three Inspirational Words**: You provide three words that serve as the creative seeds for the theme's colors. The AI is instructed to intelligently assign these words to the background, foreground, and primary color roles based on design best practices.
*   **Word Association**: The AI will consider the real-world colors associated with your input words (e.g., "eggshell" might become a natural, off-white color). To do this, it will research how established color brands (like Pantone or paint companies) name their colors. If you say "lavender" or "forest green," the AI can learn from professional color systems to choose an appropriate shade.
*   **Mood**: This is a powerful, high-level instruction that guides the overall artistic direction. After selecting a base palette from the three words, the AI uses the mood (e.g., "dark," "light," "calm," "high contrast," or "80's") to modify the hue, saturation, and lightness of the final colors. It acts as a final adjustment to achieve the desired feeling.

## Design Rationale: Why Use Separate Inputs?

A key design decision for the theme generator was whether to use multiple, structured inputs (three words + a mood) or a single, freeform text box for a descriptive sentence (e.g., "a quiet beach at dusk").

The current approach with separate inputs was chosen for the following reasons:

*   **Structured & Reliable Input**: Providing three distinct words gives the AI clear, separate concepts to work with. The current instructions guide the AI to assign one word to the background, one to the foreground, and one to the primary color based on design theory. This structure makes it easier for the AI to consistently generate a balanced and usable theme.
*   **Predictable Results**: The structured input leads to more predictable and reliable outcomes. While a descriptive sentence is more expressive, it's a more complex task for the AI to parse, which could lead to less consistent results.
*   **Focused Development**: The current AI prompt is specifically engineered and refined for the "3 words + mood" structure. This focused approach allows for higher quality output without the extensive prompt re-engineering that a freeform input would require.

While a single-sentence input offers more creative freedom, the current setup provides a more robust and effective foundation for generating high-quality themes at this stage.
