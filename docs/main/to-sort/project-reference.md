# Project Reference

This document outlines the core layout structure, components, and theme of the application.

## Layout System

The application uses a consistent layout system defined in `src/components/layout/`.

### Core Layout Components

- **`AppLayout.tsx`**: The main wrapper applied to each page. It accepts a `header` prop to allow for different headers per page and provides a flexible container for main content and the page-specific footer.

- **`PrimaryHeader.tsx`**: The default top bar of the application. It contains the contrast and speaker control buttons.
- **`SecondaryHeader.tsx`**: An alternative header, currently identical to the primary, used on the Log page.

- **`GridContainer.tsx`**: A component that creates a 3x3 grid layout, used on the home page to center the logo and on the record page to center the record button.

- **`HomePageFooter.tsx`**: The navigation footer used exclusively on the home page. It provides navigation to the `record`, `log`, and `settings` pages.

- **`SecondaryPageFooter.tsx`**: A navigation footer that provides links to `home`, `log`, and `settings`.
- **`SecondaryPageFooterV2.tsx`**: An updated footer that also includes a link to the `record` page, used on the `log` and `settings` pages.

## Content Components

These are the reusable UI elements that make up the application's content.

- **`AppName.tsx`**: A styled text component for displaying the application's name, used on the home page.
- **`ContrastButton.tsx`**: The button in the `Header` for toggling UI contrast.
- **`Logo.tsx`**: Renders the circular application logo.
- **`MicrophoneIcon.tsx`**: The microphone icon used inside the `RecordButton`.
- **`RecordButton.tsx`**: The large, primary action button for starting a recording. It now contains the "Press to Record" text and microphone icon.
- **`SpeakerButton.tsx`**: The button in the `Header` for toggling sound.
- **`ThemeGenerator.tsx`**: An AI-powered component that allows users to generate a custom theme by providing a text description.

## Page Components & Structure

Each page is a server component that composes the layout and content components.

- **Main Page (`/src/app/page.tsx`)**: The primary landing page.
  - **Layout**: `AppLayout` with `PrimaryHeader`.
  - **Content**: `GridContainer` which contains `Logo` and `AppName`.
  - **Footer**: `HomePageFooter`.

- **Record Page (`/src/app/record/page.tsx`)**: The page for initiating a recording.
  - **Layout**: `AppLayout` with `PrimaryHeader`.
  - **Content**: A `GridContainer` that holds the `RecordButton` inside a `RecordContainer` div.
  - **Footer**: `SecondaryPageFooter`.

- **Log Page (`/src/app/log/page.tsx`)**: Displays the photo album.
  - **Layout**: `AppLayout` with `SecondaryHeader`.
  - **Content**: `LogPage` component.
  - **Footer**: `SecondaryPageFooterV2`.

- **Settings Page (`/src/app/settings/page.tsx`)**: The page for application settings.
  - **Layout**: `AppLayout` with `PrimaryHeader`.
  - **Content**: `SettingsPage` component.
  - **Footer**: `SecondaryPageFooterV2`.

- **Theme Page (`/src/app/theme/page.tsx`)**: The page for customizing the application's theme.
  - **Layout**: `AppLayout` with `SecondaryHeader`.
  - **Content**: `ThemePage` component which uses the `ThemeGenerator`.
  - **Footer**: `SecondaryPageFooterV2`.

## Theme System & Color Model

The application's theme is controlled by CSS variables defined in `src/app/globals.css`. It supports a `light` mode, a `dark` mode, and a user-configurable `custom` mode.

The color system is based on the **HSL (Hue, Saturation, Lightness)** model. All color variables in `globals.css` (e.g., `--background`, `--primary`, `--foreground`) are defined using HSL values. This allows for programmatic and predictable manipulation of the theme's colors, as seen in the custom theme generator.
