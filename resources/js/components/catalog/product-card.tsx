import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { ProductDto } from '@/types/catalog';
import { Link } from '@inertiajs/react';

interface ProductCardProps {
    product: ProductDto;
}

export function ProductCard({ product }: ProductCardProps) {
    const preview = product.images[0]?.url;
    const price = Number(product.price);
    const compare = product.compare_at_price != null ? Number(product.compare_at_price) : null;
    const discountPct =
        compare != null && compare > price && compare > 0 ? Math.round(((compare - price) / compare) * 100) : null;

    return (
        <article
            className={cn(
                'group text-card-foreground overflow-hidden rounded-2xl border border-[#2A2A3A] bg-[#111118] transition-all duration-300',
                'ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:border-[#F5A623]/30 hover:shadow-lg',
            )}
        >
            <Link href={route('catalog.show', product.slug)} className="block">
                <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
                    {preview ? (
                        <img
                            src={preview}
                            alt=""
                            className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                        />
                    ) : (
                        <div className="text-muted-foreground flex size-full items-center justify-center bg-white/[0.02] text-sm">Sin imagen</div>
                    )}
                    {discountPct != null && discountPct > 0 ? (
                        <Badge variant="luxury" className="absolute top-3 right-3 shadow-none">
                            −{discountPct}%
                        </Badge>
                    ) : null}
                </div>
                <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 font-medium leading-snug text-[#F0F0F8] transition group-hover:text-white">{product.name}</h3>
                    {product.category ? <p className="text-muted-foreground text-xs uppercase tracking-wider">{product.category.name}</p> : null}
                    <div className="flex flex-wrap items-baseline gap-2 pt-1">
                        <p className="font-mono text-lg font-bold text-[#F5A623]">{formatMoney(product.price)}</p>
                        {compare != null && compare > price ? (
                            <p className="text-muted-foreground font-mono text-sm line-through opacity-80">{formatMoney(product.compare_at_price!)}</p>
                        ) : null}
                    </div>
                </div>
            </Link>
        </article>
    );
}
