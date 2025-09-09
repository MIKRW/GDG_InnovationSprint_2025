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
      <Icon className={cn("w-12 h-12", className)} />
    </Button>
  </Link>
);

export default function Footer() {
  const pathname = usePathname();

  const allNavButtons: FooterButtonProps[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/record', icon: Microphone, label: 'Start Identifying' },
    { href: '/log', icon: List, label: 'View Log' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Always filter out the button for the current page
  const navButtons = allNavButtons.filter(button => button.href !== pathname);
  
  const gridColsClass = `grid-cols-${navButtons.length}`;

  return (
    <footer className={cn("row-start-3 col-span-3 grid items-stretch p-4 gap-4", gridColsClass)}>
      {navButtons.map((button) => (
        <FooterButton key={button.href} {...button} />
      ))}
    </footer>
  );
}
