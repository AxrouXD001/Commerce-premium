import { FilterPanel } from '@/components/catalog/filter-panel';
import { PaginationBar } from '@/components/catalog/pagination-bar';
import { ProductCard } from '@/components/catalog/product-card';
import { SaleShopBar } from '@/components/sales/sale-shop-bar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalogSearch } from '@/hooks/use-catalog-search';
import type { CatalogSearchFilters, CategoryDto } from '@/types/catalog';
import type { SharedData } from '@/types/index';
import { Head, Link, usePage } from '@inertiajs/react';
import { Boxes, Package, Plus, SearchX, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';

interface ProductListProps {
    categories: CategoryDto[];
}

function canManageCatalog(roles?: string[]): boolean {
    if (!roles) {
        return false;
    }
    return roles.some((r) => r === 'admin' || r === 'vendedor');
}

function CatalogSkeletonGrid() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-[#2A2A3A] bg-[#111118]">
                    <Skeleton className="aspect-[4/3] w-full rounded-none" />
                    <div className="space-y-2 p-4">
                        <Skeleton className="h-4 w-[88%]" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function ProductList({ categories }: ProductListProps) {
    const { auth } = usePage<SharedData>().props;
    const canManage = canManageCatalog(auth.user?.roles);

    const [filters, setFilters] = useState<CatalogSearchFilters>({
        page: 1,
        per_page: 12,
        sort: 'latest',
    });

    const query = useCatalogSearch(filters);
    const categoryOptions = useMemo(() => query.data?.facets?.categories ?? categories, [query.data?.facets?.categories, categories]);

    const { data, isFetching, error } = query;
    const products = data?.data ?? [];
    const meta = data?.meta;
    const showSkeleton = isFetching && products.length === 0;

    return (
        <>
            <Head title="Catálogo" />
            <div className="mx-auto flex min-h-screen flex-col gap-6">
                <SaleShopBar />
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl border border-[#F5A623]/25 bg-[#F5A623]/10 p-2.5 text-[#F5A623]">
                                <Package className="size-6" />
                            </div>
                            <div>
                                <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#F0F0F8]">Catálogo</h1>
                                <p className="text-muted-foreground mt-1 text-sm">Explora productos con filtros en vivo.</p>
                            </div>
                        </div>
                        {canManage ? (
                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="outline">
                                    <Link href={route('catalog.inventory.index')} className="inline-flex items-center gap-2">
                                        <Boxes className="size-4" />
                                        Inventario
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={route('catalog.inventory.adjust')} className="inline-flex items-center gap-2">
                                        <SlidersHorizontal className="size-4" />
                                        Ajuste stock
                                    </Link>
                                </Button>
                                <Button asChild>
                                    <Link href={route('catalog.products.create')} className="inline-flex items-center gap-2">
                                        <Plus className="size-4" />
                                        Nuevo producto
                                    </Link>
                                </Button>
                            </div>
                        ) : null}
                    </header>

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="shrink-0 lg:max-w-[280px]">
                            <FilterPanel categories={categoryOptions} filters={filters} onFiltersChange={setFilters} />
                        </div>

                        <div className="min-w-0 flex-1">
                            {error ? (
                                <p className="text-destructive text-sm">No se pudo cargar el catálogo. ¿Está ejecutándose Laravel?</p>
                            ) : null}

                            {isFetching && products.length > 0 ? (
                                <p className="text-muted-foreground mb-4 text-sm">Actualizando resultados…</p>
                            ) : null}

                            {showSkeleton ? <CatalogSkeletonGrid /> : null}

                            {!showSkeleton && products.length === 0 && !isFetching ? (
                                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#2A2A3A] bg-[#111118]/60 px-8 py-20 text-center">
                                    <div className="rounded-full border border-[#F5A623]/25 bg-[#F5A623]/10 p-4 text-[#F5A623]">
                                        <SearchX className="size-10" strokeWidth={1.25} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="font-serif text-xl font-semibold text-[#F0F0F8]">Sin resultados</h2>
                                        <p className="text-muted-foreground max-w-sm text-sm">
                                            Prueba otra búsqueda o amplía el rango de precio para ver más productos.
                                        </p>
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => setFilters({ page: 1, per_page: 12, sort: 'latest' })}>
                                        Limpiar y volver a explorar
                                    </Button>
                                </div>
                            ) : null}

                            {!showSkeleton && products.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {products.map((p) => (
                                        <ProductCard key={p.id} product={p} />
                                    ))}
                                </div>
                            ) : null}

                            <PaginationBar meta={meta} isFetching={isFetching} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
