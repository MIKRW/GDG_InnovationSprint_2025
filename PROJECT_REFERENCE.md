# Project Reference

This document outlines the core layout structure and theme of the application.

## Layout System

The application uses a consistent layout system defined in `src/components/layout/`.

### Core Components

- **`AppLayout.tsx`**: The main wrapper applied to each page. It provides the consistent `Header` and a flexible container that holds the main content and the page-specific footer.

- **`Header.tsx`**: The top bar of the application. It contains the contrast and speaker control buttons.

- **`HomePageFooter.tsx`**: The navigation footer used exclusively on the home page. It provides navigation to the `record`, `log`, and `settings` pages.

- **`SecondaryPageFooter.tsx`**: The navigation footer used on all pages except the home page. It provides navigation to `home`, `log`, and `settings`.

### Page Structure

Each page (`/src/app/[page]/page.tsx`) is wrapped in the `AppLayout` component. This ensures a consistent header and overall structure.

The unique content for each page is rendered within a `<main>` element, and each page is responsible for supplying its own footer component (`HomePageFooter` or `SecondaryPageFooter`), allowing for context-specific navigation.

- **Main Page (`/src/app/page.tsx`)**: The primary landing page. It uses the `HomePageFooter`.
- **Secondary Pages (`/src/app/record/`, `/src/app/log/`, etc.)**: These pages use the `SecondaryPageFooter`.