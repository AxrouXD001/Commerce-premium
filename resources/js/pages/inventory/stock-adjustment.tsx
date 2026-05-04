import { InventorySocketToasts } from '@/components/inventory/inventory-socket-toasts';
import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INVENTORY_QUERY_KEY } from '@/hooks/use-inventory';
import { apiClient } from '@/lib/api-client';
import { ensureSanctumCsrfCookie } from '@/lib/sanctum-csrf';
import type { InventoryLineDto } from '@/types/inventory';
import { Head, Link } from '@inertiajs/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export default function StockAdjustmentPage() {
    const qc = useQueryClient();
    const [productId, setProductId] = useState('');
    const [variantKey, setVariantKey] = useState('0');
    const [delta, setDelta] = useState('');
    const [notes, setNotes] = useState('');
    const [result, setResult] = useState<InventoryLineDto | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: async () => {
            await ensureSanctumCsrfCookie();
            const { data } = await apiClient.post<InventoryLineDto>('/v1/inventory/adjust', {
                product_id: Number.parseInt(productId, 10),
                product_variant_key: Number.parseInt(variantKey || '0', 10),
                delta_on_hand: Number.parseInt(delta, 10),
                notes: notes.trim() ? notes.trim() : null,
            });

            return data;
        },
        onSuccess: (data) => {
            setResult(data);
            setError(null);
            void qc.invalidateQueries({ queryKey: INVENTORY_QUERY_KEY });
        },
        onError: () => {
            setError('No se pudo aplicar el ajuste. Revisa permisos, IDs y que el físico no quede por debajo de lo reservado.');
        },
    });

    return (
        <>
            <Head title="Ajuste de stock" />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <InventorySocketToasts />
                <main className="mx-auto w-full max-w-lg px-4 py-8">
                    <h1 className="text-3xl font-semibold tracking-tight">Ajuste manual</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Suma o resta unidades al stock físico del almacén principal. Las reservas de pedidos pendientes se respetan.
                    </p>

                    <form
                        className="mt-8 space-y-4 rounded-xl border p-6"
                        onSubmit={(e) => {
                            e.preventDefault();
                            setError(null);
                            mutation.mutate();
                        }}
                    >
                        <div className="space-y-1">
                            <Label htmlFor="pid">ID de producto</Label>
                            <Input id="pid" inputMode="numeric" required value={productId} onChange={(e) => setProductId(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="vk">Clave de variante (0 = sin variante)</Label>
                            <Input id="vk" inputMode="numeric" value={variantKey} onChange={(e) => setVariantKey(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="delta">Delta en físico (+ recibe, − sale)</Label>
                            <Input id="delta" inputMode="numeric" required value={delta} onChange={(e) => setDelta(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="notes">Notas (opcional)</Label>
                            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        </div>
                        {error ? <p className="text-destructive text-sm">{error}</p> : null}
                        <Button className="w-full" disabled={mutation.isPending} type="submit">
                            {mutation.isPending ? 'Aplicando…' : 'Aplicar ajuste'}
                        </Button>
                    </form>

                    {result ? (
                        <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
                            <p className="font-semibold text-emerald-900 dark:text-emerald-100">Actualizado</p>
                            <p className="text-muted-foreground mt-1">
                                Disponible ahora: <span className="text-foreground font-mono font-semibold">{result.available}</span> (físico{' '}
                                {result.on_hand}, reservado {result.reserved})
                            </p>
                        </div>
                    ) : null}

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Button asChild variant="outline">
                            <Link href={route('catalog.inventory.index')}>Ver listado</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={route('catalog.index')}>Catálogo</Link>
                        </Button>
                    </div>
                </main>
            </div>
        </>
    );
}
