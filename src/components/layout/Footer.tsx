import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Home, List, Mic, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FooterButtonProps {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
}

const FooterButton: React.FC<FooterButtonProps> = ({ href, icon: Icon, label, className }) => (
  <Link href={href} passHref className="flex-1 flex justify-center items-center">
    <Button variant="nav" aria-label={label}>
      <Icon className={cn(className)} />
    </Button>
  </Link>
);

export default function Footer() {
  const navButtons: FooterButtonProps[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/record', icon: Mic, label: 'Start Identifying' },
    { href: '/log', icon: List, label: 'View Log' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <footer className="row-start-3 col-span-3 grid grid-cols-4 items-stretch p-4 gap-4">
      {navButtons.map((button) => (
        <FooterButton key={button.href} {...button} />
      ))}
    </footer>
  );
}
