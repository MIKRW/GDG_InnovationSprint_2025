# AI-Powered Custom Theme Generator

This document outlines how the AI custom theme generator works and what factors it considers when creating a color palette for your application.

## Overview

The theme generator is powered by an AI model that has been instructed to act as an expert UI theme designer with a deep understanding of color theory and word association. Its primary goal is to translate your creative input into a unique, aesthetically pleasing, and accessible color theme.

## Color Generation Factors

When you click the "Generate Theme" button, the AI takes the following four parameters into account to create a theme:

*   **Background Word**: This word serves as the main inspiration for the theme's background color. The AI will consider the real-world colors associated with this word (e.g., "sky" might become a shade of blue, "sand" could be a warm beige).

*   **Foreground Word**: This word guides the choice for the primary text and content color. The AI will choose a color based on this word, but a key instruction is to ensure this color has a **high contrast ratio** with the background color to maintain readability and accessibility.

*   **Primary Word**: This word inspires the accent color, which is used for interactive elements like buttons and highlights. Similar to the foreground, this color must also contrast well with the background.

*   **Mood**: This is a powerful, high-level instruction that guides the overall artistic direction. You can use words like "dark," "light," "calm," "vibrant," or even stylistic prompts like "80's" or "retro." The AI uses the mood to influence the final saturation, lightness, and overall style of the entire color palette.
