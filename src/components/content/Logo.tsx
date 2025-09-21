import { ColorableLogo } from './ColorableLogo';

export function Logo() {
  return (
    <div data-component="Logo" className="relative flex justify-center items-center w-full h-full">
      <ColorableLogo className="text-foreground/50" />
    </div>
  );
}
