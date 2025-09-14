
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebase-config';

// The robust singleton pattern for Firebase initialization in a Next.js environment.
// This ensures that Firebase is initialized only once.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);


// We export the app and the getAuth function itself, but not the auth instance.
// This allows us to create the auth instance only on the client-side when needed.
export { app, auth, db, storage };
