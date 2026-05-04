import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type StepIndicatorProps = {
    steps: string[];
    /** 0-based índice del paso activo */
    activeIndex: number;
};

export function StepIndicator({ steps, activeIndex }: StepIndicatorProps) {
    return (
        <nav aria-label="Progreso" className="mb-10">
            <ol className="flex flex-wrap gap-6 text-sm">
                {steps.map((label, idx) => {
                    const state = idx < activeIndex ? 'done' : idx === activeIndex ? 'current' : 'todo';

                    return (
                        <li key={label} className="flex items-center gap-3">
                            <span
                                className={cn(
                                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300',
                                    state === 'done' &&
                                        'border-emerald-500/50 bg-emerald-500/15 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.2)]',
                                    state === 'current' &&
                                        'border-[#F5A623] bg-[#F5A623]/15 text-[#F5A623] shadow-[0_0_16px_rgba(245,166,35,0.25)]',
                                    state === 'todo' && 'border-white/10 bg-transparent text-muted-foreground',
                                )}
                            >
                                {state === 'done' ? <Check className="size-4 stroke-[2.5]" /> : idx + 1}
                            </span>
                            <span
                                className={cn(
                                    'font-medium',
                                    state === 'todo' && 'text-muted-foreground',
                                    state === 'current' && 'text-[#F0F0F8]',
                                    state === 'done' && 'text-emerald-400/90',
                                )}
                            >
                                {label}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
