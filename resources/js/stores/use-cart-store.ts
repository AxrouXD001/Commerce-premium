import { create } from 'zustand';

type CartDrawerState = {
    drawerOpen: boolean;
    toggleDrawer: () => void;
    openDrawer: () => void;
    closeDrawer: () => void;
};

/**
 * Estado de UI para el lateral del carrito. El catálogo y totales siguen siendo servidor (React Query + API).
 */
export const useCartStore = create<CartDrawerState>((set) => ({
    drawerOpen: false,
    toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
    openDrawer: () => set({ drawerOpen: true }),
    closeDrawer: () => set({ drawerOpen: false }),
}));
