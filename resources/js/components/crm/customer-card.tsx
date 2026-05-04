import { Button } from '@/components/ui/button';
import type { CustomerDto } from '@/types/crm';
import { Link } from '@inertiajs/react';

function displayName(c: CustomerDto): string {
    const n = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();

    return n || c.email;
}

export function CustomerCard({ customer }: { customer: CustomerDto }) {
    const ordersCount = customer.orders_count ?? 0;
    const lifetime = customer.orders_sum_grand_total != null ? Number(customer.orders_sum_grand_total) : 0;

    return (
        <div className="bg-card hover:border-primary/40 flex flex-col gap-3 rounded-xl border p-4 transition-colors">
            <div className="flex flex-col gap-1">
                <p className="font-semibold leading-tight">{displayName(customer)}</p>
                <p className="text-muted-foreground text-sm">{customer.email}</p>
                {customer.company ? <p className="text-muted-foreground text-xs">{customer.company}</p> : null}
            </div>
            <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
                <span className="bg-muted rounded-full px-2 py-0.5 capitalize">{customer.status}</span>
                {customer.segments?.length ? (
                    <span className="bg-muted rounded-full px-2 py-0.5">
                        {customer.segments.map((s) => s.name).join(' · ')}
                    </span>
                ) : null}
            </div>
            <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
                <span>{ordersCount} pedido{ordersCount === 1 ? '' : 's'}</span>
                <span>
                    {lifetime.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            <Button asChild size="sm" variant="outline">
                <Link href={route('crm.customers.show', customer.id)} prefetch>
                    Ver ficha
                </Link>
            </Button>
        </div>
    );
}
