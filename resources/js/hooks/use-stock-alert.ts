import type { SharedData } from '@/types/index';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

export type StockAlertMessage = {
    id: string;
    title: string;
    body: string;
    tone: 'warning' | 'danger';
};

function canUseInventorySocket(roles?: string[]): boolean {
    if (!roles) {
        return false;
    }

    return roles.some((r) => r === 'admin' || r === 'vendedor');
}

/** Evita conectar a ws://127.0.0.1 desde una página servida en IP/dominio público. */
function clientUrlMatchesPageOrigin(clientUrl: string): boolean {
    if (typeof window === 'undefined') {
        return true;
    }

    try {
        const { hostname } = new URL(clientUrl, window.location.origin);
        const loopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
        if (!loopback) {
            return true;
        }

        const h = window.location.hostname;

        return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
    } catch {
        return false;
    }
}

export function useStockAlert() {
    const { auth, inventory_socket } = usePage<SharedData>().props;
    const clientUrl = typeof inventory_socket === 'object' && inventory_socket !== null && 'client_url' in inventory_socket
        ? String((inventory_socket as { client_url?: string }).client_url ?? '').trim()
        : '';

    const enabled = clientUrl !== '' && canUseInventorySocket(auth.user?.roles) && clientUrlMatchesPageOrigin(clientUrl);
    const [messages, setMessages] = useState<StockAlertMessage[]>([]);
    const socketRef = useRef<Socket | null>(null);

    const dismiss = useCallback((id: string) => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
    }, []);

    const push = useCallback((msg: Omit<StockAlertMessage, 'id'>) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setMessages((prev) => [{ id, ...msg }, ...prev].slice(0, 8));
    }, []);

    const stableUrl = useMemo(() => clientUrl, [clientUrl]);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        const socket = io(stableUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 8,
            reconnectionDelay: 1500,
        });

        socketRef.current = socket;

        socket.on('inventory:stock', (payload: { product_id?: number; available?: number }) => {
            const pid = payload?.product_id ?? '?';
            const av = payload?.available ?? '?';
            push({
                title: 'Stock actualizado',
                body: `Producto #${pid} — disponible: ${av}`,
                tone: typeof payload?.available === 'number' && payload.available <= 5 ? 'danger' : 'warning',
            });
        });

        socket.on('inventory:low_stock', (payload: { lines?: { product_id: number; available: number; reorder_point: number }[] }) => {
            const lines = payload?.lines ?? [];
            if (lines.length === 0) {
                return;
            }

            push({
                title: 'Alerta de inventario',
                body: `${lines.length} línea(s) en o por debajo del punto de reorden.`,
                tone: 'danger',
            });
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [enabled, push, stableUrl]);

    return { messages, dismiss, enabled };
}
