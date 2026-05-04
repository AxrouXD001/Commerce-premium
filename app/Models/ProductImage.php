<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProductImage extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'product_id',
        'disk',
        'path',
        'alt_text',
        'sort_order',
    ];

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * URL servida bajo /storage/... (enlace simbólico public/storage).
     * Ruta relativa al origen: evita depender de APP_URL (p. ej. localhost en EC2) y carga en el mismo host.
     * Otros discos (S3, etc.) siguen usando la URL del driver.
     */
    public function getUrlAttribute(): string
    {
        if ($this->disk === 'public') {
            $path = ltrim(str_replace('\\', '/', $this->path), '/');

            return '/storage/'.$path;
        }

        return Storage::disk($this->disk)->url($this->path);
    }

    /**
     * URL absoluta (p. ej. búsqueda externa, PDF). Usa APP_URL; en producción debe ser el dominio o IP real.
     */
    public function absoluteUrl(): string
    {
        $u = $this->url;
        if (str_starts_with($u, 'http://') || str_starts_with($u, 'https://')) {
            return $u;
        }

        return rtrim((string) config('app.url'), '/').$u;
    }
}
