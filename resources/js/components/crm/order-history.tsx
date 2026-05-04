import { Button } from '@/components/ui/button';
import type { CustomerOrderSummaryDto } from '@/types/crm';

export function OrderHistory({
    orders,
    currentPage,
    lastPage,
    isFetching,
    onPageChange,
}: {
    orders: CustomerOrderSummaryDto[];
    currentPage: number;
    lastPage: number;
    isFetching: boolean;
    onPageChange: (page: number) => void;
}) {
    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Historial de pedidos</h2>
            <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-muted/50 border-b text-xs font-semibold uppercase tracking-wide">
                        <tr>
                            <th className="px-4 py-3">Pedido</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3">Total</th>
                            <th className="px-4 py-3">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.length === 0 ? (
                            <tr>
                                <td className="text-muted-foreground px-4 py-6" colSpan={4}>
                                    Sin pedidos vinculados aún.
                                </td>
                            </tr>
                        ) : (
                            orders.map((o) => (
                                <tr key={o.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                                    <td className="px-4 py-3 capitalize">{o.status}</td>
                                    <td className="px-4 py-3 tabular-nums">
                                        {o.grand_total.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}{' '}
                                        {o.currency}
                                    </td>
                                    <td className="text-muted-foreground px-4 py-3 text-xs">
                                        {o.created_at ? new Date(o.created_at).toLocaleString() : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {lastPage > 1 ? (
                <div className="flex items-center justify-between gap-2 text-sm">
                    <p className="text-muted-foreground">
                        Página {currentPage} de {lastPage}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            disabled={currentPage <= 1 || isFetching}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        >
                            Anterior
                        </Button>
                        <Button
                            disabled={currentPage >= lastPage || isFetching}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                        >
                            Siguiente
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
