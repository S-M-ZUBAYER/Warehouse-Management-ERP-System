import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useUIStore } from '@/stores/uiStore';
import { useWorkspaceTabsStore } from '@/stores/workspaceTabsStore';
import { useInitShopPlatform } from '../../stores/useInitShopPlatform';
import FloatingAiChatbot from '../shared/FloatingAiChatbot';
import WorkspaceTabs from './WorkspaceTabs';

export default function AppShell() {
    const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
    const location = useLocation();
    const tabs = useWorkspaceTabsStore((s) => s.tabs);
    const activeRouteId = `${location.pathname === '/warehouse_management/' ? '/warehouse_management' : location.pathname}${location.search || ''}`;
    const activeTab = tabs.find((tab) => tab.id === activeRouteId);
    const outletKey = `${activeRouteId}:${activeTab?.reloadKey || 0}`;

    // Keep shared dropdown data initialized for pages that use store/platform filters.
    // The duplicate global navbar is intentionally removed from the layout.
    useInitShopPlatform();

    return (
        <div className="flex h-screen bg-[#EFEFEF] overflow-hidden font-body">
            <Sidebar />
            <div
                className={`flex flex-col flex-1 transition-all duration-300 overflow-hidden ${
                    sidebarCollapsed ? 'ml-16' : 'ml-80'
                }`}
            >
                <main className="flex-1 overflow-y-auto p-6 font-body">
                    <WorkspaceTabs />
                    <Outlet key={outletKey} />
                </main>
                <FloatingAiChatbot />
            </div>
        </div>
    );
}
