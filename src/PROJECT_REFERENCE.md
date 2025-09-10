# Project Reference

This document outlines the core layout structure, components, and theme of the application.

## Layout System

The application uses a consistent layout system defined in `src/components/layout/`.

### Core Layout Components

- **`AppLayout.tsx`**: The main wrapper applied to each page. It provides the consistent `Header` and a flexible container that holds the main content and the page-specific footer.

- **`Header.tsx`**: The top bar of the application. It contains the contrast and speaker control buttons.

- **`GridContainer.tsx`**: A component that creates a 3x3 grid layout, used on the home page to center the logo and byline.

- **`HomePageFooter.tsx`**: The navigation footer used exclusively on the home page. It provides navigation to the `record`, `log`, and `settings` pages.

- **`SecondaryPageFooter.tsx`**: The navigation footer used on all pages except the home page. It provides navigation to `home`, `log`, and `settings`.

## Content Components

These are the reusable UI elements that make up the application's content.

- **`Byline.tsx`**: A styled text component for displaying a tagline or subtitle, used on the home page.
- **`ContrastButton.tsx`**: The button in the `Header` for toggling UI contrast.
- **`Logo.tsx`**: Renders the circular application logo.
- **`MicrophoneIcon.tsx`**: The microphone icon used inside the `RecordButton`.
- **`RecordButton.tsx`**: The large, primary action button for starting a recording. It now contains the "Ready to Record" text and microphone icon.
- **`SpeakerButton.tsx`**: The button in the `Header` for toggling sound.

## Page Components & Structure

Each page is a server component that composes the layout and content components.

- **Main Page (`/src/app/page.tsx`)**: The primary landing page.
  - **Layout**: `AppLayout`
  - **Content**: `GridContainer` which contains `Logo` and `Byline`.
  - **Footer**: `HomePageFooter`

- **Record Page (`/src/app/record/page.tsx`)**: The page for initiating a recording.
  - **Layout**: `AppLayout`
  - **Content**: A `RecordContainer` element that holds the `RecordButton` component.
  - **Footer**: `SecondaryPageFooter`

- **Log Page (`/src/app/log/page.tsx`)**: Displays the photo album.
  - **Layout**: `AppLayout`
  - **Content**: `LogPage` component.
  - **Footer**: `SecondaryPageFooter`

- **Settings Page (`/src/app/settings/page.tsx`)**: The page for application settings.
  - **Layout**: `AppLayout`
  - **Content**: `SettingsPage` component.
  - **Footer**: `SecondaryPageFooter`
