// import { NavLink } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Package,
//   ShoppingCart,
//   Warehouse,
//   Truck,
//   BarChart3,
//   Settings,
//   ChevronLeft,
//   ChevronRight,
//   PanelRight,
//   BoxIcon,
// } from "lucide-react";
// import { useUIStore } from "@/stores/uiStore";
// import grozziielogo from "../../assets/Frame.jpg";

// const navItems = [
//   { to: "/", icon: LayoutDashboard, label: "Dashboard" },
//   { to: "/inventory", icon: Package, label: "Inventory" },
//   { to: "/orders", icon: ShoppingCart, label: "Orders" },
//   { to: "/warehouse", icon: Warehouse, label: "Warehouse" },
//   { to: "/suppliers", icon: Truck, label: "Suppliers" },
//   { to: "/reports", icon: BarChart3, label: "Reports" },
//   { to: "/settings", icon: Settings, label: "Settings" },
// ];

// export default function Sidebar() {
//   const { sidebarCollapsed, toggleSidebar } = useUIStore();

//   return (
//     <aside
//       className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300
//         bg-white text-gray-500 shadow-2xl
//         ${sidebarCollapsed ? "w-16" : "w-64"}`}
//     >
//       {/* Logo */}
//       <div className="flex items-center justify-between gap-3 px-4 py-5 border-b border-white/10">
//         {!sidebarCollapsed && (
//           <p className="font-display font-bold text-lg tracking-tight">
//             <img src={grozziielogo} alt="" />
//           </p>
//         )}
//         <div className="w-8 h-8  rounded-lg flex items-center justify-center flex-shrink-0">
//           <button
//             onClick={toggleSidebar}
//             className="w-full flex items-center justify-center p-2 rounded-lg
//             text-[#004368] hover:bg-white/10 hover:text-[#012539] transition-all"
//           >
//             {sidebarCollapsed ? (
//               <PanelRight size={18} />
//             ) : (
//               <PanelRight size={18} />
//             )}
//           </button>
//           <BoxIcon size={18} className="text-[#0D1B2A]" />
//         </div>
//       </div>
//       {/* Nav */}
//       <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
//         {navItems.map(({ to, icon: Icon, label }) => (
//           <NavLink
//             key={to}
//             to={to}
//             end={to === "/"}
//             className={({ isActive }) =>
//               `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
//               ${
//                 isActive
//                   ? "bg-[#004368] text-white font-semibold shadow"
//                   : "text-gray-400 hover:bg-white/10 hover:text-slate-600"
//               }`
//             }
//           >
//             <Icon size={18} className="flex-shrink-0" />
//             {!sidebarCollapsed && (
//               <span className="text-sm font-normal truncate">{label}</span>
//             )}
//           </NavLink>
//         ))}
//       </nav>
//     </aside>
//   );
// }

import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelRight,
  List,
  GitMerge,
  ClipboardList,
  RotateCcw,
  MapPin,
  Layers,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import grozziielogo from "../../assets/Frame.jpg";

// ── Nav config ─────────────────────────────────────────────────────────────
const navItems = [
  {
    label: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Product Management",
    icon: Package,
    children: [
      { label: "Product List", to: "/products/list", icon: List },
      { label: "Combine SKU", to: "/products/combine-sku", icon: GitMerge },
    ],
  },
  {
    label: "Inventory Management",
    icon: ClipboardList,
    children: [
      { label: "Stock Overview", to: "/inventory/overview", icon: Layers },
      {
        label: "Adjustments",
        to: "/inventory/adjustments",
        icon: SlidersHorizontal,
      },
      { label: "Returns", to: "/inventory/returns", icon: RotateCcw },
    ],
  },
  {
    label: "Order Management",
    icon: ShoppingCart,
    children: [
      { label: "All Orders", to: "/orders", icon: List },
      { label: "Returns", to: "/orders/returns", icon: RotateCcw },
    ],
  },
  {
    label: "Warehouse Management",
    to: "/warehouse",
    icon: Warehouse,
  },
  {
    label: "System Configuration",
    icon: Settings,
    children: [
      { label: "Locations", to: "/config/locations", icon: MapPin },
      { label: "Users", to: "/config/users", icon: Users },
    ],
  },
];

// ── NavItem ────────────────────────────────────────────────────────────────
function NavItem({ item, collapsed }) {
  const location = useLocation();

  // Check if any child route is active (to auto-expand parent)
  const isChildActive = item.children?.some((c) =>
    location.pathname.startsWith(c.to),
  );
  const [open, setOpen] = useState(isChildActive ?? false);

  // ── Leaf item (no children) ──
  if (!item.children) {
    return (
      <NavLink
        to={item.to}
        end={item.to === "/"}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
          ${
            isActive
              ? "bg-[#004368] text-white font-semibold"
              : "text-[#4A6380] hover:bg-[#EAF1F8] hover:text-[#004368]"
          }`
        }
      >
        <item.icon size={18} className="flex-shrink-0" />
        {!collapsed && <span className="text-sm truncate">{item.label}</span>}
      </NavLink>
    );
  }

  // ── Parent item (has children) ──
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        title={collapsed ? item.label : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150
          ${
            isChildActive
              ? "bg-[#004368] text-white font-semibold"
              : "text-[#4A6380] hover:bg-[#EAF1F8] hover:text-[#004368]"
          }`}
      >
        <item.icon size={18} className="flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="text-sm flex-1 text-left truncate">
              {item.label}
            </span>
            {open ? (
              <ChevronDown size={15} className="flex-shrink-0 opacity-70" />
            ) : (
              <ChevronRight size={15} className="flex-shrink-0 opacity-70" />
            )}
          </>
        )}
      </button>

      {/* Children — hidden when sidebar collapsed */}
      {!collapsed && open && (
        <div className="ml-4 mt-0.5 border-l-2 border-[#D0DEE8] pl-3 space-y-0.5">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-all duration-150
                ${
                  isActive
                    ? "text-[#004368] font-semibold bg-[#EAF1F8]"
                    : "text-[#6B8299] hover:text-[#004368] hover:bg-[#EAF1F8]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active dot indicator */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all
                      ${isActive ? "bg-[#004368]" : "bg-transparent"}`}
                  />
                  {child.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300
        bg-white border-r border-[#E2E8F0] shadow-sm
        ${sidebarCollapsed ? "w-16" : "w-64"}`}
    >
      {/* ── Logo row ── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[#E2E8F0]">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-1">
            <img src={grozziielogo} alt="Grozziie" className="h-7 w-auto" />
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={`flex items-center justify-center w-8 h-8 rounded-lg
            text-[#004368] hover:bg-[#EAF1F8] transition-all flex-shrink-0
            ${sidebarCollapsed ? "mx-auto" : ""}`}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelRight size={18} />
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavItem key={item.label} item={item} collapsed={sidebarCollapsed} />
        ))}
      </nav>
    </aside>
  );
}
