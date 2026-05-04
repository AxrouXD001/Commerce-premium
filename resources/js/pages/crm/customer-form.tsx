import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerDetail, useSegments } from '@/hooks/use-crm';
import { apiClient } from '@/lib/api-client';
import { ensureSanctumCsrfCookie } from '@/lib/sanctum-csrf';
import type { CustomerDto, CustomerStatus } from '@/types/crm';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface CustomerFormPageProps {
    customerId?: number;
}

export default function CustomerFormPage({ customerId }: CustomerFormPageProps) {
    const isEdit = customerId != null && customerId > 0;
    const detail = useCustomerDetail(isEdit ? customerId : null);
    const segmentsQuery = useSegments();

    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [company, setCompany] = useState('');
    const [status, setStatus] = useState<CustomerStatus>('active');
    const [segmentIds, setSegmentIds] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        const c = detail.data;
        if (!c) {
            return;
        }
        setEmail(c.email);
        setFirstName(c.first_name ?? '');
        setLastName(c.last_name ?? '');
        setPhone(c.phone ?? '');
        setCompany(c.company ?? '');
        setStatus(c.status);
        setSegmentIds((c.segments ?? []).map((s) => s.id));
    }, [detail.data]);

    const toggleSegment = (id: number, checked: boolean) => {
        setSegmentIds((prev) => {
            if (checked) {
                return prev.includes(id) ? prev : [...prev, id];
            }

            return prev.filter((x) => x !== id);
        });
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        setSubmitting(true);
        try {
            await ensureSanctumCsrfCookie();
            const payload = {
                email,
                first_name: firstName || null,
                last_name: lastName || null,
                phone: phone || null,
                company: company || null,
                status,
                segment_ids: segmentIds,
            };
            if (isEdit && customerId) {
                await apiClient.patch<CustomerDto>(`/v1/customers/${customerId}`, payload);
                router.visit(route('crm.customers.show', customerId));
            } else {
                const { data } = await apiClient.post<CustomerDto>('/v1/customers', payload);
                router.visit(route('crm.customers.show', data.id));
            }
        } catch (err: unknown) {
            const ax = err as { response?: { data?: { message?: string } } };
            setFormError(ax.response?.data?.message ?? 'No se pudo guardar. Revisa los datos.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head title={isEdit ? 'Editar cliente' : 'Nuevo cliente'} />
            <div className="bg-background flex min-h-screen flex-col">
                <SaleShopBar />
                <main className="mx-auto w-full max-w-xl px-4 py-8">
                    <p className="text-muted-foreground text-sm">
                        <Link href={route('crm.customers.index')} className="hover:underline">
                            ← Clientes
                        </Link>
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold">{isEdit ? 'Editar cliente' : 'Nuevo cliente'}</h1>

                    {isEdit && detail.isLoading ? (
                        <p className="text-muted-foreground mt-4 text-sm">Cargando datos…</p>
                    ) : (
                        <form className="mt-6 flex flex-col gap-4" onSubmit={(e) => void submit(e)}>
                            {formError ? <p className="text-destructive text-sm">{formError}</p> : null}
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="fn">Nombre</Label>
                                    <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="ln">Apellidos</Label>
                                    <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="company">Empresa</Label>
                                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="status">Estado</Label>
                                <select
                                    id="status"
                                    className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                                >
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>Segmentos</Label>
                                <div className="bg-muted/30 flex flex-col gap-2 rounded-lg border p-3">
                                    {(segmentsQuery.data ?? []).length === 0 ? (
                                        <p className="text-muted-foreground text-sm">Sin segmentos.</p>
                                    ) : (
                                        (segmentsQuery.data ?? []).map((s) => (
                                            <label key={s.id} className="flex items-center gap-2 text-sm">
                                                <Checkbox
                                                    checked={segmentIds.includes(s.id)}
                                                    onCheckedChange={(v) => toggleSegment(s.id, v === true)}
                                                />
                                                <span>
                                                    {s.name}{' '}
                                                    <span className="text-muted-foreground text-xs">({s.kind})</span>
                                                </span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Guardando…' : 'Guardar'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href={route('crm.customers.index')}>Cancelar</Link>
                                </Button>
                            </div>
                        </form>
                    )}
                </main>
            </div>
        </>
    );
}
