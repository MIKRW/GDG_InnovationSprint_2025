import { ContrastButton } from '@/components/content/ContrastButton';
import { SpeakerButton } from '@/components/content/SpeakerButton';

export function Header() {
  return (
    <header className="p-4 border-b flex items-center justify-between">
      <SpeakerButton />
      <ContrastButton />
    </header>
  );
}
