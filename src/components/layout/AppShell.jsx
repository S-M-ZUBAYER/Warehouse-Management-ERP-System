import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUIStore } from '@/stores/uiStore';
import { useInitShopPlatform } from '../../stores/useInitShopPlatform';

export default function AppShell() {
    const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

    // Keep shared dropdown data initialized for pages that use store/platform filters.
    // The duplicate global navbar is intentionally removed from the layout.
    useInitShopPlatform();

    return (
        <div className="flex h-screen bg-[#EFEFEF] overflow-hidden">
            <Sidebar />
            <div
                className={`flex flex-col flex-1 transition-all duration-300 overflow-hidden ${
                    sidebarCollapsed ? 'ml-16' : 'ml-80'
                }`}
            >
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
