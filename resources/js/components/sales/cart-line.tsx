import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { CartItemDto } from '@/types/checkout';
import { Link } from '@inertiajs/react';
import type { JSX } from 'react';

export type CartLineProps = {
    item: CartItemDto;
    onChangeQty?: (qty: number) => void;
    onRemove?: () => void;
    variant?: 'default' | 'compact';
};

/**
 * Ítem editable del carrito (página completa).
 */
export function CartLineRow({ item, onChangeQty, onRemove }: CartLineProps): JSX.Element | null {
    if (!item.product) {
        return null;
    }

    return (
        <li className="flex flex-wrap items-start gap-4 rounded-2xl border border-[#2A2A3A] bg-[#111118]/90 p-4 transition hover:border-[#F5A623]/25">
            <Link href={route('catalog.show', item.product.slug)} className="relative block shrink-0">
                {item.product.image_url ? (
                    <img
                        src={item.product.image_url}
                        alt=""
                        className="size-20 rounded-xl border border-[#2A2A3A] object-cover"
                    />
                ) : (
                    <div className="bg-muted flex size-20 items-center justify-center rounded-xl border border-[#2A2A3A] text-[10px] text-muted-foreground">
                        Sin imagen
                    </div>
                )}
            </Link>
            <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium leading-tight text-[#F0F0F8]">{item.product.name}</p>
                {item.variant ? <p className="text-muted-foreground text-sm">{item.variant.name}</p> : null}
                <p className="text-muted-foreground text-xs">SKU: {item.variant?.sku ?? item.product.sku}</p>
                <p className="font-mono text-sm text-[#F5A623]">{formatMoney(item.unit_price ?? 0)} c/u</p>
            </div>
            <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        min={1}
                        max={999}
                        className="h-9 w-20 rounded-[10px] border-[#2A2A3A] bg-white/[0.03] font-mono text-sm"
                        value={item.quantity}
                        onChange={(e) => onChangeQty?.(Number.parseInt(e.target.value, 10) || 1)}
                    />
                    <Button size="sm" variant="outline" type="button" className="border-white/15" onClick={() => onRemove?.()}>
                        Quitar
                    </Button>
                </div>
                <p className={cn('font-mono text-sm font-bold text-[#F5A623]')}>{formatMoney(item.line_subtotal ?? 0)}</p>
            </div>
        </li>
    );
}
