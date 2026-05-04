import { CartDrawer } from '@/components/sales/cart-drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types/index';
import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Boxes, Users } from 'lucide-react';
import type { ReactNode } from 'react';

function canManageInventory(roles?: string[]): boolean {
    if (!roles) {
        return false;
    }

    return roles.some((r) => r === 'admin' || r === 'vendedor');
}

/**
 * Barra principal tienda — Dark Luxury Commerce (sticky, blur, accent).
 */
export function Navbar() {
    const { auth, name } = usePage<SharedData>().props;
    const showInventory = canManageInventory(auth.user?.roles);

    return (
        <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/70">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3.5">
                <Link href={route('home')} prefetch className="group mr-2 flex shrink-0 items-baseline gap-0.5">
                    <span className="font-serif text-xl font-semibold tracking-tight text-[#F0F0F8] transition-colors group-hover:text-white">
                        {name}
                    </span>
                    <span className="font-serif text-xl font-semibold text-[#F5A623]" aria-hidden>
                        .
                    </span>
                </Link>

                <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm font-medium">
                    <NavLink href={route('home')} icon={<ArrowLeft className="size-4 opacity-80" />}>
                        Inicio
                    </NavLink>
                    <NavLink href={route('catalog.index')}>Catálogo</NavLink>
                    <NavLink href={route('cart.index')}>Mi carrito</NavLink>
                    {showInventory ? (
                        <>
                            <NavLink href={route('catalog.inventory.index')} icon={<Boxes className="size-4 opacity-80" />}>
                                Inventario
                            </NavLink>
                            <NavLink href={route('crm.customers.index')} icon={<Users className="size-4 opacity-80" />}>
                                Clientes
                            </NavLink>
                        </>
                    ) : null}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <CartDrawer />
                    {auth.user ? (
                        <Button asChild variant="outline" size="sm" className="border-white/15 bg-white/[0.04] text-[#F0F0F8] hover:border-[#F5A623]/40 hover:bg-white/[0.07] hover:text-white">
                            <Link href={route('dashboard')} prefetch>
                                Mi cuenta
                            </Link>
                        </Button>
                    ) : (
                        <Button asChild size="sm" className="bg-[#F5A623] font-semibold text-black shadow-none hover:bg-[#FFBE4D] hover:shadow-[var(--lux-glow)] active:scale-95">
                            <Link href={route('login')} prefetch>
                                Ingresar
                            </Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}

function NavLink({ href, children, icon }: { href: string; children: ReactNode; icon?: ReactNode }) {
    return (
        <Link
            href={href}
            prefetch
            className={cn(
                'text-muted-foreground hover:text-foreground group relative inline-flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
            )}
        >
            {icon}
            <span className="relative">
                {children}
                <span
                    className="bg-[#F5A623] absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-300 ease-out group-hover:w-full"
                    aria-hidden
                />
            </span>
        </Link>
    );
}
