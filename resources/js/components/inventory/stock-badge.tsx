import { cn } from '@/lib/utils';

type Props = {
    available: number;
    reorderPoint: number;
    className?: string;
};

export function StockBadge({ available, reorderPoint, className }: Props) {
    const level = available <= reorderPoint ? 'critical' : available <= reorderPoint * 2 ? 'low' : 'ok';

    const styles =
        level === 'critical'
            ? 'bg-red-100 text-red-900 border-red-200 dark:bg-red-950/50 dark:text-red-100 dark:border-red-900'
            : level === 'low'
              ? 'bg-amber-100 text-amber-950 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900'
              : 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:border-emerald-900';

    const label = level === 'critical' ? 'Crítico' : level === 'low' ? 'Bajo' : 'OK';

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tabular-nums',
                styles,
                className,
            )}
        >
            {label} · {available}
        </span>
    );
}
