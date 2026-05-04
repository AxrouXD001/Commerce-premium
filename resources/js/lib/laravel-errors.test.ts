import { describe, expect, it } from 'vitest';

import { firstLaravelValidationMessage } from './laravel-errors';

describe('firstLaravelValidationMessage', () => {
    it('prefers errors.* over the generic Laravel message', () => {
        const msg = firstLaravelValidationMessage({
            message: 'The given data was invalid.',
            errors: {
                stripe: ['No pudimos iniciar el cobro con Stripe.'],
            },
        });

        expect(msg).toBe('No pudimos iniciar el cobro con Stripe.');
    });

    it('returns a non-generic message when present', () => {
        expect(firstLaravelValidationMessage({ message: 'Sesión expirada.' })).toBe('Sesión expirada.');
    });
});
