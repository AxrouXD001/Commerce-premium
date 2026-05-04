import http from 'node:http';
import { Server } from 'socket.io';

const port = Number.parseInt(process.env.INVENTORY_SOCKET_PORT ?? '4010', 10);
const expectedToken = process.env.INVENTORY_SOCKET_TOKEN ?? '';

const httpServer = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/emit') {
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
        try {
            const raw = Buffer.concat(chunks).toString('utf8');
            const body = raw === '' ? {} : JSON.parse(raw);
            const bodyObj = typeof body === 'object' && body !== null ? body : {};
            const eventName = typeof bodyObj.event === 'string' ? bodyObj.event : 'inventory:stock';
            const payload = { ...bodyObj };
            delete payload.event;
            io.to('admin').emit(eventName, payload);
            res.statusCode = 204;
            res.end();
        } catch {
            res.statusCode = 400;
            res.end('invalid json');
        }
    });
});

const io = new Server(httpServer, {
    cors: { origin: true },
});

io.on('connection', (socket) => {
    socket.join('admin');
});

httpServer.listen(port, () => {
    console.log(`inventory socket + emit API on :${port} (POST /emit, Socket.IO /)`);
});
