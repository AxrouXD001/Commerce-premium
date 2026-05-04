/**
 * Extrae un mensaje legible del JSON típico de Laravel (422): `{ message?, errors?: Record<string, string[]> }`.
 * Prioriza `errors.*` sobre `message`, porque Laravel suele enviar el texto genérico "The given data was invalid."
 * y el detalle útil está en `errors`.
 */
export function firstLaravelValidationMessage(payload: unknown): string | null {
    if (typeof payload !== 'object' || payload === null) {
        return null;
    }

    const body = payload as Record<string, unknown>;

    const errors = body.errors;
    if (typeof errors === 'object' && errors !== null) {
        const preferredKeys = [
            'stripe',
            'payment_setup_secret',
            'product_variant_id',
            'product_id',
            'quantity',
            'order',
            'order_number',
        ];

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
    }

    if (typeof body.message === 'string' && body.message.trim() !== '') {
        const trimmed = body.message.trim();
        const genericValidationMessages = new Set([
            'The given data was invalid.',
            'Los datos proporcionados no son válidos.',
        ]);
        if (!genericValidationMessages.has(trimmed)) {
            return trimmed;
        }
    }

    return null;
}
