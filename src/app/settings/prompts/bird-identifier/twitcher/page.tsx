
'use client';

import { PromptEditor } from '@/components/pages/PromptEditor';

const PROMPT_PATH = 'prompts/bird-identification-twitcher-prompt.txt';
const PROMPT_TITLE = 'Twitcher Mode Identification Prompt';
const PROMPT_DESCRIPTION = "This is the advanced prompt for Twitcher Mode. It assumes higher quality audio and instructs the AI to perform a more detailed analysis, considering factors like weather and season. Edit the text below and save your changes.";


export default function TwitcherPromptPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <PromptEditor
              promptPath={PROMPT_PATH}
              title={PROMPT_TITLE}
              description={PROMPT_DESCRIPTION}
            />
        </div>
    );
}
