/** In-memory bearer token for Sanctum API requests (not persisted in localStorage). */

let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getApiAccessToken(): string | null {
    return accessToken;
}

export function setApiAccessToken(next: string | null): void {
    accessToken = next;
    listeners.forEach((listener) => listener());
}

export function subscribeApiAccessToken(onStoreChange: () => void): () => void {
    listeners.add(onStoreChange);
    return () => listeners.delete(onStoreChange);
}
