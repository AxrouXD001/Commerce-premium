import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/use-cart';
import { useProduct } from '@/hooks/use-products';
import { firstLaravelValidationMessage } from '@/lib/laravel-errors';
import { formatMoney } from '@/lib/money';
import type { SharedData } from '@/types/index';
import type { ProductDto } from '@/types/catalog';
import { useCartStore } from '@/stores/use-cart-store';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { isAxiosError } from 'axios';
import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface ProductDetailProps {
    product: ProductDto;
}

function canManageCatalog(roles?: string[]): boolean {
    if (!roles) {
        return false;
    }

    return roles.some((r) => r === 'admin' || r === 'vendedor');
}

export default function ProductDetail({ product: initial }: ProductDetailProps) {
    const { auth } = usePage<SharedData>().props;
    const canManage = canManageCatalog(auth.user?.roles);
    const { addToCart, mutationPending } = useCart();
    const { openDrawer } = useCartStore();

    const query = useProduct(initial.slug, { initialData: initial });
    const p = query.data ?? initial;

    const hasVariants = Boolean(p.variants?.length);

    const [qty, setQty] = useState(1);
    const [addError, setAddError] = useState<string | null>(null);

    const [variantId, setVariantId] = useState<number | null>(() =>
        hasVariants && p.variants?.[0]?.id ? p.variants[0].id : null,
    );

    useEffect(() => {
        if (hasVariants && p.variants?.[0]?.id) {
            setVariantId((cur) => (cur === null ? p.variants[0].id : cur));
        } else if (!hasVariants) {
            setVariantId(null);
        }
    }, [hasVariants, p.variants]);

    const selectedVariant = useMemo(() => {
        if (!hasVariants) {
            return null;
        }

        return p.variants.find((v) => v.id === variantId) ?? p.variants[0] ?? null;
    }, [hasVariants, p.variants, variantId]);

    const unitPrice = useMemo(() => {
        if (selectedVariant) {
            return p.price + (selectedVariant.price_adjustment ?? 0);
        }

        return p.price;
    }, [p.price, selectedVariant]);

    const maxStock = useMemo(() => {
        if (selectedVariant) {
            return selectedVariant.stock;
        }

        return p.stock;
    }, [p.stock, selectedVariant]);

    async function handleAddToCart(): Promise<void> {
        setAddError(null);

        if (hasVariants && selectedVariant === null) {
            return;
        }

        const productId = Number(p.id);
        if (!Number.isFinite(productId)) {
            setAddError('Producto no válido.');
            return;
        }

        const variantPk =
            selectedVariant !== null && selectedVariant.id !== undefined && selectedVariant.id !== null
                ? Number(selectedVariant.id)
                : null;
        if (variantPk !== null && !Number.isFinite(variantPk)) {
            setAddError('Variante no válida.');
            return;
        }

        const quantity = Math.min(999, Math.max(1, Math.trunc(Number(qty)) || 1));

        try {
            await addToCart({
                product_id: productId,
                product_variant_id: variantPk,
                quantity,
            });
            openDrawer();
        } catch (err) {
            const fromApi = isAxiosError(err) ? firstLaravelValidationMessage(err.response?.data) : null;
            setAddError(fromApi ?? 'No se pudo agregar al carrito. Intenta de nuevo.');
        }
    }

    return (
        <>
            <Head title={p.name} />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <div className="mx-auto w-full max-w-4xl px-4 py-8">
                    <div className="mb-6 flex flex-wrap items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('catalog.index')}>← Volver al catálogo</Link>
                        </Button>
                        {canManage ? (
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={route('catalog.products.edit', p.slug)}>Editar</Link>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    type="button"
                                    onClick={() => {
                                        if (confirm(`¿Eliminar ${p.name}?`)) {
                                            router.delete(route('catalog.products.destroy', p.slug));
                                        }
                                    }}
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Eliminar
                                </Button>
                            </div>
                        ) : null}
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="space-y-3">
                            {p.images?.length ? (
                                <img src={p.images[0].url} alt="" className="w-full rounded-xl border object-cover" />
                            ) : (
                                <div className="bg-muted flex aspect-video items-center justify-center rounded-xl border text-sm text-neutral-500">Sin imagen</div>
                            )}
                            {p.images && p.images.length > 1 ? (
                                <div className="grid grid-cols-4 gap-2">
                                    {p.images.slice(1, 9).map((img, idx) => (
                                        <img key={idx} src={img.url} alt="" className="aspect-square rounded-md border object-cover" />
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-4">
                            {p.category ? <p className="text-muted-foreground text-sm">{p.category.name}</p> : null}
                            <h1 className="text-3xl font-semibold">{p.name}</h1>
                            <p className="text-muted-foreground text-sm">SKU base: {p.sku}</p>
                            <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-2xl font-bold">{formatMoney(unitPrice)}</span>
                                {p.compare_at_price ? <span className="text-muted-foreground line-through">{formatMoney(p.compare_at_price)}</span> : null}
                            </div>
                            <p className="text-sm">Stock disponible: {maxStock}</p>
                            {p.description ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.description}</p> : null}

                            {hasVariants ? (
                                <div className="space-y-2">
                                    <Label htmlFor="variant-select">Variante</Label>
                                    <select
                                        id="variant-select"
                                        className="border-input bg-background h-10 w-full max-w-md rounded-md border px-3 text-sm"
                                        value={variantId ?? ''}
                                        onChange={(e) => setVariantId(Number.parseInt(e.target.value, 10))}
                                    >
                                        {p.variants.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.name} — {formatMoney(p.price + v.price_adjustment)} · stock {v.stock}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : null}

                            <div className="flex flex-wrap items-end gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="qty">Cantidad</Label>
                                    <Input
                                        id="qty"
                                        type="number"
                                        min={1}
                                        max={Math.min(999, maxStock)}
                                        className="h-10 w-24"
                                        value={qty}
                                        onChange={(e) => {
                                            const parsed = Number.parseInt(e.target.value, 10) || 1;
                                            const capped = Math.min(parsed, Math.max(1, maxStock));
                                            setQty(Math.max(1, capped));
                                        }}
                                    />
                                </div>
                                <Button type="button" disabled={mutationPending || maxStock < 1} onClick={() => void handleAddToCart()}>
                                    {mutationPending ? 'Agregando…' : 'Agregar al carrito'}
                                </Button>
                            </div>
                            {addError ? <p className="text-destructive text-sm">{addError}</p> : null}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
