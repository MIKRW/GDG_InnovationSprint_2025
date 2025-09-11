
'use client';

import { useContext } from 'react';
import { AuthContext } from './FirebaseProvider';

// This is a simple alias for the existing context hook to make it more conventional.
export const useAuth = () => {
  return useContext(AuthContext);
};
