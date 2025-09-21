
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

const LOW_QUALITY_THRESHOLD = 40;

/**
 * A Cloud Function that triggers when a user's identification log is updated.
 * It specifically looks for the `isDisowned` flag changing to true to process
 * backend data cleanup and retention logic.
 */
export const onUserLogDisowned = functions.firestore
  .document("users/{userId}/identifications/{logId}")
  .onUpdate(async (change, context) => {
    // This functionality is deprecated as the app no longer supports user accounts or logs.
    // The function is kept to avoid deployment errors but does nothing.
    functions.logger.log("onUserLogDisowned function is deprecated and no longer has any effect.");
    return;
  });
