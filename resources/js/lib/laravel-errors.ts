/**
 * Extrae un mensaje legible del JSON típico de Laravel (422): `{ message?, errors?: Record<string, string[]> }`.
 */
export function firstLaravelValidationMessage(payload: unknown): string | null {
    if (typeof payload !== 'object' || payload === null) {
        return null;
    }

    const body = payload as Record<string, unknown>;

    if (typeof body.message === 'string' && body.message.trim() !== '') {
        return body.message;
    }

    const errors = body.errors;
    if (typeof errors !== 'object' || errors === null) {
        return null;
    }

    const preferredKeys = ['stripe', 'payment_setup_secret', 'order', 'order_number'];

    for (const key of preferredKeys) {
        const messages = (errors as Record<string, unknown>)[key];
        if (Array.isArray(messages) && messages.length > 0 && typeof messages[0] === 'string') {
            return messages[0];
        }
    }

    for (const key of Object.keys(errors)) {
        const messages = (errors as Record<string, unknown>)[key];
        if (Array.isArray(messages) && messages.length > 0 && typeof messages[0] === 'string') {
            return messages[0];
        }
    }

    return null;
}
