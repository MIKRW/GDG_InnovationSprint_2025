
'use client';

import { createContext, useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { ReactNode } from 'react';

// Define the shape of the authentication context
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  ensureUser: () => Promise<User | null>; // The function to trigger sign-in
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  ensureUser: () => Promise.resolve(null),
});

// Create a provider component
export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // This effect hook ONLY listens for auth state changes.
  // It no longer tries to sign the user in.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // This is the function that components will call to trigger sign-in.
  const ensureUser = useCallback(async () => {
    if (user) return user; // Already signed in

    // This is where the error was happening.
    // By calling it on-demand, we ensure Firebase is ready.
    try {
      setLoading(true);
      const userCredential = await signInAnonymously(auth);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
      // We can log this to our new error logging system in the future.
      return null;
    } finally {
        setLoading(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, ensureUser }}>
      {children}
    </AuthContext.Provider>
  );
}
