
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebase-config';
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { credential } from 'firebase-admin';

// The robust singleton pattern for Firebase initialization in a Next.js environment.
// This ensures that Firebase is initialized only once.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const storage = getStorage(app);

// We export the app and the getAuth function itself, but not the auth instance.
// This allows us to create the auth instance only on the client-side when needed.
export { app, getAuth, db, storage };

// Initialize Firebase Admin SDK for server-side operations
if (!getAdminApps().length) {
    initializeAdminApp({
        credential: credential.applicationDefault(),
        storageBucket: firebaseConfig.storageBucket,
    });
}
export const adminApp = getAdminApp();
export const adminAuth = getAdminAuth(adminApp);
