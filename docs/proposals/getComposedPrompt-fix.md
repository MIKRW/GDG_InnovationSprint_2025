# Proposal: Robust Fix for `getComposedPrompt`

This document contains the complete, proposed TypeScript code for the `getComposedPrompt` function. This code is intended to replace the existing function in `src/lib/actions.ts` after review and approval.

## Design Principles

This new version is architected based on our detailed discussion and implements the following key principles:

1.  **Live Mode Priority:** The primary `if` condition explicitly checks for Live Mode (`!isDevMode`), making the production path the main, most readable branch of the function.
2.  **Symmetrical Fallback Logic:**
    *   In **Live Mode**, it attempts to fetch the `activeAppAIVersion` first. If that fails, it safely falls back to the `developmentAppAIVersion`.
    *   In **Dev Mode** (the `else` block), it does the reverse, attempting `developmentAppAIVersion` first and falling back to `activeAppAIVersion`.
3.  **Centralized Logic:** The `if/else` block's only responsibility is to determine the correct `appAIVersionId`. The rest of the function (fetching the documents from Firestore and composing the prompt) is shared, reducing code duplication.
4.  **Final Error Handling:** The function will only throw an error if, after attempting both the primary and fallback versions, no valid configuration can be found.

This structure directly addresses the brittleness of the previous implementation and provides a robust, reliable, and maintainable solution.

---

## Proposed Code

```typescript
export const getComposedPrompt = cache(
    async (systemId: string): Promise<{ prompt: string; version: string } | null> => {
        const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
        console.log(`Composing prompt for AI Type '${systemId}' (Mode: ${isDevMode ? 'Development' : 'Live'}).`);

        try {
            let appAIConfig = await getAppAIConfig();
            if (!appAICofig) {
                console.log("App AI config not found. Triggering initial data creation.");
                await getAppAIVersions('all'); // This will atomically create the default config if needed.
                appAIConfig = await getAppAIConfig();
                if (!appAIConfig) {
                    throw new Error("Fatal: App AI Systems config not found even after atomic creation.");
                }
            }
            
            let appAIVersionId: string | undefined;

            // CORRECT, ROBUST LOGIC AS DISCUSSED:
            // This clear if/else block determines the version ID based on the environment, with fallbacks.
            if (!isDevMode) {
                // LIVE MODE: Prioritize the active/live version, but fall back to dev if not set.
                appAIVersionId = appAIConfig.activeAppAIVersion || appAIConfig.developmentAppAIVersion;
            } else {
                // DEV MODE: Prioritize the development version, but fall back to live if not set.
                appAIVersionId = appAIConfig.developmentAppAIVersion || appAIConfig.activeAppAIVersion;
            }
            
            if (!appAIVersionId) {
                throw new Error(`No active or development App AI Version is set in the config.`);
            }
            
            // The rest of the function proceeds with the determined ID.
            const appAIVersionRef = doc(db, 'app_ai_versions', appAIVersionId);
            const appAIVersionSnap = await getDoc(appAIVersionRef);
            if (!appAIVersionSnap.exists()) {
                throw new Error(`App AI Version document '${appAIVersionId}' not found.`);
            }
            const appAIVersion = appAIVersionSnap.data() as AppAIVersion;

            const promptSystemVersionId = appAIVersion.systems[systemId];
            if (!promptSystemVersionId) {
                throw new Error(`AI Type '${systemId}' is not defined in App AI Version '${appAIVersion.version}'.`);
            }
            
            const promptVersionRef = doc(db, 'prompt_versions', promptSystemVersionId);
            const promptVersionSnap = await getDoc(promptVersionRef);
            if (!promptVersionSnap.exists()) {
                throw new Error(`AI Type Version document '${promptSystemVersionId}' (for system '${systemId}') not found.`);
            }
            const promptVersionData = promptVersionSnap.data() as PromptVersion;

            const contentIds = Object.values(promptVersionData.composedPrompts);
            if (contentIds.length === 0) {
                 throw new Error(`AI Type Version '${promptSystemVersionId}' has no prompt content defined.`);
            }
            const contentPromises = contentIds.map(id => getDoc(doc(db, 'prompt_content', id)));
            const contentSnaps = await Promise.all(contentPromises);

            const composedText = contentSnaps.map(snap => {
                if (!snap.exists()) throw new Error(`Required prompt content document with ID '${snap.ref.id}' is missing.`);
                return (snap.data() as PromptContent).promptText;
            }).join('\n\n');
            
            return { prompt: composedText, version: appAIVersion.version };

        } catch (error) {
            console.error(`Failed to get composed prompt for '${systemId}':`, error);
            // In a production app, you might want to log this to a dedicated error service.
            // For now, returning null allows the calling flow to handle the failure gracefully.
            return null; 
        }
    },
    ['prompts-v7'], { revalidate: 30, tags: ['prompts-v7'] }
);
```
