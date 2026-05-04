import AppLogoIcon from '@/components/app-logo-icon';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

interface AuthLayoutProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: AuthLayoutProps) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid min-h-dvh flex-col lg:grid-cols-2">
            <div className="relative hidden flex-col justify-between overflow-hidden p-10 text-[#F0F0F8] lg:flex">
                <div
                    className="absolute inset-0 bg-[#0A0A0F]"
                    style={{
                        backgroundImage: `
              radial-gradient(ellipse 100% 80% at 20% 20%, rgba(245, 166, 35, 0.14) 0%, transparent 55%),
              radial-gradient(ellipse 80% 60% at 90% 80%, rgba(245, 166, 35, 0.08) 0%, transparent 50%),
              url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")
            `,
                    }}
                />
                <div className="relative z-10">
                    <Link href={route('home')} className="inline-flex items-center gap-2 text-[#F0F0F8] transition hover:text-white">
                        <AppLogoIcon className="size-9 shrink-0 fill-current text-[#F5A623]" />
                        <span className="font-serif text-xl font-semibold tracking-tight">
                            {name}
                            <span className="text-[#F5A623]">.</span>
                        </span>
                    </Link>
                    <div className="mt-16 max-w-md">
                        <p className="text-[#F5A623]/90 mb-3 text-xs font-semibold uppercase tracking-[0.28em]">Commerce premium</p>
                        <h2 className="font-serif text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
                            Experiencias de compra memorables.
                        </h2>
                        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                            Accede a tu cuenta para continuar con pedidos, cupones y seguimiento en tiempo real.
                        </p>
                    </div>
                </div>
                {quote ? (
                    <blockquote className="relative z-10 mt-auto border-l-2 border-[#F5A623]/50 pl-4">
                        <p className="font-serif text-lg italic text-[#F0F0F8]/95">&ldquo;{quote.message}&rdquo;</p>
                        <footer className="text-muted-foreground mt-2 text-sm">{quote.author}</footer>
                    </blockquote>
                ) : null}
            </div>

            <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
                <div className="mx-auto w-full max-w-[400px]">
                    <Link href={route('home')} className="mb-8 flex items-center justify-center gap-2 lg:hidden">
                        <AppLogoIcon className="size-10 fill-current text-[#F5A623]" />
                        <span className="font-serif text-xl font-semibold text-[#F0F0F8]">
                            {name}
                            <span className="text-[#F5A623]">.</span>
                        </span>
                    </Link>
                    <div className="mb-8 flex flex-col gap-2 text-left">
                        <h1 className="font-serif text-2xl font-semibold tracking-tight text-[#F0F0F8] md:text-3xl">{title}</h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
