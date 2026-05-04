import { AddressBook } from '@/components/crm/address-book';
import { OrderHistory } from '@/components/crm/order-history';
import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CRM_CUSTOMERS_KEY, useCustomerDetail, useCustomerOrders } from '@/hooks/use-crm';
import { apiClient } from '@/lib/api-client';
import { ensureSanctumCsrfCookie } from '@/lib/sanctum-csrf';
import type { CustomerDto } from '@/types/crm';
import { Head, Link, router } from '@inertiajs/react';
import { useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

interface CustomerDetailPageProps {
    customerId: number;
}

function displayName(c: CustomerDto): string {
    const n = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();

    return n || c.email;
}

export default function CustomerDetailPage({ customerId }: CustomerDetailPageProps) {
    const queryClient = useQueryClient();
    const detail = useCustomerDetail(customerId);
    const [orderPage, setOrderPage] = useState(1);
    const orders = useCustomerOrders(customerId, orderPage, 8);
    const [noteBody, setNoteBody] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    const c = detail.data;

    const submitNote = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!noteBody.trim()) {
            return;
        }
        setSavingNote(true);
        try {
            await ensureSanctumCsrfCookie();
            await apiClient.post(`/v1/customers/${customerId}/notes`, { body: noteBody.trim() });
            setNoteBody('');
            await queryClient.invalidateQueries({ queryKey: [...CRM_CUSTOMERS_KEY, 'detail', customerId] });
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <>
            <Head title={c ? displayName(c) : 'Cliente'} />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <main className="mx-auto w-full max-w-4xl px-4 py-8">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-muted-foreground text-sm">
                                <Link href={route('crm.customers.index')} className="hover:underline">
                                    ← Clientes
                                </Link>
                            </p>
                            {detail.isLoading ? (
                                <h1 className="mt-2 text-2xl font-semibold">Cargando…</h1>
                            ) : c ? (
                                <>
                                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">{displayName(c)}</h1>
                                    <p className="text-muted-foreground mt-1">{c.email}</p>
                                    {c.company ? <p className="text-muted-foreground text-sm">{c.company}</p> : null}
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                        <span className="bg-muted rounded-full px-2 py-0.5 capitalize">{c.status}</span>
                                        {c.segments?.map((s) => (
                                            <span key={s.id} className="bg-muted rounded-full px-2 py-0.5">
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <h1 className="mt-2 text-2xl font-semibold">Cliente no encontrado</h1>
                            )}
                        </div>
                        {c ? (
                            <Button asChild variant="outline">
                                <Link href={route('crm.customers.edit', c.id)} prefetch>
                                    <Pencil className="mr-2 size-4" />
                                    Editar
                                </Link>
                            </Button>
                        ) : null}
                    </div>

                    {detail.isError ? (
                        <p className="text-destructive text-sm">No se pudo cargar el cliente.</p>
                    ) : null}

                    {c ? (
                        <div className="flex flex-col gap-10">
                            <section className="grid gap-8 lg:grid-cols-2">
                                <AddressBook addresses={c.addresses ?? []} />
                                <div className="flex flex-col gap-3">
                                    <h2 className="text-lg font-semibold">Notas internas</h2>
                                    <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto text-sm">
                                        {(c.notes ?? []).length === 0 ? (
                                            <li className="text-muted-foreground">Sin notas.</li>
                                        ) : (
                                            (c.notes ?? []).map((n) => (
                                                <li key={n.id} className="bg-muted/40 rounded-lg border px-3 py-2">
                                                    <p className="whitespace-pre-wrap">{n.body}</p>
                                                    <p className="text-muted-foreground mt-1 text-xs">
                                                        {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                                                    </p>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                    <form className="flex flex-col gap-2" onSubmit={(e) => void submitNote(e)}>
                                        <Label htmlFor="note">Añadir nota</Label>
                                        <textarea
                                            id="note"
                                            rows={3}
                                            className="border-input bg-background ring-offset-background focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                            value={noteBody}
                                            onChange={(e) => setNoteBody(e.target.value)}
                                            placeholder="Contacto telefónico, acuerdos, incidencias…"
                                        />
                                        <Button type="submit" disabled={savingNote || !noteBody.trim()}>
                                            {savingNote ? 'Guardando…' : 'Guardar nota'}
                                        </Button>
                                    </form>
                                </div>
                            </section>

                            <OrderHistory
                                orders={orders.data?.data ?? []}
                                currentPage={orders.data?.meta.current_page ?? 1}
                                lastPage={orders.data?.meta.last_page ?? 1}
                                isFetching={orders.isFetching}
                                onPageChange={(p) => setOrderPage(p)}
                            />

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={async () => {
                                        if (!window.confirm('¿Eliminar este cliente? (se puede restaurar desde BD)')) {
                                            return;
                                        }
                                        await ensureSanctumCsrfCookie();
                                        await apiClient.delete(`/v1/customers/${customerId}`);
                                        router.visit(route('crm.customers.index'));
                                    }}
                                >
                                    Eliminar cliente
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>
        </>
    );
}
