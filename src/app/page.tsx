import { Byline } from '@/components/content/Byline';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold">Main Page</h1>
      <Byline>This is the main content area.</Byline>
    </div>
  );
}
