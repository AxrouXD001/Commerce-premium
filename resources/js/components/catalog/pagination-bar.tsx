import { Button } from '@/components/ui/button';
import type { PaginationMetaDto } from '@/types/catalog';

interface PaginationBarProps {
    meta?: PaginationMetaDto;
    onPageChange: (page: number) => void;
    isFetching?: boolean;
}

export function PaginationBar({ meta, onPageChange, isFetching }: PaginationBarProps) {
    if (!meta || meta.last_page <= 1) {
        return null;
    }

    const { current_page: current, last_page: last } = meta;

    return (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={current <= 1 || isFetching} onClick={() => onPageChange(current - 1)}>
                Anterior
            </Button>
            <span className="text-muted-foreground text-sm tabular-nums">
                Página {current} de {last}
            </span>
            <Button type="button" variant="outline" size="sm" disabled={current >= last || isFetching} onClick={() => onPageChange(current + 1)}>
                Siguiente
            </Button>
        </div>
    );
}
