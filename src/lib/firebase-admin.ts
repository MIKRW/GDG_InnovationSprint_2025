import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';

let adminApp: App;

// This is a singleton pattern for the Firebase Admin SDK in a Next.js server environment.
// It ensures that we initialize the app only once.
if (!getApps().length) {
    adminApp = initializeApp();
} else {
    adminApp = getApp();
}

export { adminApp };
