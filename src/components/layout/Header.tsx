import { ContrastButton } from '@/components/content/ContrastButton';
import { SpeakerButton } from '@/components/content/SpeakerButton';

export function Header() {
  return (
    <header className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SpeakerButton />
        <h1 className="text-xl font-bold">My App</h1>
      </div>
      <ContrastButton />
    </header>
  );
}
