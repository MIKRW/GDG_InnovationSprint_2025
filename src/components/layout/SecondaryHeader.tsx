import { ContrastButton } from '@/components/content/ContrastButton';
import { SpeakerButton } from '@/components/content/SpeakerButton';

export function SecondaryHeader({ title }: { title: string }) {
  return (
    <header className="border-b flex items-center justify-between px-4 py-2">
      <SpeakerButton />
      <h1 className="text-lg font-bold">{title}</h1>
      <ContrastButton />
    </header>
  );
}
