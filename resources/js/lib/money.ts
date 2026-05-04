export function formatMoney(amount: number, locale = 'es-PE', currency = 'PEN'): string {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
