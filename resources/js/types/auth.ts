export type UserRole = 'admin' | 'vendedor' | 'cliente';

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

/** Mirrors authenticated `auth.user` plus API bearer token helpers. */
export interface AuthState {
    user: {
        id: number;
        name: string;
        email: string;
        email_verified_at: string | null;
        roles?: UserRole[];
    } | null;
    apiAccessToken: string | null;
    isAuthenticated: boolean;
}

export interface ApiAuthResponse {
    user: {
        id: number;
        name: string;
        email: string;
        email_verified_at: string | null;
        roles: string[];
    };
    access_token: string;
    token_type: string;
    expires_at: string | null;
}
