import { Byline } from '@/components/content/Byline';
import { Logo } from '@/components/content/Logo';

export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <div className="branding-container m-auto flex flex-col items-center justify-center text-center">
        <Logo />
        <Byline>This is the main content area.</Byline>
      </div>
    </div>
  );
}
