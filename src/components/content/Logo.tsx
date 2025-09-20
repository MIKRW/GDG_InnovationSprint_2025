import Image from 'next/image';

export function Logo() {
  return (
    <div data-component="Logo" className="relative flex justify-center items-center w-full h-full">
      <Image
        src="/logo-V2.png"
        alt="Lyre app logo - a lyrebird singing into a vintage microphone"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
