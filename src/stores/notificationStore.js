import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (notification) =>
        set((s) => ({
            notifications: [{ id: Date.now(), read: false, ...notification }, ...s.notifications],
            unreadCount: s.unreadCount + 1,
        })),
    markAllRead: () =>
        set((s) => ({
            notifications: s.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        })),
    clearAll: () => set({ notifications: [], unreadCount: 0 }),
}))