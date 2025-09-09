import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { List, Mic, Settings } from 'lucide-react';
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
    <Button aria-label={label}>
      <Icon className={cn("h-1/2 w-1/2", className)} />
    </Button>
  </Link>
);

export default function Footer() {
  const navButtons: FooterButtonProps[] = [
    { href: '/record', icon: Mic, label: 'Start Identifying' },
    { href: '/log', icon: List, label: 'View Log' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <footer className="flex justify-center items-center w-full h-full">
      <nav className="flex justify-evenly items-stretch w-full h-full gap-4">
        {navButtons.map((button) => (
          <FooterButton key={button.href} {...button} />
        ))}
      </nav>
    </footer>
  );
}
