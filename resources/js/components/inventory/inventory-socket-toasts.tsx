import { Button } from '@/components/ui/button';
import { useStockAlert } from '@/hooks/use-stock-alert';
import { X } from 'lucide-react';

export function InventorySocketToasts() {
    const { messages, dismiss, enabled } = useStockAlert();

    if (!enabled || messages.length === 0) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 p-0">
            {messages.map((m) => (
                <div
                    key={m.id}
                    className={
                        m.tone === 'danger'
                            ? 'pointer-events-auto rounded-lg border border-red-200 bg-red-50 p-3 text-sm shadow-lg dark:border-red-900 dark:bg-red-950/80'
                            : 'pointer-events-auto rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm shadow-lg dark:border-amber-900 dark:bg-amber-950/80'
                    }
                >
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-semibold">{m.title}</p>
                            <p className="text-muted-foreground mt-1 text-xs">{m.body}</p>
                        </div>
                        <Button className="size-7 shrink-0 p-0" onClick={() => dismiss(m.id)} size="sm" type="button" variant="ghost">
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
