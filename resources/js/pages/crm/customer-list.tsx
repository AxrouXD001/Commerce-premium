import { CustomerCard } from '@/components/crm/customer-card';
import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerList, useSegments } from '@/hooks/use-crm';
import { apiClient } from '@/lib/api-client';
import { ensureSanctumCsrfCookie } from '@/lib/sanctum-csrf';
import type { CustomerListFilters } from '@/types/crm';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ChevronUp, Download, Plus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function CustomerListPage() {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [segmentId, setSegmentId] = useState<number | ''>('');
    const [hasOrders, setHasOrders] = useState<'any' | 'yes' | 'no'>('any');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [minOrders, setMinOrders] = useState('');
    const [minLifetime, setMinLifetime] = useState('');

    const debouncedQ = useMemo(() => q.trim(), [q]);

    const listFilters: CustomerListFilters = useMemo(
        () => ({
            q: debouncedQ || undefined,
            segment_id: segmentId === '' ? undefined : segmentId,
            has_orders: hasOrders === 'yes' ? true : hasOrders === 'no' ? false : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            min_orders: minOrders !== '' ? Number(minOrders) : undefined,
            min_lifetime_total: minLifetime !== '' ? Number(minLifetime) : undefined,
            page,
            per_page: 12,
        }),
        [debouncedQ, segmentId, hasOrders, dateFrom, dateTo, minOrders, minLifetime, page],
    );

    const query = useCustomerList(listFilters);
    const segmentsQuery = useSegments();

    const rows = query.data?.data ?? [];
    const meta = query.data?.meta;

    const exportCsv = async (): Promise<void> => {
        await ensureSanctumCsrfCookie();
        const { data } = await apiClient.get<Blob>('/v1/customers/export', {
            params: {
                q: listFilters.q,
                segment_id: listFilters.segment_id,
                has_orders: listFilters.has_orders === true ? 1 : listFilters.has_orders === false ? 0 : undefined,
                date_from: listFilters.date_from,
                date_to: listFilters.date_to,
                min_orders: listFilters.min_orders,
                min_lifetime_total: listFilters.min_lifetime_total,
            },
            responseType: 'blob',
        });
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <Head title="Clientes CRM" />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <main className="mx-auto w-full max-w-6xl px-4 py-8">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="bg-primary/10 text-primary rounded-lg p-2">
                                <Users className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
                                <p className="text-muted-foreground mt-1 text-sm">
                                    CRM conectado a pedidos: segmentación, filtros y exportación CSV.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={() => void exportCsv()}>
                                <Download className="mr-2 size-4" />
                                CSV
                            </Button>
                            <Button asChild>
                                <Link href={route('crm.customers.create')} prefetch>
                                    <Plus className="mr-2 size-4" />
                                    Nuevo cliente
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mb-4 flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            placeholder="Buscar por nombre, email, empresa…"
                            value={q}
                            onChange={(e) => {
                                setQ(e.target.value);
                                setPage(1);
                            }}
                        />
                        <Button type="button" variant="secondary" onClick={() => void query.refetch()} disabled={query.isFetching}>
                            {query.isFetching ? 'Actualizando…' : 'Refrescar'}
                        </Button>
                    </div>

                    <div className="mb-6">
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
                            onClick={() => setShowFilters((v) => !v)}
                        >
                            {showFilters ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                            Filtros avanzados
                        </button>
                        {showFilters ? (
                            <div className="bg-muted/30 mt-3 grid gap-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="segment">Segmento</Label>
                                    <select
                                        id="segment"
                                        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                        value={segmentId === '' ? '' : String(segmentId)}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setSegmentId(v === '' ? '' : Number(v));
                                            setPage(1);
                                        }}
                                    >
                                        <option value="">Todos</option>
                                        {(segmentsQuery.data ?? []).map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="has_orders">Con pedidos</Label>
                                    <select
                                        id="has_orders"
                                        className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                        value={hasOrders}
                                        onChange={(e) => {
                                            setHasOrders(e.target.value as 'any' | 'yes' | 'no');
                                            setPage(1);
                                        }}
                                    >
                                        <option value="any">Indistinto</option>
                                        <option value="yes">Sí</option>
                                        <option value="no">No</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="date_from">Pedidos desde</Label>
                                    <Input
                                        id="date_from"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => {
                                            setDateFrom(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="date_to">Pedidos hasta</Label>
                                    <Input
                                        id="date_to"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => {
                                            setDateTo(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="min_orders">Mín. pedidos</Label>
                                    <Input
                                        id="min_orders"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={minOrders}
                                        onChange={(e) => {
                                            setMinOrders(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="min_lt">Mín. total histórico</Label>
                                    <Input
                                        id="min_lt"
                                        inputMode="decimal"
                                        placeholder="0"
                                        value={minLifetime}
                                        onChange={(e) => {
                                            setMinLifetime(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {query.isError ? (
                        <p className="text-destructive text-sm">
                            No se pudo cargar el listado. ¿Iniciaste sesión como admin o vendedor con token API?
                        </p>
                    ) : null}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rows.map((c) => (
                            <CustomerCard key={c.id} customer={c} />
                        ))}
                    </div>

                    {meta && meta.last_page > 1 ? (
                        <div className="mt-8 flex items-center justify-between text-sm">
                            <p className="text-muted-foreground">
                                Página {meta.current_page} de {meta.last_page} ({meta.total} clientes)
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
                </main>
            </div>
        </>
    );
}
