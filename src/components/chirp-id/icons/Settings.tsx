import { cn } from '@/lib/utils';

export default function Settings({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn('w-6 h-6', className)}
    >
      <path
        fillRule="evenodd"
        d="M12.5 5.5a.5.5 0 0 0-1 0V7a.5.5 0 0 0 1 0V5.5ZM6.343 6.343a.5.5 0 0 0-.707-.707L4.929 6.343a.5.5 0 0 0 .707.707l.707-.707ZM17.657 6.343a.5.5 0 0 0 .707-.707l-.707-.707a.5.5 0 0 0-.707.707l.707.707ZM5.5 12.5a.5.5 0 0 0 0-1H7a.5.5 0 0 0 0 1H5.5ZM17 12.5a.5.5 0 0 0 0-1H18.5a.5.5 0 0 0 0 1H17ZM6.343 17.657a.5.5 0 0 0-.707.707l.707.707a.5.5 0 0 0 .707-.707l-.707-.707ZM12.5 17a.5.5 0 0 0-1 0v1.5a.5.5 0 0 0 1 0V17ZM17.657 17.657a.5.5 0 0 0 .707.707l-.707.707a.5.5 0 1 0-.707-.707l.707-.707Z"
        clipRule="evenodd"
      />
      <path
        d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5ZM10.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
      />
    </svg>
  );
}
