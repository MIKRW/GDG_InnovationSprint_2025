# A Beginner's Guide to Saving Your Code with Git & GitHub

Welcome to version control! Think of it as a time machine for your code. It lets you save snapshots (called "commits") of your project, so you can track changes and go back to a previous version if something goes wrong.

This guide will walk you through setting up and using Git with GitHub to manage your Firebase Studio project.

## The Three Key Parts

Your version control setup will have three main components that work together:

1.  **Your Local Project (On Your Computer):** This is where your actual project files live. When we make changes in Firebase Studio, the files here are updated.
2.  **GitHub (The Website):** This is a website that hosts your code in an online storage space called a "repository." It's the central, secure backup for your project and allows you to view your code's history from anywhere.
3.  **A Git Client (The Tool):** This is the program on your computer that syncs your local project with your GitHub repository. We will use **GitHub Desktop**, a user-friendly app with a visual interface.

---

## Step 1: First-Time Setup

You only need to do this once.

1.  **Create a GitHub Account:** If you don't have one, sign up for a free account at [https://github.com/](https://github.com/).
2.  **Download GitHub Desktop:** This is a free application that makes using Git much easier than typing commands. Download and install it from [https://desktop.github.com/](https://desktop.github.com/).
3.  **Log In:** Open GitHub Desktop and log in using the GitHub account you just created.

---

## Step 2: Putting Your Project on GitHub for the First Time

This process will create your online repository and upload your current code.

1.  **Open GitHub Desktop:** Launch the application.
2.  **Add Your Existing Project:**
    *   In the main menu, go to `File > Add Local Repository...`.
    *   A dialog box will appear. Click the `Choose...` button and navigate to the root folder of this project on your computer.
    *   The app will recognize that the project isn't a Git repository yet. It will show a message like "This directory does not appear to be a Git repository. Would you like to create a repository here instead?". **Click the blue `create a repository` link.**
    *   A "Create a New Repository" window will appear. The name and local path should already be filled out. You can add a short description if you like. Make sure `.gitignore` is set to `Node`.
    *   Click the **`Create Repository`** button.

3.  **Make Your First "Commit" (Your first snapshot):**
    *   GitHub Desktop will now show all the files in your project. These are your "Uncommitted Changes."
    *   At the bottom-left, you'll see a "Summary" text box. Type a short, descriptive message for this first save, like `Initial project setup`.
    *   Click the blue **`Commit to main`** button. You have now saved your first snapshot on your local computer!

4.  **"Publish" Your Repository to GitHub:**
    *   After you commit, a new button will appear in the center of the screen that says **`Publish repository`**.
    *   Click this button. A window will appear. Make sure the name is correct. You can leave the "Keep this code private" box checked if you don't want it to be public.
    *   Click the final **`Publish Repository`** button.

**Congratulations!** Your project code is now safely backed up on GitHub.

---

## Step 3: Your Daily Workflow (Saving New Changes)

From now on, this is the simple process you'll follow whenever we make changes you want to save.

1.  **Make Changes in Firebase Studio:** We work together to edit code, add features, and fix bugs.
2.  **Check GitHub Desktop:** Open the GitHub Desktop app. You will see a list of all the files that have changed since your last commit.
3.  **Commit the Changes:**
    *   Just like before, write a clear summary message in the bottom-left box (e.g., `Added mystery recording feature` or `Fixed bug on log page`).
    *   Click the **`Commit to main`** button. This saves a new snapshot to your local machine.

4.  **"Push" the Changes to GitHub:**
    *   After committing, a button at the top of the app will say **`Push origin`**.
    *   Click this button. This uploads your newly saved snapshot to your online repository on GitHub.com.

That's it! Your changes are now backed up.

## Key Terms Explained

*   **Repository (or "Repo"):** A folder that contains your project and its entire history of changes. You have a "local repository" on your computer and a "remote repository" online (on GitHub).
*   **Commit:** A saved snapshot of your project at a specific point in time. Each commit has a unique ID and a message describing what was changed.
*   **Push:** The action of uploading your saved local commits from your computer to the remote repository on GitHub.
*   **Pull:** The action of downloading changes from the remote repository to your local computer. This is useful if you work on the project from multiple computers.
*   **Branch:** A separate line of development. The default branch is called `main`. Advanced users create new branches to work on features without affecting the main codebase. For now, you can safely work on `main`.
