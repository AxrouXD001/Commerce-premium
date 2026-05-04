import { ProductCard } from '@/components/catalog/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCatalogSearch } from '@/hooks/use-catalog-search';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import type { ProductDto } from '@/types/catalog';
import { Head, Link, usePage } from '@inertiajs/react';
import { Dumbbell, Home, Laptop, Package, Shirt, Sparkles } from 'lucide-react';

const CATEGORY_ROW = [
    { label: 'Moda', Icon: Shirt },
    { label: 'Tech', Icon: Laptop },
    { label: 'Hogar', Icon: Home },
    { label: 'Premium', Icon: Sparkles },
    { label: 'Deporte', Icon: Dumbbell },
    { label: 'Todo', Icon: Package },
] as const;

function HeroMiniCard({
    product,
    rotateClass,
    floatDelay,
}: {
    product?: ProductDto;
    rotateClass: string;
    floatDelay: string;
}) {
    const img = product?.images[0]?.url;

    return (
        <div className="animate-welcome-float w-[min(100%,220px)]" style={{ animationDelay: floatDelay }}>
            <div
                className={cn(
                    'overflow-hidden rounded-2xl border border-[#2A2A3A] bg-[#111118] shadow-lg transition hover:border-[#F5A623]/35',
                    rotateClass,
                )}
            >
                <div className="relative aspect-[4/3] w-full bg-white/[0.04]">
                    {img ? (
                        <img src={img} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
                    ) : (
                        <div className="text-muted-foreground flex size-full items-center justify-center text-xs">Preview</div>
                    )}
                </div>
                <div className="space-y-1 p-3">
                    <p className="truncate text-sm font-medium text-[#F0F0F8]">{product?.name ?? 'Producto'}</p>
                    <p className="font-mono text-sm font-bold text-[#F5A623]">
                        {product ? formatMoney(product.price) : '—'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function FeaturedSkeleton() {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-[#2A2A3A] bg-[#111118]">
                    <Skeleton className="aspect-[4/3] w-full rounded-none" />
                    <div className="space-y-2 p-4">
                        <Skeleton className="h-4 w-[85%]" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Welcome() {
    const { auth, name } = usePage<SharedData>().props;
    const year = new Date().getFullYear();

    const featuredQuery = useCatalogSearch({
        page: 1,
        per_page: 4,
        sort: 'latest',
    });

    const products = featuredQuery.data?.data ?? [];
    const heroProducts = products.slice(0, 3);
    const loading = featuredQuery.isFetching && products.length === 0;

    return (
        <>
            <Head title={`Inicio — ${name}`} />

            <div className="flex min-h-screen flex-col">
                <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
                    <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-2 px-4 py-3 text-sm font-medium">
                        <Link
                            href={route('catalog.index')}
                            prefetch
                            className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 transition-colors"
                        >
                            Catálogo
                        </Link>
                        <Link
                            href={route('cart.index')}
                            prefetch
                            className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 transition-colors"
                        >
                            Carrito
                        </Link>
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                prefetch
                                className="border-border text-foreground hover:border-[#F5A623]/40 rounded-[10px] border bg-white/[0.04] px-4 py-2 transition-colors"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    prefetch
                                    className="text-muted-foreground hover:text-foreground rounded-lg px-3 py-2 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href={route('register')}
                                    prefetch
                                    className="bg-[#F5A623] px-4 py-2 font-semibold text-black shadow-none transition hover:bg-[#FFBE4D] hover:shadow-[var(--lux-glow)] active:scale-[0.98] sm:rounded-[10px]"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <main className="flex-1">
                    {/* [1] Hero */}
                    <section className="relative mx-auto max-w-6xl px-4 py-14 lg:py-20">
                        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                            <div className="max-w-xl">
                                <p className="welcome-hero-tag text-[#F5A623] mb-4 inline-flex rounded-full border border-[#F5A623]/40 bg-[#F5A623]/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase">
                                    Sistema de Ventas Profesional
                                </p>
                                <h1 className="welcome-hero-title font-serif text-4xl leading-[1.1] font-semibold tracking-tight text-[#F0F0F8] md:text-[56px]">
                                    Gestiona tus ventas con total precisión
                                </h1>
                                <p className="welcome-hero-sub text-muted-foreground mt-5 max-w-md text-lg leading-relaxed">
                                    Catálogo, carrito, checkout y CRM en una experiencia oscura premium pensada para equipos que venden en serio.
                                </p>
                                <div className="welcome-hero-ctas mt-8 flex flex-wrap gap-3">
                                    <Button asChild className="px-6">
                                        <Link href={route('catalog.index')} prefetch>
                                            Explorar catálogo
                                        </Link>
                                    </Button>
                                    {auth.user ? (
                                        <Button asChild variant="outline" className="px-6">
                                            <Link href={route('dashboard')} prefetch>
                                                Ir a mi cuenta
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button asChild variant="outline" className="px-6">
                                            <Link href={route('login')} prefetch>
                                                Iniciar sesión
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                                <div className="welcome-hero-stats text-muted-foreground mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/5 pt-6 text-sm font-medium tracking-wide uppercase">
                                    <span>1,200+ productos</span>
                                    <span className="text-[#2A2A3A]">|</span>
                                    <span>99% uptime</span>
                                    <span className="text-[#2A2A3A]">|</span>
                                    <span>IGV incluido</span>
                                </div>
                            </div>

                            <div className="relative flex min-h-[320px] justify-center lg:justify-end">
                                <div
                                    className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] opacity-90"
                                    style={{
                                        background:
                                            'radial-gradient(ellipse 70% 60% at 60% 40%, rgba(245, 166, 35, 0.08) 0%, transparent 62%)',
                                    }}
                                />
                                <div className="relative flex w-full max-w-sm flex-col items-center gap-4 pl-4 lg:items-end">
                                    <HeroMiniCard product={heroProducts[0]} rotateClass="rotate-3" floatDelay="0s" />
                                    <div className="-mt-4 w-full max-w-[200px] self-center lg:mr-8">
                                        <HeroMiniCard product={heroProducts[1]} rotateClass="-rotate-2" floatDelay="0.15s" />
                                    </div>
                                    <div className="-mt-4 w-full max-w-[200px] self-end lg:mr-2">
                                        <HeroMiniCard product={heroProducts[2]} rotateClass="rotate-2" floatDelay="0.3s" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* [2] Categorías */}
                    <section className="border-y border-white/5 bg-[#111118]/40 py-10">
                        <div className="mx-auto max-w-6xl px-4">
                            <p className="text-muted-foreground mb-4 text-center text-xs font-semibold tracking-[0.2em] uppercase">
                                Compra por categoría
                            </p>
                            <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {CATEGORY_ROW.map(({ label, Icon }) => (
                                    <Link
                                        key={label}
                                        href={route('catalog.index')}
                                        prefetch
                                        className="border-border text-muted-foreground hover:border-[#F5A623]/30 hover:bg-[#F5A623]/10 hover:text-foreground flex min-w-[104px] shrink-0 flex-col items-center gap-2 rounded-2xl border bg-white/[0.02] px-4 py-4 text-center text-xs font-medium transition hover:scale-105"
                                    >
                                        <Icon className="size-7 text-[#F5A623]" strokeWidth={1.5} />
                                        <span>{label}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* [3] Destacados */}
                    <section className="mx-auto max-w-6xl px-4 py-16">
                        <h2 className="font-serif mb-8 text-center text-3xl font-semibold tracking-tight text-[#F0F0F8] md:text-4xl">
                            Más vendidos
                        </h2>
                        {loading ? <FeaturedSkeleton /> : null}
                        {!loading && products.length === 0 ? (
                            <p className="text-muted-foreground text-center text-sm">No hay productos para mostrar aún.</p>
                        ) : null}
                        {!loading && products.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {products.map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        ) : null}
                        <div className="mt-10 flex justify-center">
                            <Button asChild variant="outline" size="lg">
                                <Link href={route('catalog.index')} prefetch>
                                    Ver catálogo completo
                                </Link>
                            </Button>
                        </div>
                    </section>

                    {/* [4] Banner */}
                    <section className="mx-4 mb-16 sm:mx-auto sm:max-w-6xl">
                        <div
                            className="rounded-2xl border border-[#F5A623]/20 px-6 py-14 text-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.2) 0%, transparent 55%, transparent 100%)',
                            }}
                        >
                            <p className="font-serif text-2xl font-semibold tracking-tight text-[#F0F0F8] md:text-3xl">
                                Oferta de temporada — hasta 30% OFF
                            </p>
                            <p className="text-muted-foreground mx-auto mt-3 max-w-lg text-sm">
                                Aprovecha descuentos en selección de productos. Válido hasta agotar existencias.
                            </p>
                            <div className="mt-8 flex justify-center">
                                <Button asChild>
                                    <Link href={route('catalog.index')} prefetch>
                                        Ver ofertas
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>
                </main>

                {/* [5] Footer */}
                <footer className="mt-auto border-t border-[#2A2A3A] bg-black/40 py-8">
                    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-sm">
                        <nav className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
                            <Link href={route('catalog.index')} prefetch className="transition hover:text-[#F5A623]">
                                Catálogo
                            </Link>
                            <Link href={route('cart.index')} prefetch className="transition hover:text-[#F5A623]">
                                Carrito
                            </Link>
                            {auth.user ? (
                                <Link href={route('dashboard')} prefetch className="transition hover:text-[#F5A623]">
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} prefetch className="transition hover:text-[#F5A623]">
                                        Login
                                    </Link>
                                    <Link href={route('register')} prefetch className="transition hover:text-[#F5A623]">
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                        <p className="text-muted-foreground text-xs">
                            © {year} {name}. Todos los derechos reservados.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
