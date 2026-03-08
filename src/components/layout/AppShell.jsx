import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useUIStore } from "@/stores/uiStore";

export default function AppShell() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen bg-[#EFEFEF] overflow-hidden">
      <Sidebar />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 overflow-hidden ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* <Topbar /> */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
