import { isAxiosError } from 'axios';

const GENERIC_VALIDATION_MESSAGES = new Set([
    'The given data was invalid.',
    'Los datos proporcionados no son válidos.',
]);

function isGenericLaravelValidationMessage(text: string): boolean {
    return GENERIC_VALIDATION_MESSAGES.has(text.trim());
}

/** Una entrada de `errors` puede ser string[] (Laravel), string (APIs variadas) o string único. */
function firstMessageFromErrorEntry(value: unknown): string | null {
    if (typeof value === 'string' && value.trim() !== '') {
        return value.trim();
    }
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
        return value[0];
    }

    return null;
}

const PREFERRED_ERROR_KEYS = [
    'stripe',
    'payment_setup_secret',
    'product_variant_id',
    'product_id',
    'quantity',
    'order',
    'order_number',
];

/**
 * Recorre `errors` y devuelve el primer mensaje útil.
 */
function flattenFirstBag(errors: Record<string, unknown>): string | null {
    for (const key of PREFERRED_ERROR_KEYS) {
        const msg = firstMessageFromErrorEntry(errors[key]);
        if (msg !== null) {
            return msg;
        }
    }
    for (const key of Object.keys(errors)) {
        const msg = firstMessageFromErrorEntry(errors[key]);
        if (msg !== null) {
            return msg;
        }
    }

    return null;
}

/**
 * Interpreta cuerpos JSON de Laravel u otros `{ message, errors }`, y también `data` como string (HTML/texto).
 */
export function summarizeLaravelJsonBody(payload: unknown): string | null {
    if (payload === null || payload === undefined) {
        return null;
    }

    if (typeof payload === 'string') {
        const trimmed = payload.trim();
        if (trimmed.startsWith('{')) {
            try {
                const parsed: unknown = JSON.parse(trimmed);

                return summarizeLaravelJsonBody(parsed);
            } catch {
                return trimmed.slice(0, 400) || null;
            }
        }

        return trimmed.slice(0, 400) || null;
    }

    if (typeof payload !== 'object') {
        return null;
    }

    const body = payload as Record<string, unknown>;

    if (typeof body.errors === 'object' && body.errors !== null && !Array.isArray(body.errors)) {
        const fromBag = flattenFirstBag(body.errors as Record<string, unknown>);
        if (fromBag !== null) {
            return fromBag;
        }
    }

    if (typeof body.message === 'string' && body.message.trim() !== '') {
        const trimmed = body.message.trim();
        if (!isGenericLaravelValidationMessage(trimmed)) {
            return trimmed;
        }
    }

    return null;
}

/** Compatibilidad con llamadas existentes; mismo comportamiento que `summarizeLaravelJsonBody`. */
export function firstLaravelValidationMessage(payload: unknown): string | null {
    return summarizeLaravelJsonBody(payload);
}

function httpStatusHint(status: number): string | null {
    if (status === 419) {
        return 'La sesión de seguridad expiró o falta el token CSRF. Recarga la página, vuelve a checkout y confirma el pedido otra vez antes de pagar.';
    }
    if (status === 401 || status === 403) {
        return 'No autorizado para iniciar el pago. Inicia sesión si la tienda lo requiere.';
    }
    if (status === 404) {
        return 'No encontramos ese pedido en el servidor.';
    }
    if (status === 429) {
        return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    }
    if (status >= 500) {
        return 'Error en el servidor al contactar el cobro. Revisa los logs o STRIPE_SECRET / configuración.';
    }

    return null;
}

/**
 * Mensaje para mostrar al usuario a partir de un fallo de Axios (API Laravel, red, etc.).
 */
export function summarizeAxiosError(err: unknown): string | null {
    if (!isAxiosError(err)) {
        return null;
    }

    const fromBody = summarizeLaravelJsonBody(err.response?.data);
    if (fromBody !== null) {
        return fromBody;
    }

    const status = err.response?.status;
    if (status !== undefined) {
        const hint = httpStatusHint(status);
        if (hint !== null) {
            return hint;
        }

        if (status === 422) {
            return 'La solicitud fue rechazada (422). Suele indicar clave temporal de cobro incorrecta o caducada, pedido que ya no está pendiente, o problema con Stripe en el servidor (STRIPE_SECRET / STRIPE_KEY). Vuelve a checkout y confirma el pedido otra vez.';
        }

        return `El servidor respondió con error HTTP ${status}${err.response?.statusText ? ` (${err.response.statusText})` : ''}.`;
    }

    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        return 'No hay conexión con el servidor o la petición fue bloqueada (red).';
    }

    return null;
}
