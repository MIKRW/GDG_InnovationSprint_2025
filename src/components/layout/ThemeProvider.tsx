
'use client';

import { type ReactNode } from 'react';

// This component's responsibility is now primarily to provide a context
// for theme changes if needed in the future, and to wrap the children.
// The initial theme loading is handled by a script in RootLayout to prevent FOUC.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
