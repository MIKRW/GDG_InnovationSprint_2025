# AI Strategy & Design Decisions Summary

This document summarizes the key questions and strategic decisions made during the design of this application's AI functionality. It serves as a reference for *why* the system is built the way it is.

---

### Q1: Is it better to have the AI analyze raw audio, or convert it to a spectrogram image first?

-   **Answer:** We don't know for sure without objective data. While spectrogram analysis is a classic technique, direct audio analysis with a modern multimodal model like Gemini could be more accurate as it avoids a "lossy" conversion step (audio -> image).
-   **Decision:** We cannot trust either method blindly. We will build a **Developer Testing Framework** to get a concrete accuracy score for our chosen method. This involves creating a "ground truth" of master audio files and logging test results to a dedicated `all_test_runs` collection in Firestore. This is the only way to scientifically measure and improve our AI's performance.

---

### Q2: Is Gemini 2.5 Flash the best model? Does it need us to provide it with comparison audio?

-   **Answer:** For our app, **Gemini 2.5 Flash is the optimal choice.**
    1.  **Speed is a Feature:** It's designed for speed, which is critical for a good user experience. A user wants an answer in seconds.
    2.  **The AI's Knowledge is Internal:** The model doesn't need us to provide it with a library of bird sounds. It has already "learned" the patterns from a vast, internal training dataset.
    3.  **Our Role is to Guide:** Our job is not to give the AI data, but to give it **rich context** (like location and time) to help it filter possibilities and apply its internal knowledge correctly.
-   **Decision:** We will use Gemini 2.5 Flash for complex reasoning. Our prompts will be **contextual**, not just instructional, to guide the AI's thought process.

---

### Q3: How do we know the AI *actually* has the knowledge for a niche task like bird identification?

-   **Answer:** We can't look inside the AI's "brain," and its training data is not public. Therefore, we cannot and should not blindly trust its capabilities.
-   **Decision:** This reinforces the absolute need for the **Developer Testing Framework.** It is the *only* way to verify the AI's accuracy for our specific task. By measuring its performance against our ground truth, we move from assumption to proof.

---

### Q4: Should prompts for all AI models be contextual, or are some more instructional?

-   **Answer:** The prompt style depends entirely on the model and the task.
    1.  **Instructional Prompts** are for single-purpose models. For **Imagen** (`instructional-generate-bird-image-flow`), we give a simple, direct command (e.g., "photo of a robin").
    2.  **Contextual Prompts** are for multi-purpose reasoning models. For **Gemini** (`contextual-identify-bird-flow`), we give it a persona, context, and rules to guide its complex analytical process.
-   **Decision:** We have adopted a clear naming convention for our AI flows (`contextual-` vs. `instructional-`) to make this distinction clear to developers.

---

### Q5: Could we pre-filter a list of likely birds with one AI call to make the main AI's job easier?

-   **Answer:** This is a valid advanced technique called "chaining." However, it adds complexity, cost, and latency. A powerful model like Gemini 2.5 Flash is designed to do this filtering internally when given the right context.
-   **Decision:** We will start with a simpler, single-call approach. We will keep the "chaining" strategy as a potential future enhancement if our testing framework reveals that the AI is struggling with accuracy.

---

### Q6: How does the AI get better over the long term if it doesn't learn from our app?

-   **Answer:** There are two primary paths for long-term improvement:
    1.  **Base Model Updates (By Google):** Google periodically releases newer, better versions of its models. We can upgrade and use our testing framework to verify the improvement.
    2.  **Fine-Tuning (By Us, in the future):** We can use the high-quality, user-verified data we collect in `all_analysis_runs` to perform additional training on a base model, creating a custom "specialist" version that is an expert at our specific task.
-   **Decision:** The data we are collecting is a strategic asset for potential future fine-tuning efforts, similar to how the Merlin app uses the Macaulay Library.
