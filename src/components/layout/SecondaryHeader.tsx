import { ContrastButton } from '@/components/content/ContrastButton';
import { SpeakerButton } from '@/components/content/SpeakerButton';

export function SecondaryHeader() {
  return (
    <header className="border-b flex items-center justify-between px-4 py-2">
      <SpeakerButton />
      <ContrastButton />
    </header>
  );
}
