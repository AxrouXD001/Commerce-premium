import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { CatalogSearchFilters, CategoryDto } from '@/types/catalog';
import { useMemo } from 'react';

const PRICE_SLIDER_MAX = 8000;

interface FilterPanelProps {
    categories?: CategoryDto[];
    filters: CatalogSearchFilters;
    onFiltersChange: (next: CatalogSearchFilters) => void;
}

export function FilterPanel({ categories = [], filters, onFiltersChange }: FilterPanelProps) {
    const minVal = useMemo(() => {
        const n = filters.min_price != null && filters.min_price !== '' ? Number.parseFloat(String(filters.min_price)) : 0;

        return Number.isFinite(n) ? Math.min(Math.max(0, n), PRICE_SLIDER_MAX) : 0;
    }, [filters.min_price]);

    const maxVal = useMemo(() => {
        const n = filters.max_price != null && filters.max_price !== '' ? Number.parseFloat(String(filters.max_price)) : PRICE_SLIDER_MAX;

        return Number.isFinite(n) ? Math.min(Math.max(0, n), PRICE_SLIDER_MAX) : PRICE_SLIDER_MAX;
    }, [filters.max_price]);

    const setMinPrice = (raw: number): void => {
        const nextMin = Math.min(Math.max(0, raw), maxVal);
        onFiltersChange({
            ...filters,
            min_price: nextMin > 0 ? String(nextMin) : undefined,
            page: 1,
        });
    };

    const setMaxPrice = (raw: number): void => {
        const nextMax = Math.max(Math.min(PRICE_SLIDER_MAX, raw), minVal);
        onFiltersChange({
            ...filters,
            max_price: nextMax < PRICE_SLIDER_MAX ? String(nextMax) : undefined,
            page: 1,
        });
    };

    return (
        <aside
            className={cn(
                'w-full space-y-5 rounded-2xl border border-[#2A2A3A] bg-[#111118]/90 p-5 shadow-none backdrop-blur-sm',
                'lg:sticky lg:top-24 lg:w-[280px] lg:shrink-0 lg:self-start',
            )}
        >
            <h2 className="font-serif text-lg font-semibold tracking-tight text-[#F0F0F8]">Filtros</h2>

            <div className="space-y-2">
                <Label htmlFor="q" variant="form">
                    Buscar
                </Label>
                <Input
                    id="q"
                    value={filters.q ?? ''}
                    onChange={(e) => onFiltersChange({ ...filters, q: e.target.value || undefined, page: 1 })}
                    placeholder="Nombre, SKU…"
                />
            </div>

            <div className="space-y-3">
                <Label variant="form">Categoría</Label>
                <div className="flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                    <label className="hover:bg-white/[0.04] flex cursor-pointer items-center gap-3 rounded-[10px] border border-transparent px-2 py-2 transition-colors has-[:focus-visible]:border-[#F5A623]/30">
                        <Checkbox
                            checked={filters.category_id == null}
                            onCheckedChange={(checked) => {
                                if (checked === true) {
                                    onFiltersChange({ ...filters, category_id: undefined, page: 1 });
                                }
                            }}
                        />
                        <span className="text-muted-foreground text-sm">Todas</span>
                    </label>
                    {categories.map((c) => (
                        <label
                            key={c.id}
                            className="hover:bg-white/[0.04] flex cursor-pointer items-center gap-3 rounded-[10px] border border-transparent px-2 py-2 transition-colors has-[:focus-visible]:border-[#F5A623]/30"
                        >
                            <Checkbox
                                checked={filters.category_id === c.id}
                                onCheckedChange={(checked) => {
                                    onFiltersChange({
                                        ...filters,
                                        category_id: checked === true ? c.id : undefined,
                                        page: 1,
                                    });
                                }}
                            />
                            <span className="text-sm text-[#F0F0F8]">
                                {c.name}
                                {typeof c.active_products_count === 'number' ? (
                                    <span className="text-muted-foreground ml-1 text-xs">({c.active_products_count})</span>
                                ) : null}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <Label variant="form">Rango de precio</Label>
                <div className="space-y-3 rounded-[10px] border border-[#2A2A3A] bg-white/[0.02] p-3">
                    <div className="flex justify-between font-mono text-xs text-[#F5A623]">
                        <span>{minVal.toFixed(0)}</span>
                        <span>{maxVal.toFixed(0)}</span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={PRICE_SLIDER_MAX}
                        step={50}
                        value={minVal}
                        className="accent-[#F5A623] h-2 w-full cursor-pointer"
                        aria-label="Precio mínimo"
                        onChange={(e) => setMinPrice(Number.parseInt(e.target.value, 10))}
                    />
                    <input
                        type="range"
                        min={0}
                        max={PRICE_SLIDER_MAX}
                        step={50}
                        value={maxVal}
                        className="accent-[#F5A623] h-2 w-full cursor-pointer"
                        aria-label="Precio máximo"
                        onChange={(e) => setMaxPrice(Number.parseInt(e.target.value, 10))}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="sort" variant="form">
                    Orden
                </Label>
                <select
                    id="sort"
                    className="flex h-10 w-full rounded-[10px] border border-[#2A2A3A] bg-white/[0.03] px-3 text-sm text-[#F0F0F8] transition focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/10 focus:outline-none"
                    value={filters.sort ?? 'latest'}
                    onChange={(e) =>
                        onFiltersChange({
                            ...filters,
                            sort: e.target.value || 'latest',
                            page: 1,
                        })
                    }
                >
                    <option value="latest">Más recientes</option>
                    <option value="price_asc">Precio menor</option>
                    <option value="price_desc">Precio mayor</option>
                    <option value="name">Nombre A–Z</option>
                </select>
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                    onFiltersChange({
                        page: 1,
                        per_page: filters.per_page ?? 12,
                    })
                }
            >
                Limpiar filtros
            </Button>
        </aside>
    );
}
