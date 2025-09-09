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
  isActive: boolean;
}

const FooterButton: React.FC<FooterButtonProps> = ({ href, icon: Icon, label, isActive }) => {
  const pathname = usePathname();
  
  // Conditionally apply a different style for the main record button
  const isRecordButton = href === '/record';
  
  return (
    <Link href={href} passHref className="flex-1 flex justify-center items-center">
       <Button 
         variant={isActive ? "secondary" : "ghost"}
         className={cn(
           "w-16 h-16 rounded-full", 
           { "bg-primary text-primary-foreground hover:bg-primary/90": isRecordButton && pathname !== '/record' }
         )}
         aria-label={label}
       >
        <Icon className={cn(isRecordButton ? "w-8 h-8" : "w-7 h-7")} />
      </Button>
    </Link>
  );
};

export default function Footer() {
  const pathname = usePathname();

  const navButtons: Omit<FooterButtonProps, 'isActive'>[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/record', icon: Microphone, label: 'Start Identifying' },
    { href: '/log', icon: List, label: 'View Log' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];
  
  // Filter out the record button on the record page, and the home button on the home page
  const filteredNavButtons = navButtons.filter(button => 
    (button.href !== '/record' || pathname !== '/record') &&
    (button.href !== '/' || pathname !== '/')
  );

  return (
    <footer className="flex justify-around items-center p-2 border-t">
      {filteredNavButtons.map((button) => (
        <FooterButton key={button.href} {...button} isActive={pathname === button.href} />
      ))}
    </footer>
  );
}
