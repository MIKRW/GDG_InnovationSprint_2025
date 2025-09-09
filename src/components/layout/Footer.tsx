import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Home from '../chirp-id/icons/Home';
import List from '../chirp-id/icons/List';
import Microphone from '../chirp-id/Microphone';
import Settings from '../chirp-id/icons/Settings';

interface FooterButtonProps {
  href: string;
  icon: React.ElementType;
  label: string;
  className?: string;
}

const FooterButton: React.FC<FooterButtonProps> = ({ href, icon: Icon, label, className }) => (
  <Link href={href} passHref className="flex-1 flex justify-center items-center">
    <Button variant="nav" aria-label={label}>
      <Icon className={cn("w-6 h-6", className)} />
    </Button>
  </Link>
);

export default function Footer() {
  const pathname = usePathname();

  const allNavButtons: FooterButtonProps[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/record', icon: Microphone, label: 'Start Identifying', className: "w-8 h-8" },
    { href: '/log', icon: List, label: 'View Log' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Always filter out the button for the current page
  const navButtons = allNavButtons.filter(button => button.href !== pathname);

  // A grid with 3 columns is needed to position the buttons correctly
  const gridColsClass = 'grid-cols-3';

  return (
    <footer className={`row-start-3 col-span-3 grid ${gridColsClass} items-stretch p-4 gap-4`}>
      {navButtons.map((button) => (
        <FooterButton key={button.href} {...button} />
      ))}
    </footer>
  );
}
