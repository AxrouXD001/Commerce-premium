<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? [...$user->toArray(), 'roles' => $user->getRoleNames()->values()->all()] : null,
            ],
            'inventory_socket' => [
                'client_url' => $this->inventorySocketClientUrlForRequest($request),
            ],
        ]);
    }

    /**
     * No exponer al front una URL de Socket.IO en loopback (127.0.0.1) cuando el sitio
     * se sirve en otro host (p. ej. IP pública en EC2): el navegador no puede conectar.
     */
    protected function inventorySocketClientUrlForRequest(Request $request): string
    {
        $raw = (string) config('services.inventory_socket.client_url', '');
        if ($raw === '') {
            return '';
        }

        $host = parse_url($raw, PHP_URL_HOST);
        if (! is_string($host) || $host === '') {
            return $raw;
        }

        $isLoopback = in_array(strtolower($host), ['localhost', '127.0.0.1', '[::1]'], true);
        $reqHost = strtolower($request->getHost());
        $requestIsLocal = in_array($reqHost, ['localhost', '127.0.0.1', '::1'], true);

        if ($isLoopback && ! $requestIsLocal) {
            return '';
        }

        return $raw;
    }
}
