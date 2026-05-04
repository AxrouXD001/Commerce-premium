import { CartLineRow } from '@/components/sales/cart-line';
import { OrderSummary } from '@/components/sales/order-summary';
import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { StepIndicator } from '@/components/sales/step-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, PackageOpen } from 'lucide-react';
import { useState } from 'react';

function couponErrorMessage(err: unknown): string {
    const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
    const msg = ax.response?.data?.message;
    if (typeof msg === 'string' && msg.length > 0) {
        return msg;
    }
    const first = ax.response?.data?.errors ? Object.values(ax.response.data.errors)[0]?.[0] : undefined;

    return typeof first === 'string' ? first : 'No se pudo aplicar el cupón.';
}

export default function CartPage() {
    const { cart, isFetching, mutationPending, applyCoupon, removeCoupon, removeItem, updateQuantity } = useCart();
    const [code, setCode] = useState('');
    const [couponFlash, setCouponFlash] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

    const items = cart?.items ?? [];
    const meta = cart?.meta;

    const onApplyCoupon = (): void => {
        setCouponFlash(null);
        applyCoupon(code)
            .then(() => {
                setCouponFlash({ kind: 'ok', text: 'Cupón aplicado correctamente.' });
                setCode('');
            })
            .catch((e: unknown) => {
                setCouponFlash({ kind: 'err', text: couponErrorMessage(e) });
            });
    };

    return (
        <>
            <Head title="Carrito" />
            <div className="flex min-h-screen flex-col">
                <SaleShopBar />
                <main className="mx-auto w-full max-w-5xl px-4 py-8">
                    <StepIndicator steps={['Carrito', 'Checkout', 'Confirmación']} activeIndex={0} />
                    <header className="mb-8">
                        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#F0F0F8]">Tu carrito</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {isFetching ? 'Sincronizando…' : 'Stock y precios se validan con el servidor.'}
                        </p>
                    </header>

                    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
                        <section className="space-y-4">
                            {!items.length && !isFetching ? (
                                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2A2A3A] bg-[#111118]/60 px-8 py-16 text-center">
                                    <div className="rounded-full border border-[#F5A623]/25 bg-[#F5A623]/10 p-4 text-[#F5A623]">
                                        <PackageOpen className="size-10" strokeWidth={1.25} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="font-serif text-xl font-semibold text-[#F0F0F8]">Tu carrito está vacío</h2>
                                        <p className="text-muted-foreground max-w-sm text-sm">
                                            Explora el catálogo y añade productos para comenzar tu pedido.
                                        </p>
                                    </div>
                                    <Button asChild>
                                        <Link href={route('catalog.index')} prefetch>
                                            Ir al catálogo
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {items.map((line) => (
                                        <CartLineRow
                                            key={line.id}
                                            item={line}
                                            onRemove={() => {
                                                if (!mutationPending) {
                                                    removeItem(line.id).catch(() => undefined);
                                                }
                                            }}
                                            onChangeQty={(qty) => {
                                                if (!mutationPending && qty !== line.quantity) {
                                                    updateQuantity(line.id, qty).catch(() => undefined);
                                                }
                                            }}
                                        />
                                    ))}
                                </ul>
                            )}

                            <div className="space-y-3 rounded-2xl border border-[#2A2A3A] bg-[#111118]/80 p-4">
                                <Label htmlFor="coupon-code" variant="form">
                                    Cupón
                                </Label>
                                <div className="flex flex-wrap items-stretch gap-2">
                                    <Input
                                        id="coupon-code"
                                        placeholder="Ej. BIENVENIDO10"
                                        value={code}
                                        onChange={(e) => {
                                            setCode(e.target.value.toUpperCase());
                                            setCouponFlash(null);
                                        }}
                                        className="max-w-xs flex-1 uppercase"
                                        disabled={mutationPending}
                                    />
                                    <Button type="button" disabled={mutationPending} onClick={onApplyCoupon}>
                                        Aplicar
                                    </Button>
                                    <Button variant="outline" type="button" disabled={mutationPending || !cart?.coupon_code} onClick={() => removeCoupon()}>
                                        Quitar cupón
                                    </Button>
                                </div>
                                {couponFlash ? (
                                    <div
                                        className={cn(
                                            'flex items-start gap-2 rounded-[10px] border px-3 py-2 text-sm',
                                            couponFlash.kind === 'ok'
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                                : 'border-red-500/30 bg-red-500/10 text-red-300',
                                        )}
                                    >
                                        {couponFlash.kind === 'ok' ? (
                                            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                                        ) : (
                                            <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                        )}
                                        <span>{couponFlash.text}</span>
                                    </div>
                                ) : null}
                                {cart?.coupon_code ? (
                                    <p className="text-muted-foreground flex items-center gap-2 text-xs">
                                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                                        Activo: <span className="font-mono text-[#F5A623]">{cart.coupon_code}</span>
                                    </p>
                                ) : null}
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Button asChild variant="outline">
                                    <Link href={route('catalog.index')} prefetch>
                                        Seguir comprando
                                    </Link>
                                </Button>
                                <Button asChild disabled={!items.length}>
                                    <Link href={route('checkout.index')} prefetch>
                                        Continuar al checkout
                                    </Link>
                                </Button>
                            </div>
                        </section>

                        <OrderSummary items={items} meta={meta} />
                    </div>
                </main>
            </div>
        </>
    );
}
