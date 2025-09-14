
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, type User, getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { logErrorToFirestore } from '@/lib/error-logging';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app); // Get auth instance here
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // No user is signed in, sign in anonymously
        signInAnonymously(auth)
          .then((userCredential) => {
            setUser(userCredential.user);
          })
          .catch((error) => {
            console.error('Anonymous sign-in failed:', error);
            logErrorToFirestore(error, 'firebase-auth-signin-failure', {
                type: 'anonymous'
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }, (error) => {
        console.error('Auth state change error:', error);
        logErrorToFirestore(error, 'firebase-auth-state-change-failure', {});
        setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
