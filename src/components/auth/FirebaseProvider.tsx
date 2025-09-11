
'use client';

import { createContext, useEffect, useState, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { app, getAuth } from '@/lib/firebase';
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
  // It handles re-hydrating the session if the user is already logged in.
  useEffect(() => {
    // getAuth() is called inside useEffect to ensure it's client-side only
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // This is the function that components will call to trigger sign-in on-demand.
  const ensureUser = useCallback(async () => {
    if (user) return user;

    // getAuth() is called here to ensure it's client-side only, on-demand
    const auth = getAuth(app);
    try {
      setLoading(true);
      const userCredential = await signInAnonymously(auth);
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error("Anonymous sign-in failed:", error);
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
