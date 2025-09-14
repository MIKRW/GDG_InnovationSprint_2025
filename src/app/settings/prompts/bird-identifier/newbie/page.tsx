
'use client';

import { PromptEditor } from '@/components/pages/PromptEditor';

const PROMPT_PATH = 'prompts/bird-identification-prompt.txt';
const PROMPT_TITLE = 'Newbie Mode Identification Prompt';
const PROMPT_DESCRIPTION = "This is the core prompt for identifying birds in Newbie Mode. It's designed to be general and robust for a wide range of audio quality. Edit the text below and save your changes.";


export default function NewbiePromptPage() {
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
