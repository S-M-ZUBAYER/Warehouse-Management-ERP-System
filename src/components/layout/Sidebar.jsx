import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Truck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  PanelRight,
  BoxIcon,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import grozziielogo from "../../assets/Frame.jpg";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/orders", icon: ShoppingCart, label: "Orders" },
  { to: "/warehouse", icon: Warehouse, label: "Warehouse" },
  { to: "/suppliers", icon: Truck, label: "Suppliers" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300
        bg-white text-gray-500 shadow-2xl
        ${sidebarCollapsed ? "w-16" : "w-64"}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between gap-3 px-4 py-5 border-b border-white/10">
        {!sidebarCollapsed && (
          <p className="font-display font-bold text-lg tracking-tight">
            <img src={grozziielogo} alt="" />
          </p>
        )}
        <div className="w-8 h-8  rounded-lg flex items-center justify-center flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-lg
            text-[#004368] hover:bg-white/10 hover:text-[#012539] transition-all"
          >
            {sidebarCollapsed ? (
              <PanelRight size={18} />
            ) : (
              <PanelRight size={18} />
            )}
          </button>
          <BoxIcon size={18} className="text-[#0D1B2A]" />
        </div>
      </div>
      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
              ${
                isActive
                  ? "bg-[#004368] text-white font-semibold shadow"
                  : "text-gray-400 hover:bg-white/10 hover:text-slate-600"
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-normal truncate">{label}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
