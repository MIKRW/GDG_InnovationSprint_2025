
import { ContrastButton } from '@/components/content/ContrastButton';
import { SpeakerButton } from '@/components/content/SpeakerButton';

export function PrimaryHeader() {
  return (
    <header className="border-b flex items-center justify-between px-4 py-2">
      <SpeakerButton />
      <div className="flex-1 text-center">
        
      </div>
      <ContrastButton />
    </header>
  );
}
