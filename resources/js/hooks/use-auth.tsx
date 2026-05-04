import { type SharedData } from '@/types';
import { getApiAccessToken, setApiAccessToken as setToken, subscribeApiAccessToken } from '@/lib/api-token-store';
import { usePage } from '@inertiajs/react';
import { useSyncExternalStore } from 'react';

export { setApiAccessToken } from '@/lib/api-token-store';

/**
 * Global auth state from Inertia (`auth.user`) plus optional API bearer token stored in memory for `/api/*` calls.
 */
export function useAuth() {
    const page = usePage<SharedData>();
    const apiAccessToken = useSyncExternalStore(subscribeApiAccessToken, getApiAccessToken, getApiAccessToken);

    const user = page.props.auth.user;
    const roles = user?.roles ?? [];

    return {
        user,
        roles,
        apiAccessToken,
        setApiAccessToken: setToken,
        isAuthenticated: user !== null,
    };
}
