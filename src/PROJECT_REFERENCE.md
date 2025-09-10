# Project Reference

This document outlines the core layout structure and theme of the application.

## Layout System

The application uses a consistent layout system defined in `src/components/layout/`.

### Core Components

- **`AppLayout.tsx`**: The main wrapper for all pages. It enforces the standard page structure, consisting of a header, a main content area, and a footer. It is applied in the root layout (`src/app/layout.tsx`).

- **`Header.tsx`**: The top navigation bar of the application. It displays the application title.

- **`Footer.tsx`**: The bottom navigation bar. It contains the primary navigation links for moving between the main sections of the app.

- **`GridContainer.tsx`**: A reusable 3x3 grid layout that fills the available space. It's used on the main page to structure its content.

### Page Structure

All pages will inherit the same header and footer from `AppLayout`. The unique content for each page is rendered within its own component, which is then displayed by a corresponding `page.tsx` file in the `src/app` directory.

- **Main Page (`/src/app/page.tsx`)**: This is the primary landing page. Its content is defined directly within this file.

- **Record Page (`/src/app/record/page.tsx`)**: This page contains the UI for the recording screen. Its layout is defined directly within the file.

- **Log Page (`/src/components/pages/LogPage.tsx`)**: This component contains the photo album grid for the log. It is rendered by `/src/app/log/page.tsx`.

- **Settings Page (`/src/components/pages/SettingsPage.tsx`)**: This component contains the content for the settings screen. It is rendered by `/src/app/settings/page.tsx`.

## Content Components

These are reusable components for displaying specific types of content.

- **`Logo.tsx`**: Renders the primary application logo, which is currently a `Bird` icon.

- **`Byline.tsx`**: A styled text component for subtitles or secondary information.

- **`branding-container`**: This is not a component, but a CSS class name (`branding-container`) applied to a `div` in `src/app/page.tsx`. It acts as a wrapper for the `Logo` and `Byline` to group them and control their layout as a single unit on the main page.
