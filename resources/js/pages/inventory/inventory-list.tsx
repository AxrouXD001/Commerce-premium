import { InventorySocketToasts } from '@/components/inventory/inventory-socket-toasts';
import { StockBadge } from '@/components/inventory/stock-badge';
import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInventoryList } from '@/hooks/use-inventory';
import type { InventoryLineDto } from '@/types/inventory';
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function InventoryListPage() {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const debouncedQ = useMemo(() => q.trim(), [q]);

    const query = useInventoryList({ q: debouncedQ, page });

    const rows: InventoryLineDto[] = query.data?.data ?? [];
    const meta = query.data?.meta;

    return (
        <>
            <Head title="Inventario" />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <InventorySocketToasts />
                <main className="mx-auto w-full max-w-6xl px-4 py-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight">Inventario</h1>
                            <p className="text-muted-foreground mt-1 text-sm">
                                Stock físico, reservas y disponible por SKU (almacén principal).
                            </p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href={route('catalog.inventory.adjust')}>Ajuste manual</Link>
                        </Button>
                    </div>

                    <div className="mb-6 flex max-w-md flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            placeholder="Buscar por nombre o SKU…"
                            value={q}
                            onChange={(e) => {
                                setQ(e.target.value);
                                setPage(1);
                            }}
                        />
                        <Button
                            disabled={query.isFetching}
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                void query.refetch();
                            }}
                        >
                            {query.isFetching ? 'Actualizando…' : 'Refrescar'}
                        </Button>
                    </div>

                    {query.isError ? (
                        <p className="text-destructive text-sm">No se pudo cargar el inventario. ¿Iniciaste sesión como admin o vendedor?</p>
                    ) : null}

                    <div className="overflow-x-auto rounded-xl border">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wide">
                                <tr>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3">SKU</th>
                                    <th className="px-4 py-3">Físico</th>
                                    <th className="px-4 py-3">Reservado</th>
                                    <th className="px-4 py-3">Disponible</th>
                                    <th className="px-4 py-3">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{row.product_name ?? '—'}</p>
                                            <p className="text-muted-foreground text-xs">
                                                #{row.product_id}
                                                {row.product_variant_key > 0 ? ` · variante ${row.product_variant_key}` : ''}
                                            </p>
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3 font-mono text-xs">{row.sku || '—'}</td>
                                        <td className="px-4 py-3 tabular-nums">{row.on_hand}</td>
                                        <td className="px-4 py-3 tabular-nums">{row.reserved}</td>
                                        <td className="px-4 py-3 tabular-nums font-medium">{row.available}</td>
                                        <td className="px-4 py-3">
                                            <StockBadge available={row.available} reorderPoint={row.reorder_point} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {meta && meta.last_page > 1 ? (
                        <div className="mt-6 flex items-center justify-between text-sm">
                            <p className="text-muted-foreground">
                                Página {meta.current_page} de {meta.last_page} ({meta.total} líneas)
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    disabled={meta.current_page <= 1 || query.isFetching}
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    disabled={meta.current_page >= meta.last_page || query.isFetching}
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPage((p) => p + 1)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-10">
                        <Button asChild variant="outline">
                            <Link href={route('catalog.index')}>← Volver al catálogo</Link>
                        </Button>
                    </div>
                </main>
            </div>
        </>
    );
}
