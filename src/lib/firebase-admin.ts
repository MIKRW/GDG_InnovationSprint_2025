
import { initializeApp as initializeAdminApp, getApps as getAdminApps, getApp as getAdminApp, App as AdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth, Auth as AdminAuth } from 'firebase-admin/auth';
import { getStorage as getAdminStorage, Storage as AdminStorage } from 'firebase-admin/storage';
import { credential } from 'firebase-admin';
import { firebaseConfig } from './firebase-config';

// This file initializes the Firebase Admin SDK for server-side operations.
// It should only ever be imported in server-side code ('use server').

let adminApp: AdminApp;
let adminAuth: AdminAuth;
let adminStorage: AdminStorage;

if (!getAdminApps().length) {
  adminApp = initializeAdminApp({
    credential: credential.applicationDefault(),
    storageBucket: firebaseConfig.storageBucket,
  });
} else {
  adminApp = getAdminApp();
}

adminAuth = getAdminAuth(adminApp);
adminStorage = getAdminStorage(adminApp);

export { adminApp, adminAuth, adminStorage };
