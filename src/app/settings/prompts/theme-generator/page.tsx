
'use client';

import { PromptEditor } from '@/components/pages/PromptEditor';

const PROMPT_PATH = 'prompts/theme-generation-prompt.txt';
const PROMPT_TITLE = 'AI Theme Generation Prompt';
const PROMPT_DESCRIPTION = "This prompt guides the AI in creating color palettes from user-provided words and moods. It includes instructions on color theory, word association, and accessibility. Edit the text below and save your changes.";

export default function ThemeGeneratorPromptsPage() {
     return (
        <div className="container mx-auto px-4 py-8">
            <PromptEditor
              promptPath={PROMPT_PATH}
              title={PROMPT_TITLE}
              description={PROMPT_DESCRIPTION}
            />
        </div>
    )
}
