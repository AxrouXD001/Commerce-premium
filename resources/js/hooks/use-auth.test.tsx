import { render, screen } from '@testing-library/react';
import { usePage } from '@inertiajs/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setApiAccessToken, useAuth } from './use-auth';

vi.mock('@inertiajs/react', () => ({
    usePage: vi.fn(),
}));

function AuthProbe() {
    const { user, apiAccessToken, roles } = useAuth();

    return (
        <div>
            <span data-testid="has-user">{user ? 'yes' : 'no'}</span>
            <span data-testid="roles">{roles.join(',')}</span>
            <span data-testid="token">{apiAccessToken ?? 'none'}</span>
        </div>
    );
}

describe('useAuth', () => {
    beforeEach(() => {
        setApiAccessToken(null);

        vi.mocked(usePage).mockReturnValue({
            props: {
                name: '',
                quote: { message: '', author: '' },
                auth: {
                    user: {
                        id: 1,
                        name: 'Test',
                        email: 'test@example.com',
                        email_verified_at: null,
                        created_at: '',
                        updated_at: '',
                        roles: ['cliente'],
                    },
                },
            },
            // minimal Inertia page stub
        } as ReturnType<typeof usePage>);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('reflects Inertia user roles and updates when the API token changes', () => {
        render(<AuthProbe />);

        expect(screen.getByTestId('has-user').textContent).toBe('yes');
        expect(screen.getByTestId('roles').textContent).toBe('cliente');
        expect(screen.getByTestId('token').textContent).toBe('none');

        act(() => {
            setApiAccessToken('sanctum-plaintext');
        });

        expect(screen.getByTestId('token').textContent).toBe('sanctum-plaintext');
    });
});
