
import { ContrastButton } from '@/components/content/ContrastButton';
import { SpeakerButton } from '@/components/content/SpeakerButton';

export function PrimaryHeader() {
  return (
    <header className="border-b flex items-center justify-between px-4 py-8">
      <SpeakerButton />
      <div className="flex-1 text-center">
        <h1 className="text-4xl font-mono font-bold text-foreground">Name that Bird!</h1>
      </div>
      <ContrastButton />
    </header>
  );
}
