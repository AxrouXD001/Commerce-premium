import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/use-cart';
import { useCartStore } from '@/stores/use-cart-store';
import { Link } from '@inertiajs/react';
import { ShoppingBag } from 'lucide-react';

export function CartDrawer() {
    const { drawerOpen, closeDrawer, openDrawer } = useCartStore();
    const { cart, isFetching, mutationPending, updateQuantity, removeItem } = useCart();

    const itemCount = cart?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0;

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                    'relative gap-2 border-[#F5A623]/30 bg-[#F5A623]/10 font-medium text-[#F5A623] shadow-none',
                    'hover:border-[#F5A623]/50 hover:bg-[#F5A623]/15 hover:text-[#FFBE4D] hover:shadow-[0_0_16px_rgba(245,166,35,0.25)]',
                    'active:scale-95',
                )}
                onClick={() => openDrawer()}
            >
                <ShoppingBag className="size-4" />
                Carrito
                {itemCount > 0 ? (
                    <span
                        className={cn(
                            'absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full',
                            'bg-[#F5A623] text-[10px] font-bold text-black',
                            'shadow-[0_0_12px_rgba(245,166,35,0.55)]',
                        )}
                    >
                        {itemCount > 99 ? '99+' : itemCount}
                    </span>
                ) : null}
            </Button>
            <Sheet open={drawerOpen} onOpenChange={(o) => (o ? openDrawer() : closeDrawer())}>
                <SheetContent
                    side="right"
                    className="flex w-full max-w-md flex-col border-[#2A2A3A] bg-[#111118] text-[#F0F0F8]"
                >
                    <SheetDescription className="sr-only">
                        Revisa las líneas de tu pedido, cantidades y total antes de ir al checkout.
                    </SheetDescription>
                    <SheetHeader className="border-b border-white/5 pb-4">
                        <SheetTitle className="font-serif text-xl text-[#F0F0F8]">Tu carrito</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
                        {isFetching ? <p className="text-muted-foreground text-sm">Cargando…</p> : null}
                        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
                            {cart?.items?.length ? (
                                cart.items.map((line) => (
                                    <li
                                        key={line.id}
                                        className="flex gap-3 rounded-2xl border border-[#2A2A3A] bg-[#0A0A0F]/80 p-3 transition hover:border-[#F5A623]/25"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium leading-tight text-[#F0F0F8]">{line.product?.name ?? 'Producto'}</p>
                                            {line.variant ? <p className="text-muted-foreground text-xs">{line.variant.name}</p> : null}
                                            <p className="mt-1 font-mono text-xs text-[#F5A623]">{formatMoney(line.unit_price ?? 0)} c/u</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <select
                                                className="h-9 rounded-[10px] border border-[#2A2A3A] bg-white/[0.04] px-2 text-xs text-[#F0F0F8] focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/10 focus:outline-none"
                                                value={line.quantity}
                                                disabled={mutationPending}
                                                onChange={(ev) =>
                                                    updateQuantity(line.id, Number.parseInt(ev.target.value, 10)).catch(() => undefined)
                                                }
                                            >
                                                {Array.from({ length: 99 }).map((_, idx) => {
                                                    const qty = idx + 1;

                                                    return (
                                                        <option key={qty} value={qty}>
                                                            ×{qty}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <p className="font-mono text-xs font-bold text-[#F5A623]">{formatMoney(line.line_subtotal ?? 0)}</p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                type="button"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => removeItem(line.id).catch(() => undefined)}
                                            >
                                                Quitar
                                            </Button>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="text-muted-foreground text-sm">{!isFetching ? 'Aún no agregaste productos.' : null}</li>
                            )}
                        </ul>
                        <div className="space-y-2 border-t border-white/5 pt-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-mono text-[#F5A623]">
                                    {cart?.meta?.subtotal ? formatMoney(Number.parseFloat(cart.meta.subtotal) || 0) : formatMoney(0)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Impuestos</span>
                                <span className="font-mono text-[#F5A623]">
                                    {cart?.meta?.tax_total ? formatMoney(Number.parseFloat(cart.meta.tax_total) || 0) : formatMoney(0)}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-white/5 pt-2 font-semibold">
                                <span>Total</span>
                                <span className="font-serif text-lg text-[#F0F0F8]">
                                    {cart?.meta?.grand_total ? formatMoney(Number.parseFloat(cart.meta.grand_total) || 0) : formatMoney(0)}
                                </span>
                            </div>
                            <Button asChild className="mt-2 w-full bg-[#F5A623] font-semibold text-black hover:bg-[#FFBE4D] hover:shadow-[var(--lux-glow)] active:scale-[0.98]" disabled={!cart?.items?.length}>
                                <Link href={route('cart.index')} prefetch onClick={() => closeDrawer()} className="w-full justify-center">
                                    Ver carrito
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full border-white/15 bg-transparent hover:border-[#F5A623]/40" disabled={!cart?.items?.length} asChild>
                                <Link href={route('checkout.index')} prefetch onClick={() => closeDrawer()} className="w-full justify-center">
                                    Ir al checkout
                                </Link>
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
