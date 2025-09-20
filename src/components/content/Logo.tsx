import { ColorableLogo } from './ColorableLogo';

export function Logo() {
  return (
    <div data-component="Logo" className="relative flex justify-center items-center w-full h-full">
      <ColorableLogo style={{ color: 'var(--logo-color)' }} />
    </div>
  );
}
