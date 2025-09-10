# AI-Powered Custom Theme Generator

This document outlines how the AI custom theme generator works and what factors it considers when creating a color palette for your application.

## Overview

The theme generator is powered by an AI model that has been instructed to act as an expert UI theme designer with a deep understanding of color theory and word association. Its primary goal is to translate your creative input into a unique, aesthetically pleasing, and accessible color theme.

## Color Generation Factors

When you click the "Generate Theme" button, the AI takes the following parameters into account to create a theme:

*   **Three Inspirational Words**: You provide three words that serve as the creative seeds for the theme's colors. The AI is instructed to intelligently assign these words to the background, foreground, and primary color roles based on design best practices.
*   **Word Association**: The AI will consider the real-world colors associated with your input words (e.g., "eggshell" might become a natural, off-white color). To do this, it will research how established color brands (like Pantone or paint companies) name their colors. If you say "lavender" or "forest green," the AI can learn from professional color systems to choose an appropriate shade.
*   **Mood**: This is a powerful, high-level instruction that guides the overall artistic direction. After selecting a base palette from the three words, the AI uses the selected mood to modify the hue, saturation, and lightness of the final colors. It acts as a final adjustment to achieve the desired feeling.

## Mood Keyword Definitions

The AI has been given specific instructions for the following predefined moods. This ensures more predictable and useful results, especially for accessibility.

*   **Vibrant**: Creates a theme with bright, highly saturated colors.
*   **Calm**: Generates a palette with more muted, desaturated, and soothing colors.
*   **High Contrast**: Prioritizes accessibility by ensuring a very high contrast ratio (WCAG AAA) between background, foreground, and primary colors.
*   **Tritanopia-Friendly**: Creates a color scheme that is optimized for users with tritanopia (blue-yellow color blindness). It avoids blues and yellows that are hard to distinguish.
*   **Deuteranopia-Friendly**: Generates a palette suitable for users with deuteranopia (red-green color blindness), avoiding problematic red/green combinations.
*   **Protanopia-Friendly**: Generates a palette suitable for users with protanopia (red-green color blindness), avoiding problematic red/green combinations.
*   **Minimalist**: Produces a simple, clean theme, often using monochromatic or analogous colors with plenty of white space.
*   **80s Retro**: Creates a nostalgic theme with the bold, neon, and often contrasting colors popular in the 1980s.
*   **Dark**: A classic dark mode theme with a dark background and light text/accents.

## Online vs. Offline Functionality

A crucial aspect of the theme generator is the distinction between generating new themes and using saved ones:

*   **Online Requirement for Generation**: The AI model that generates your themes is a powerful cloud-based service. Each time you click "Generate Theme," your app sends your input words to this service over the internet. Consequently, **an active internet connection is required to generate new themes.** The AI does not store a "save file" of its knowledge on your device for offline generation.

*   **Offline Access to Saved Themes**: Any theme you generate and **save to a slot** is stored locally in your browser's storage. This means you can view, activate, and switch between your saved themes at any time, **even without an internet connection.** Your saved themes will persist when you close and reopen the application on the same device and browser.
