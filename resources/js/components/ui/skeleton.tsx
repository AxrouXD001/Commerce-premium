import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('animate-lux-shimmer rounded-[10px]', className)} {...props} />;
}

export { Skeleton };
