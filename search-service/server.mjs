/**
 * Servicio Node ligero para búsqueda de productos (Fase 2.2).
 * Índice en memoria sincronizado vía Laravel (POST /internal/products).
 * Variables: PORT (default 3030), SEARCH_SYNC_TOKEN (opcional, Bearer para /internal).
 */
import http from 'node:http';

const PORT = Number(process.env.PORT) || 3030;
const TOKEN = process.env.SEARCH_SYNC_TOKEN || '';
const indexById = new Map();

function sendJson(res, status, body) {
    const data = JSON.stringify(body);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
    });
    res.end(data);
}

function unauthorized(res) {
    sendJson(res, 401, { message: 'Unauthorized' });
}

function checkInternal(req, res) {
    if (!TOKEN) {
        return true;
    }
    const raw = req.headers.authorization || '';
    const expected = `Bearer ${TOKEN}`;

    return raw === expected;
}

function tokenize(text) {
    return String(text || '')
        .toLowerCase()
        .split(/[^a-z0-9áéíóúñ]+/)
        .filter(Boolean);
}

function matchesQuery(doc, q) {
    if (!q || !String(q).trim()) {
        return true;
    }
    const needles = tokenize(q);
    if (needles.length === 0) {
        return true;
    }

    const hay = [
        doc.name,
        doc.slug,
        doc.sku,
        doc.description,
        doc.category_name,
        ...(doc.variants ?? []).map((v) => `${v.name} ${v.sku}`),
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return needles.every((n) => hay.includes(n));
}

function facetsFrom(ids) {
    const map = new Map();
    for (const id of ids) {
        const doc = indexById.get(id);
        if (!doc || doc.deleted_at) {
            continue;
        }
        if (!doc.is_active) {
            continue;
        }
        const cid = doc.category_id;
        const name = doc.category_name ?? 'Sin categoría';
        map.set(cid ?? `null:${name}`, { id: cid, name });
    }

    const categories = [];
    for (const [, v] of map) {
        categories.push({
            id: v.id,
            name: v.name,
            active_products_count: [...indexById.values()].filter(
                (d) => d.category_id === v.id && d.is_active && !d.deleted_at,
            ).length,
        });
    }
    categories.sort((a, b) => String(a.name).localeCompare(String(b.name)));

    return { categories };
}

function runSearch(params) {
    const q = params.get('q') || '';
    const categoryId = params.get('category_id');
    const minPrice = params.get('min_price');
    const maxPrice = params.get('max_price');
    const sort = params.get('sort') || 'latest';
    const perPage = Math.min(Math.max(Number(params.get('per_page')) || 12, 1), 50);
    const page = Math.max(Number(params.get('page')) || 1, 1);

    let rows = [...indexById.values()].filter((d) => !d.deleted_at && d.is_active);

    if (categoryId) {
        rows = rows.filter((d) => String(d.category_id) === String(categoryId));
    }
    if (minPrice !== null && minPrice !== '') {
        rows = rows.filter((d) => Number(d.price) >= Number(minPrice));
    }
    if (maxPrice !== null && maxPrice !== '') {
        rows = rows.filter((d) => Number(d.price) <= Number(maxPrice));
    }
    rows = rows.filter((d) => matchesQuery(d, q));

    rows.sort((a, b) => {
        if (sort === 'price_asc') {
            return Number(a.price) - Number(b.price);
        }
        if (sort === 'price_desc') {
            return Number(b.price) - Number(a.price);
        }
        if (sort === 'name') {
            return String(a.name).localeCompare(String(b.name));
        }
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    });

    const total = rows.length;
    const lastPage = Math.max(1, Math.ceil(total / perPage));
    const currentPage = Math.min(page, lastPage);
    const start = (currentPage - 1) * perPage;
    const pageRows = rows.slice(start, start + perPage).map((d) => ({
        ...d,
        images: (d.image_urls || []).map((url) => ({ url })),
        category:
            d.category_id != null
                ? { id: d.category_id, name: d.category_name ?? '', slug: d.category_slug ?? '' }
                : null,
    }));

    const allIds = rows.map((r) => r.id);

    return {
        data: pageRows,
        facets: facetsFrom(allIds),
        meta: {
            current_page: currentPage,
            from: total === 0 ? null : start + 1,
            last_page: lastPage,
            per_page: perPage,
            to: Math.min(start + perPage, total),
            total,
        },
    };
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    const method = req.method || 'GET';

    if (method === 'GET' && url.pathname === '/health') {
        sendJson(res, 200, { ok: true });
        return;
    }

    if (method === 'GET' && url.pathname === '/search') {
        const result = runSearch(url.searchParams);
        sendJson(res, 200, result);
        return;
    }

    if (method === 'POST' && url.pathname === '/internal/products') {
        if (!checkInternal(req, res)) {
            unauthorized(res);
            return;
        }

        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                const id = payload.id;
                if (!id) {
                    sendJson(res, 400, { message: 'Missing id' });
                    return;
                }
                indexById.set(Number(id), {
                    ...payload,
                    id: Number(id),
                    updated_at: new Date().toISOString(),
                });
                sendJson(res, 200, { ok: true });
            } catch {
                sendJson(res, 400, { message: 'Invalid JSON' });
            }
        });
        return;
    }

    if (method === 'DELETE' && url.pathname.startsWith('/internal/products/')) {
        if (!checkInternal(req, res)) {
            unauthorized(res);
            return;
        }
        const rawId = url.pathname.split('/').pop();
        const id = Number(rawId);
        indexById.delete(id);
        res.writeHead(204);
        res.end();
        return;
    }

    sendJson(res, 404, { message: 'Not found' });
});

server.listen(PORT, () => {
    console.log(`search-service listening on :${PORT}`);
});
