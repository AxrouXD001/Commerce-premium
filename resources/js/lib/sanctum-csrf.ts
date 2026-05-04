import axios from 'axios';

let inflight: Promise<void> | null = null;

/**
 * SPA stateful api: garantiza cookie XSRF antes de métodos POST/PUT/DELETE hacia rutas `/api`.
 */
export function ensureSanctumCsrfCookie(): Promise<void> {
    if (inflight) {
        return inflight;
    }

    inflight = axios
        .get(`${window.location.origin}/sanctum/csrf-cookie`, {
            withCredentials: true,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
        .then(() => undefined)
        .finally(() => {
            inflight = null;
        });

    return inflight;
}
