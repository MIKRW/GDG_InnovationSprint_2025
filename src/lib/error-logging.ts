
'use server';

/**
 * @fileOverview A service for logging application errors to Firestore.
 * This service implements the data model defined in `docs/ERROR_LOG.md`.
 */

import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";

/**
 * Logs an error instance to the `error_instances` collection in Firestore.
 * 
 * @param error The error object that was thrown.
 * @param errorDefinitionId A slug that references the master document in the `error_definitions` collection.
 * @param context An object containing relevant contextual information about the event (e.g., user ID, page URL).
 */
export async function logErrorToFirestore(
  error: Error,
  errorDefinitionId: string,
  context: Record<string, any>
) {
  try {
    // In a real application with authentication, you would get the user ID.
    // For now, we'll use a placeholder.
    const userId = context.userId || 'anonymous_or_unauthenticated';

    const errorInstance = {
      errorDefinitionId,
      timestamp: new Date().toISOString(),
      context: {
        userId,
        pageUrl: context.pageUrl || (typeof window !== 'undefined' ? window.location.pathname : 'unknown'),
        ...context,
      },
      // Safely access stack trace and message
      message: error.message,
      stackTrace: error.stack || 'No stack trace available',
    };

    await addDoc(collection(db, 'error_instances'), errorInstance);

    console.log(`Successfully logged error '${errorDefinitionId}' to Firestore.`);

    // In a full implementation, you would also use a transaction
    // to increment the `occurrenceCount` on the corresponding `error_definitions` document.
    // This part is omitted for now to keep the setup simple.

  } catch (loggingError) {
    console.error('CRITICAL: Failed to log an error to Firestore.', loggingError);
    // This is a meta-error. At this point, you might want to log to the console
    // or a different, simpler logging service as a last resort.
  }
}
