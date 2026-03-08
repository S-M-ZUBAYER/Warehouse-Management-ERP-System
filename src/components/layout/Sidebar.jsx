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
  FileText,
  AlertCircle,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import grozziielogo from "../../assets/Frame.jpg";

// ── Nav config (supports infinite nesting) ────────────────────────────────
const navItems = [
  {
    label: "Dashboard",
    to: "/warehouse_management",
    icon: LayoutDashboard,
  },
  {
    label: "Product Management",
    icon: Package,
    children: [
      {
        label: "Product List",
        to: "/warehouse_management/products/list",
        icon: List,
      },
      {
        label: "Combine SKU",
        to: "/warehouse_management/products/combine_sku",
        icon: GitMerge,
      },
    ],
  },
  {
    label: "Inventory Management",
    icon: ClipboardList,
    children: [
      {
        label: "Merchant SKU",
        to: "/warehouse_management/inventory/merchant_SKU",
        icon: Layers,
      },
      {
        label: "SKU Mapping",
        icon: RotateCcw,
        children: [
          {
            label: "SKU Requests",
            to: "/warehouse_management/inventory/SKU_mapping/requests",
            icon: FileText,
          },
          {
            label: "SKU Issues",
            to: "/warehouse_management/inventory/SKU_mapping/issues",
            icon: AlertCircle,
          },
        ],
      },
      {
        label: "Inventory List",
        to: "/warehouse_management/inventory/list",
        icon: SlidersHorizontal,
      },
      {
        label: "Manual inbound",
        to: "/warehouse_management/inventory/manual_inbound",
        icon: SlidersHorizontal,
      },
      {
        label: "Inbound",
        icon: RotateCcw,
        children: [
          {
            label: "Inbound Requests",
            to: "/warehouse_management/inventory/inbound/requests",
            icon: FileText,
          },
          {
            label: "Inbound Issues",
            to: "/warehouse_management/inventory/inbound/issues",
            icon: AlertCircle,
          },
        ],
      },
      {
        label: "Outbound Order",
        to: "/warehouse_management/inventory/outbound_order",
        icon: SlidersHorizontal,
      },
      {
        label: "Inventory Log",
        to: "/warehouse_management/inventory/log",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    label: "Order Management",
    icon: ShoppingCart,
    children: [
      {
        label: "Order Processing",
        icon: RotateCcw,
        children: [
          {
            label: "New Order",
            to: "/warehouse_management/orders/processing/new_order",
            icon: FileText,
          },
          {
            label: "Processed Order",
            to: "/warehouse_management/orders/processing/processed",
            icon: AlertCircle,
          },
          {
            label: "To Pickup Order",
            to: "/warehouse_management/orders/processing/pick_up",
            icon: AlertCircle,
          },
          {
            label: "Shipped Order",
            to: "/warehouse_management/orders/processing/shipped",
            icon: AlertCircle,
          },
          {
            label: "Completed",
            to: "/warehouse_management/orders/processing/completed",
            icon: AlertCircle,
          },
          {
            label: "All Order",
            to: "/warehouse_management/orders/processing/all_order",
            icon: AlertCircle,
          },
          {
            label: "Canceled Order",
            to: "/warehouse_management/orders/processing/canceled",
            icon: AlertCircle,
          },
        ],
      },
      {
        label: "Manual Order",
        to: "/warehouse_management/orders/manual_order",
        icon: RotateCcw,
      },
    ],
  },
  {
    label: "Warehouse Management",
    to: "/warehouse_management/warehouse",
    icon: Warehouse,
  },
  {
    label: "System Configuration",
    icon: Settings,
    children: [
      {
        label: "Store Authorization",
        to: "/warehouse_management/config/store_authorization",
        icon: MapPin,
      },
      {
        label: "Account Management",
        icon: RotateCcw,
        children: [
          {
            label: "Sub Account",
            to: "/warehouse_management/config/account_management/sub_account",
            icon: FileText,
          },
          {
            label: "Role Management",
            to: "/warehouse_management/config/account_management/role_management",
            icon: AlertCircle,
          },
        ],
      },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

// Recursively check if this item or any descendant is active
function hasActiveDescendant(item, pathname) {
  if (item.to && pathname.startsWith(item.to)) return true;
  if (item.children) {
    return item.children.some((child) => hasActiveDescendant(child, pathname));
  }
  return false;
}

// ── Recursive NavItem ──────────────────────────────────────────────────────
function NavItem({ item, collapsed, depth = 0 }) {
  const location = useLocation();

  const isAnyChildActive = item.children
    ? item.children.some((c) => hasActiveDescendant(c, location.pathname))
    : false;

  const [open, setOpen] = useState(isAnyChildActive);

  const indentPx = 12 + depth * 12; // indent grows per depth level

  // ── Leaf item (no children) ──────────────────────────────────────────────
  if (!item.children) {
    return (
      <NavLink
        to={item.to}
        end={item.to === "/warehouse_management"}
        title={collapsed ? item.label : undefined}
        style={!collapsed ? { paddingLeft: `${indentPx}px` } : {}}
        className={({ isActive }) =>
          `flex items-center gap-3 pr-3 py-2.5 rounded-lg transition-all duration-150
          ${collapsed ? "px-3 justify-center" : ""}
          ${
            depth > 0
              ? isActive
                ? "text-[#004368] font-semibold" // nested: only text color
                : "text-[#6B8299] hover:text-[#004368]"
              : isActive
                ? "bg-[#004368] text-white font-semibold" // top-level: full bg
                : "text-[#4A6380] hover:bg-[#EAF1F8] hover:text-[#004368]"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {depth > 0 && !collapsed ? (
              // Deeper levels: dot marker instead of icon
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all
                  ${isActive ? "bg-[#004368]" : "bg-[#94A3B8]"}`}
              />
            ) : (
              <item.icon size={18} className="flex-shrink-0" />
            )}
            {!collapsed && (
              <span className="text-sm truncate">{item.label}</span>
            )}
          </>
        )}
      </NavLink>
    );
  }

  // ── Parent item (has children) ───────────────────────────────────────────
  return (
    <div>
      <button
        onClick={() => !collapsed && setOpen((o) => !o)}
        title={collapsed ? item.label : undefined}
        style={!collapsed ? { paddingLeft: `${indentPx}px` } : {}}
        className={`w-full flex items-center gap-3 pr-3 py-2.5 rounded-lg transition-all duration-150
          ${collapsed ? "px-3 justify-center" : ""}
          ${
            isAnyChildActive
              ? "bg-[#004368] text-white font-semibold"
              : "text-[#4A6380] hover:bg-[#EAF1F8] hover:text-[#004368]"
          }`}
      >
        {depth > 0 && !collapsed ? (
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0
              ${isAnyChildActive ? "bg-white" : "bg-[#94A3B8]"}`}
          />
        ) : (
          <item.icon size={18} className="flex-shrink-0" />
        )}

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

      {/* ── Children — rendered recursively ── */}
      {!collapsed && open && (
        <div className="mt-0.5 ml-5 border-l-2 border-[#D0DEE8] pl-2 space-y-0.5">
          {item.children.map((child) => (
            <NavItem
              key={child.to ?? child.label}
              item={child}
              collapsed={collapsed}
              depth={depth + 1}
            />
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
          <img src={grozziielogo} alt="Grozziie" className="h-7 w-auto" />
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
          <NavItem
            key={item.to ?? item.label}
            item={item}
            collapsed={sidebarCollapsed}
            depth={0}
          />
        ))}
      </nav>
    </aside>
  );
}
