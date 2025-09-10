# Project Reference

This document outlines the core layout structure and theme of the application.

## Layout System

The application uses a consistent layout system defined in `src/components/layout/`.

### Core Components

- **`AppLayout.tsx`**: The main wrapper for all pages. It enforces a standard structure with a header and a footer. It is applied in the root layout (`src/app/layout.tsx`).

- **`Header.tsx`**: The top bar of the application.

- **`Footer.tsx`**: The bottom navigation bar, containing the primary navigation links.

### Page Structure

- **Main Page (`/src/app/page.tsx`)**: This is the primary landing page. It features a large, 3x3 `GridContainer` that fills the main content area. The center cell of the grid is enlarged to create a focal point for branding.

- **Secondary Pages (`/src/app/record/`, `/src/app/log/`, etc.)**: These pages share the same overall theme but will have their own distinct internal layouts for their specific content.
