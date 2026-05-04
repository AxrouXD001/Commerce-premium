import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { CartTotalsMeta } from '@/types/checkout';
import type { CartItemDto } from '@/types/checkout';

type OrderSummaryProps = {
    items: Pick<CartItemDto, 'quantity' | 'line_subtotal' | 'product' | 'variant'>[];
    meta: CartTotalsMeta | null | undefined;
    caption?: string;
};

export function OrderSummary({ items, meta, caption }: OrderSummaryProps) {
    const subtotal = meta ? Number.parseFloat(meta.subtotal) || 0 : items.reduce((a, li) => a + (Number.isFinite(li.line_subtotal) ? li.line_subtotal : 0), 0);

    const discount = meta ? Number.parseFloat(meta.discount_total) || 0 : 0;

    const tax = meta ? Number.parseFloat(meta.tax_total) || 0 : 0;

    const total = meta ? Number.parseFloat(meta.grand_total) || 0 : subtotal;

    const taxRateLabel =
        meta && meta.tax_rate !== undefined ? ` — IGV (${(meta.tax_rate * 100).toFixed(2).replace(/\.?0+$/, '')}%)` : '';

    return (
        <aside className="text-card-foreground rounded-2xl border border-[#2A2A3A] bg-[#111118]/95 p-6 shadow-none backdrop-blur-sm">
            <h2 className="font-serif mb-4 text-lg font-semibold tracking-tight text-[#F0F0F8]">{caption ?? 'Resumen'}</h2>
            {caption ? null : (
                <ul className="text-muted-foreground mb-4 max-h-48 divide-y divide-white/5 overflow-y-auto text-xs">
                    {items.map((row) => {
                        const variant = row.variant ? ` · ${row.variant.name}` : '';

                        return (
                            <li key={`${row.product?.id}-${row.variant?.id}-${variant}`} className="flex justify-between gap-3 py-2.5">
                                <span className="min-w-0 pr-2">
                                    {(row.product?.name ?? 'Producto') + variant} × {row.quantity}
                                </span>
                                <span className="font-mono shrink-0 font-semibold text-[#F5A623]">{formatMoney(row.line_subtotal ?? 0)}</span>
                            </li>
                        );
                    })}
                </ul>
            )}
            <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="font-mono font-semibold text-[#F5A623]">{formatMoney(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Descuentos</dt>
                    <dd className={cn('font-mono font-semibold', discount > 0 ? 'text-emerald-400' : 'text-muted-foreground')}>
                        −{formatMoney(Math.abs(discount))}
                    </dd>
                </div>
                <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">{`Impuestos${taxRateLabel}`}</dt>
                    <dd className="font-mono font-semibold text-[#F5A623]">{formatMoney(tax)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-white/10 pt-4">
                    <dt className="font-serif text-lg text-[#F0F0F8]">Total</dt>
                    <dd className="font-serif text-2xl font-semibold tracking-tight text-[#F0F0F8]">{formatMoney(total)}</dd>
                </div>
            </dl>
        </aside>
    );
}
