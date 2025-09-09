import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();

  const allNavButtons: FooterButtonProps[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/record', icon: Mic, label: 'Start Identifying' },
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
