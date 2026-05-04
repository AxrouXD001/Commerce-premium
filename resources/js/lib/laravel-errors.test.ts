import { describe, expect, it } from 'vitest';

import { firstLaravelValidationMessage, summarizeAxiosError, summarizeLaravelJsonBody } from './laravel-errors';

describe('summarizeLaravelJsonBody', () => {
    it('prefers errors.* over the generic Laravel message', () => {
        expect(
            summarizeLaravelJsonBody({
                message: 'The given data was invalid.',
                errors: {
                    stripe: ['No pudimos iniciar el cobro con Stripe.'],
                },
            }),
        ).toBe('No pudimos iniciar el cobro con Stripe.');
    });

    it('accepts errors values as plain strings', () => {
        expect(
            summarizeLaravelJsonBody({
                message: 'The given data was invalid.',
                errors: {
                    stripe: 'Clave de Stripe inválida.',
                },
            }),
        ).toBe('Clave de Stripe inválida.');
    });

    it('parses JSON string bodies', () => {
        const raw = JSON.stringify({
            errors: { payment_setup_secret: ['Secreto incorrecto.'] },
        });

        expect(summarizeLaravelJsonBody(raw)).toBe('Secreto incorrecto.');
    });

    it('returns a non-generic message when present', () => {
        expect(summarizeLaravelJsonBody({ message: 'Sesión expirada.' })).toBe('Sesión expirada.');
    });
});

describe('firstLaravelValidationMessage', () => {
    it('delegates to summarizeLaravelJsonBody', () => {
        expect(firstLaravelValidationMessage({ message: 'X' })).toBe('X');
    });
});

describe('summarizeAxiosError', () => {
    it('extracts validation messages from axios-like errors', () => {
        const err = {
            isAxiosError: true as const,
            message: 'Request failed',
            response: {
                status: 422,
                statusText: 'Unprocessable Content',
                data: {
                    message: 'The given data was invalid.',
                    errors: { stripe: ['Configure STRIPE_SECRET.'] },
                },
            },
        };

        expect(summarizeAxiosError(err)).toBe('Configure STRIPE_SECRET.');
    });

    it('returns a 422 hint when the body is empty', () => {
        const err = {
            isAxiosError: true as const,
            response: {
                status: 422,
                data: '',
            },
        };

        expect(summarizeAxiosError(err)).toContain('422');
    });
});
