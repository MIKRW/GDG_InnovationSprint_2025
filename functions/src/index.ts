
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
    const newData = change.after.data();
    const previousData = change.before.data();
    const {userId, logId} = context.params;

    // We only care about the change where isDisowned goes from false/undefined to true
    if (newData.isDisowned !== true || previousData.isDisowned === true) {
      functions.logger.log(`Log ${logId} was updated, but not disowned. No action taken.`);
      return;
    }

    functions.logger.log(`Processing disown for log: ${logId} by user: ${userId}`);

    // Exit if there's no analysis ID to process
    const {analysisRunId} = newData;
    if (!analysisRunId) {
      functions.logger.log(`Log ${logId} is a legacy entry or has no analysisRunId. No further action.`);
      return;
    }

    // Get the analysis document
    const analysisRunRef = db.collection("all_analysis_runs").doc(analysisRunId);
    const analysisRunSnap = await analysisRunRef.get();

    if (!analysisRunSnap.exists) {
      functions.logger.warn(`Analysis run document ${analysisRunId} not found. Cannot process further.`);
      return;
    }
    const analysisData = analysisRunSnap.data()!;

    // Check user's authentication status
    const userRecord = await admin.auth().getUser(userId);
    const isAnonymous = !userRecord.providerData.some((provider) => provider.providerId !== "anonymous");

    // Apply deletion logic
    if (isAnonymous && (analysisData.dataQualityScore < LOW_QUALITY_THRESHOLD)) {
      // HARD DELETE for low-quality anonymous data
      functions.logger.log(`Performing HARD DELETE for analysis ${analysisRunId}.`);
      
      if (analysisData.inputAudioStoragePath) {
        const bucket = storage.bucket();
        const file = bucket.file(analysisData.inputAudioStoragePath);
        try {
          await file.delete();
          functions.logger.log(`Deleted audio file: ${analysisData.inputAudioStoragePath}`);
        } catch (error) {
          if ((error as any).code === 404) {
            functions.logger.warn(`Audio file not found for deletion: ${analysisData.inputAudioStoragePath}`);
          } else {
            functions.logger.error("Failed to delete audio from storage:", error);
          }
        }
      }
      // Finally, delete the analysis record itself
      await analysisRunRef.delete();

    } else {
      // SOFT DELETE for registered users or high-quality anonymous data
      functions.logger.log(`Performing SOFT DELETE for analysis ${analysisRunId}.`);
      await analysisRunRef.update({wasSavedByUser: false});
    }

    // Also delete the user-facing log document permanently now.
    await change.after.ref.delete();
    functions.logger.log(`Permanently deleted user-facing log document ${logId}.`);
  });
