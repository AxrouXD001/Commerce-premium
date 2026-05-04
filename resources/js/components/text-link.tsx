import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ComponentProps } from 'react';

type LinkProps = ComponentProps<typeof Link>;

export default function TextLink({ className = '', children, ...props }: LinkProps) {
    return (
        <Link
            className={cn(
                'text-[#F5A623] underline decoration-[#F5A623]/40 underline-offset-4 transition-colors duration-300 ease-out hover:text-[#FFBE4D] hover:decoration-[#FFBE4D]/60',
                className,
            )}
            {...props}
        >
            {children}
        </Link>
    );
}
