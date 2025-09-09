import Smartphone from '@/components/chirp-id/icons/Smartphone';

export default function ResizePrompt() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-foreground p-4">
      <div className="text-center">
        <Smartphone className="mx-auto h-16 w-16 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Please resize your window</h1>
        <p className="max-w-md">
          This application is designed for a larger screen. Please increase the size of your browser window to continue.
        </p>
      </div>
    </div>
  );
}
