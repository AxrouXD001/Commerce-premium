import http from 'node:http';

const port = Number.parseInt(process.env.PAYMENT_NOTIFY_PORT ?? '3999', 10);
const expectedToken = process.env.PAYMENT_NOTIFY_TOKEN ?? '';

const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/payments') {
        res.statusCode = 404;
        res.end();

        return;
    }

    const auth = req.headers.authorization ?? '';
    const bearer = expectedToken !== '' ? `Bearer ${expectedToken}` : '';

    if (expectedToken === '' || auth !== bearer) {
        res.statusCode = 401;
        res.end();

        return;
    }

    const chunks = [];

    req.on('data', (c) => chunks.push(c));

    req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');

        try {
            const body = raw === '' ? {} : JSON.parse(raw);
            console.log('[payment-notify]', new Date().toISOString(), body);
        } catch {
            console.warn('[payment-notify] JSON inválido', raw);
        }

        res.statusCode = 204;
        res.end();
    });
});

server.listen(port, () => {
    console.log(`payment notify listener on :${port} (POST /payments)`);
});
