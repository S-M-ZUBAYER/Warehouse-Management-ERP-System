import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
    persist(
        (set) => ({
            sidebarCollapsed: false,
            theme: 'light',
            activeModal: null,

            toggleSidebar: () =>
                set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
            setTheme: (theme) => set({ theme }),
            openModal: (name) => set({ activeModal: name }),
            closeModal: () => set({ activeModal: null }),
        }),
        { name: 'ui-store' }
    )
)