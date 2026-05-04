import { useAuth } from '@/hooks/use-auth';
import { router } from '@inertiajs/react';
import { type ReactNode, useEffect } from 'react';

interface PrivateRouteProps {
    children: ReactNode;
}

/** Client-side guard; prefer Laravel `auth` middleware for real protection. */
export function PrivateRoute({ children }: PrivateRouteProps) {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            router.visit(route('login'));
        }
    }, [user]);

    if (!user) {
        return null;
    }

    return children;
}
