<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\Inventory\InventoryLedgerService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class CatalogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ledger = app(InventoryLedgerService::class);

        $placeholderPath = 'catalog-seed/product-placeholder.png';
        if (! Storage::disk('public')->exists($placeholderPath)) {
            $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', true);
            if ($png !== false) {
                Storage::disk('public')->put($placeholderPath, $png);
            }
        }

        $categoryRows = [
            ['name' => 'Electrónicos', 'slug' => 'electronicos', 'position' => 0],
            ['name' => 'Hogar', 'slug' => 'hogar', 'position' => 1],
            ['name' => 'Oficina', 'slug' => 'oficina', 'position' => 2],
        ];

        $categories = [];
        foreach ($categoryRows as $row) {
            $categories[$row['slug']] = Category::query()->updateOrCreate(
                ['slug' => $row['slug']],
                [
                    'name' => $row['name'],
                    'position' => $row['position'],
                    'is_active' => true,
                ],
            );
        }

        $products = [
            [
                'slug' => 'laptop-ejemplo',
                'category' => 'electronicos',
                'sku' => 'LAP-001',
                'name' => 'Laptop ejemplo',
                'description' => 'Equipo de demostración para el catálogo, ideal para desarrollo y oficina.',
                'price' => 1299.99,
                'compare_at_price' => 1499.99,
                'stock' => 12,
            ],
            [
                'slug' => 'monitor-ips-27',
                'category' => 'electronicos',
                'sku' => 'MON-027',
                'name' => 'Monitor IPS 27"',
                'description' => 'Panel IPS, resolución QHD, marco fino y buena reproducción de color.',
                'price' => 459.00,
                'compare_at_price' => 529.00,
                'stock' => 18,
            ],
            [
                'slug' => 'teclado-mecanico',
                'category' => 'electronicos',
                'sku' => 'TEC-M01',
                'name' => 'Teclado mecánico',
                'description' => 'Switches táctiles, retroiluminación y diseño compacto.',
                'price' => 119.90,
                'compare_at_price' => null,
                'stock' => 40,
            ],
            [
                'slug' => 'raton-inalambrico',
                'category' => 'electronicos',
                'sku' => 'RAT-W01',
                'name' => 'Ratón inalámbrico',
                'description' => 'Sensor óptico de alta precisión, batería de larga duración.',
                'price' => 39.50,
                'compare_at_price' => 49.50,
                'stock' => 65,
            ],
            [
                'slug' => 'auriculares-bluetooth',
                'category' => 'electronicos',
                'sku' => 'AUR-BT1',
                'name' => 'Auriculares Bluetooth',
                'description' => 'Cancelación de ruido activa y estuche de carga.',
                'price' => 189.00,
                'compare_at_price' => 229.00,
                'stock' => 22,
            ],
            [
                'slug' => 'altavoz-portatil',
                'category' => 'electronicos',
                'sku' => 'ALT-P01',
                'name' => 'Altavoz portátil',
                'description' => 'Resistente al agua IPX7 y hasta 12 horas de autonomía.',
                'price' => 79.99,
                'compare_at_price' => null,
                'stock' => 30,
            ],
            [
                'slug' => 'tablet-10-pulgadas',
                'category' => 'electronicos',
                'sku' => 'TAB-100',
                'name' => 'Tablet 10 pulgadas',
                'description' => 'Pantalla Full HD, almacenamiento ampliable y Wi‑Fi dual band.',
                'price' => 249.00,
                'compare_at_price' => 299.00,
                'stock' => 14,
            ],
            [
                'slug' => 'escritorio-madera',
                'category' => 'hogar',
                'sku' => 'HOG-001',
                'name' => 'Escritorio madera',
                'description' => 'Escritorio compacto con acabado natural y cajón lateral.',
                'price' => 320.50,
                'compare_at_price' => null,
                'stock' => 4,
            ],
            [
                'slug' => 'lampara-led-escritorio',
                'category' => 'hogar',
                'sku' => 'HOG-L01',
                'name' => 'Lámpara LED de escritorio',
                'description' => 'Temperatura de color regulable y brazo articulado.',
                'price' => 45.00,
                'compare_at_price' => 59.00,
                'stock' => 50,
            ],
            [
                'slug' => 'sillon-ergonomico',
                'category' => 'hogar',
                'sku' => 'HOG-S01',
                'name' => 'Sillón ergonómico',
                'description' => 'Soporte lumbar, reclinación y reposabrazos ajustables.',
                'price' => 389.00,
                'compare_at_price' => 449.00,
                'stock' => 8,
            ],
            [
                'slug' => 'estanteria-modular',
                'category' => 'hogar',
                'sku' => 'HOG-E01',
                'name' => 'Estantería modular',
                'description' => 'Cinco niveles, fácil montaje y carga homogénea.',
                'price' => 95.00,
                'compare_at_price' => null,
                'stock' => 16,
            ],
            [
                'slug' => 'alfombra-salon',
                'category' => 'hogar',
                'sku' => 'HOG-A01',
                'name' => 'Alfombra de salón',
                'description' => 'Textura suave, antideslizante y fácil de aspirar.',
                'price' => 72.00,
                'compare_at_price' => 89.00,
                'stock' => 11,
            ],
            [
                'slug' => 'pack-cuadernos-a4',
                'category' => 'oficina',
                'sku' => 'OFI-CA4',
                'name' => 'Pack cuadernos A4',
                'description' => 'Pack de 5 cuadernos con tapa dura y espiral reforzada.',
                'price' => 24.90,
                'compare_at_price' => null,
                'stock' => 120,
            ],
            [
                'slug' => 'grapadora-metalica',
                'category' => 'oficina',
                'sku' => 'OFI-G01',
                'name' => 'Grapadora metálica',
                'description' => 'Capacidad hasta 25 hojas, acabado antideslizante.',
                'price' => 16.50,
                'compare_at_price' => null,
                'stock' => 80,
            ],
            [
                'slug' => 'bloc-notas-adhesivas',
                'category' => 'oficina',
                'sku' => 'OFI-N01',
                'name' => 'Bloc de notas adhesivas',
                'description' => 'Varios tamaños y colores en un solo pack.',
                'price' => 8.90,
                'compare_at_price' => null,
                'stock' => 200,
            ],
            [
                'slug' => 'soporte-laptop-aluminio',
                'category' => 'oficina',
                'sku' => 'OFI-S01',
                'name' => 'Soporte para laptop de aluminio',
                'description' => 'Eleva la pantalla a altura ergonómica y mejora la ventilación.',
                'price' => 54.00,
                'compare_at_price' => 64.00,
                'stock' => 35,
            ],
        ];

        foreach ($products as $row) {
            $category = $categories[$row['category']];

            $product = Product::query()->updateOrCreate(
                ['slug' => $row['slug']],
                [
                    'category_id' => $category->id,
                    'name' => $row['name'],
                    'sku' => $row['sku'],
                    'description' => $row['description'],
                    'price' => $row['price'],
                    'compare_at_price' => $row['compare_at_price'] ?? null,
                    'stock' => $row['stock'],
                    'is_active' => true,
                ],
            );

            if (Storage::disk('public')->exists($placeholderPath)) {
                ProductImage::query()->updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'sort_order' => 0,
                    ],
                    [
                        'disk' => 'public',
                        'path' => $placeholderPath,
                        'alt_text' => $row['name'],
                    ],
                );
            }

            $ledger->syncOnHandFromCatalogProduct($product->fresh(['variants']));
        }
    }
}
