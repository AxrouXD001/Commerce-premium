import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CategoryDto, ProductDto, ProductImageDto } from '@/types/catalog';
import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Trash } from 'lucide-react';
import { useEffect } from 'react';

interface VariantRow {
    name: string;
    sku: string;
    price_adjustment: string;
    stock: number;
}

interface ProductFormProps {
    categories: CategoryDto[];
    product?: ProductDto | null;
}

function defaultVariants(product?: ProductDto | null): VariantRow[] {
    if (product?.variants?.length) {
        return product.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            price_adjustment: String(v.price_adjustment ?? 0),
            stock: Number(v.stock ?? 0),
        }));
    }

    return [];
}

export default function ProductForm({ categories, product }: ProductFormProps) {
    const isEdit = Boolean(product);

    const form = useForm({
        name: product?.name ?? '',
        slug: product?.slug ?? '',
        sku: product?.sku ?? '',
        category_id: product?.category_id != null ? String(product.category_id) : '',
        description: product?.description ?? '',
        price: String(product?.price ?? ''),
        compare_at_price: product?.compare_at_price != null ? String(product.compare_at_price) : '',
        stock: String(product?.stock ?? 0),
        is_active: Boolean(product?.is_active ?? true),
        variants: defaultVariants(product),
        delete_image_ids: [] as number[],
        images: [] as File[],
    });

    useEffect(() => {
        form.transform((data) => ({
            ...data,
            variants: data.variants.filter((r) => r.name.trim() !== '' && r.sku.trim() !== ''),
            // PHP no rellena $_FILES en PUT multipart; Laravel espera POST + _method (spoof).
            ...(isEdit ? { _method: 'put' as const } : {}),
        }));
        // Intentionally once per mount — transform runs only on submit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEdit]);

    const toggleDeleteImage = (id: number, checked: boolean): void => {
        const set = new Set(form.data.delete_image_ids);
        if (checked) {
            set.add(id);
        } else {
            set.delete(id);
        }
        form.setData('delete_image_ids', [...set]);
    };

    const submit = (e: React.FormEvent): void => {
        e.preventDefault();

        if (isEdit && product) {
            form.post(route('catalog.products.update', product.slug), { forceFormData: true });

            return;
        }

        form.post(route('catalog.products.store'), { forceFormData: true });
    };

    const updateVariant = (index: number, field: keyof VariantRow, value: string | number): void => {
        const next = [...form.data.variants];
        next[index] = { ...next[index], [field]: value };
        form.setData('variants', next);
    };

    const addVariant = (): void => {
        form.setData('variants', [
            ...form.data.variants,
            { name: '', sku: '', price_adjustment: '0', stock: 0 },
        ]);
    };

    const removeVariant = (index: number): void => {
        form.setData(
            'variants',
            form.data.variants.filter((_, i) => i !== index),
        );
    };

    return (
        <>
            <Head title={isEdit ? 'Editar producto' : 'Nuevo producto'} />
            <div className="bg-background mx-auto max-w-3xl px-4 py-8">
                <Button variant="outline" size="sm" asChild className="mb-6">
                    <Link href={route('catalog.index')}>← Volver al catálogo</Link>
                </Button>

                <h1 className="mb-6 text-2xl font-semibold">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h1>

                <form className="space-y-6" onSubmit={submit}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                            <FieldError message={form.errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (opcional)</Label>
                            <Input id="slug" value={form.data.slug} onChange={(e) => form.setData('slug', e.target.value)} placeholder="auto desde nombre" />
                            <FieldError message={form.errors.slug} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sku">SKU</Label>
                            <Input id="sku" value={form.data.sku} onChange={(e) => form.setData('sku', e.target.value)} required />
                            <FieldError message={form.errors.sku} />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="category_id">Categoría</Label>
                            <select
                                id="category_id"
                                className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm shadow-sm"
                                value={form.data.category_id}
                                onChange={(e) => form.setData('category_id', e.target.value)}
                            >
                                <option value="">—</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            <FieldError message={form.errors.category_id} />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="description">Descripción</Label>
                            <textarea
                                id="description"
                                className="border-input bg-background min-h-28 w-full rounded-md border px-3 py-2 text-sm shadow-sm"
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                            <FieldError message={form.errors.description} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="price">Precio</Label>
                            <Input id="price" type="number" step="0.01" min="0" value={form.data.price} onChange={(e) => form.setData('price', e.target.value)} required />
                            <FieldError message={form.errors.price} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="compare_at_price">Precio comparación</Label>
                            <Input
                                id="compare_at_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.compare_at_price}
                                onChange={(e) => form.setData('compare_at_price', e.target.value)}
                            />
                            <FieldError message={form.errors.compare_at_price} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock</Label>
                            <Input id="stock" type="number" min="0" value={form.data.stock} onChange={(e) => form.setData('stock', e.target.value)} required />
                            <FieldError message={form.errors.stock} />
                        </div>
                        <label className="flex items-center gap-2 text-sm sm:col-span-2">
                            <Checkbox checked={form.data.is_active} onCheckedChange={(v) => form.setData('is_active', v === true)} id="is_active" />
                            Producto activo
                        </label>
                    </div>

                    {product?.images?.length ? (
                        <div>
                            <Label className="mb-2 block">Quitar imágenes</Label>
                            <ul className="space-y-2">
                                {product.images.map((img: ProductImageDto) =>
                                    img.id != null ? (
                                        <li key={img.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox id={`del-${img.id}`} onCheckedChange={(v) => toggleDeleteImage(img.id!, v === true)} />
                                            <Label htmlFor={`del-${img.id}`} className="font-normal">
                                                Imagen #{img.id}
                                            </Label>
                                        </li>
                                    ) : null,
                                )}
                            </ul>
                            <FieldError message={form.errors.delete_image_ids as string} />
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <Label htmlFor="images">{isEdit ? 'Añadir imágenes' : 'Imágenes'}</Label>
                        <Input
                            id="images"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => form.setData('images', e.target.files ? Array.from(e.target.files) : [])}
                        />
                        <FieldError message={form.errors.images as string} />
                    </div>

                    <div className="space-y-3 rounded-xl border p-4">
                        <div className="flex items-center justify-between">
                            <Label>Variantes</Label>
                            <Button type="button" size="sm" variant="secondary" onClick={addVariant}>
                                <Plus className="mr-1 size-4" /> Añadir variante
                            </Button>
                        </div>
                        {form.errors.variants ? <p className="text-destructive text-sm">{form.errors.variants}</p> : null}
                        <div className="space-y-4">
                            {form.data.variants.map((row, index) => (
                                <div key={index} className="bg-muted/40 grid gap-2 rounded-lg border p-3 md:grid-cols-4 md:items-end">
                                    <div className="space-y-1 md:col-span-1">
                                        <Label className="text-xs">Nombre</Label>
                                        <Input value={row.name} onChange={(e) => updateVariant(index, 'name', e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">SKU variante</Label>
                                        <Input value={row.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Ajuste precio</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={row.price_adjustment}
                                            onChange={(e) => updateVariant(index, 'price_adjustment', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Stock</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={row.stock}
                                                onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="mt-5"
                                            onClick={() => removeVariant(index)}
                                        >
                                            <Trash className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Guardando…' : 'Guardar'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={route('catalog.index')}>Cancelar</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return <p className="text-destructive text-sm">{message}</p>;
}
