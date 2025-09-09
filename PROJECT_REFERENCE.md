# Project Reference

This document outlines the core layout structure and theme of the application.

## Layout System

The application uses a consistent layout system defined in `src/components/layout/`.

### Core Components

- **`AppLayout.tsx`**: The main wrapper for all pages. It enforces the standard page structure, consisting of a header, a main content area, and a footer. It is applied in the root layout (`src/app/layout.tsx`).

- **`Header.tsx`**: The top navigation bar of the application. It displays the application title.

- **`Footer.tsx`**: The bottom navigation bar. It contains the primary navigation links for moving between the main sections of the app.

### Page Structure

All pages will inherit the same header and footer from `AppLayout`. The unique content for each page is rendered as the `children` within the `<main>` element of the `AppLayout`.

- **Main Page (`/src/app/page.tsx`)**: This is the primary landing page.
- **Secondary Pages (`/src/app/record/`, `/src/app/log/`, etc.)**: These pages share the same overall theme but will have their own distinct internal layouts for their specific content.
