import { useState, createContext, useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  BaggageClaim,
  ShoppingBasket,
  Bolt,
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
  FileText,
  AlertCircle,
  Crown,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import grozziielogo from "../../assets/Frame.jpg";

// ── Nav config ────────────────────────────────────────────────────────────
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
            label: "By Product",
            to: "/warehouse_management/inventory/SKU_mapping/byProduct",
            icon: FileText,
          },
          {
            label: "By Merchant",
            to: "/warehouse_management/inventory/SKU_mapping/byMerchant",
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
            label: "Draft",
            to: "/warehouse_management/inventory/inbound/draft",
            icon: FileText,
          },
          {
            label: "On The Way",
            to: "/warehouse_management/inventory/inbound/onTheWay",
            icon: AlertCircle,
          },
          {
            label: "Complete",
            to: "/warehouse_management/inventory/inbound/completed",
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
    icon: ShoppingBasket,
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
    icon: Bolt,
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
function hasActiveDescendant(item, pathname) {
  if (item.to && pathname.startsWith(item.to)) return true;
  if (item.children) {
    return item.children.some((child) => hasActiveDescendant(child, pathname));
  }
  return false;
}

// ── Accordion Context ──────────────────────────────────────────────────────
// Key = parentPath (unique per group of siblings), value = open child label.
// This ensures siblings within the SAME parent group close each other,
// while siblings in DIFFERENT parents are fully independent.
const AccordionContext = createContext(null);

function AccordionProvider({ children }) {
  // openMap: { [parentPath]: currently_open_child_label }
  const [openMap, setOpenMap] = useState({});

  /**
   * @param {string} parentPath  — unique key for this group of siblings, e.g. "root" or "root>Inventory Management"
   * @param {string} label       — the child item being toggled
   */
  const toggle = (parentPath, label) => {
    setOpenMap((prev) => {
      const next = { ...prev };

      if (next[parentPath] === label) {
        // Same item clicked → close it
        delete next[parentPath];
        // Also close all descendant groups whose key starts with this item's path
        const childPrefix = `${parentPath}>${label}`;
        Object.keys(next).forEach((key) => {
          if (key.startsWith(childPrefix)) delete next[key];
        });
      } else {
        // Close previous open item's descendants at this group
        const prevLabel = next[parentPath];
        if (prevLabel) {
          const prevChildPrefix = `${parentPath}>${prevLabel}`;
          Object.keys(next).forEach((key) => {
            if (key.startsWith(prevChildPrefix)) delete next[key];
          });
        }
        // Open the new item
        next[parentPath] = label;
      }

      return next;
    });
  };

  const isOpen = (parentPath, label) => openMap[parentPath] === label;

  return (
    <AccordionContext.Provider value={{ toggle, isOpen }}>
      {children}
    </AccordionContext.Provider>
  );
}

// ── Recursive NavItem ──────────────────────────────────────────────────────
// parentPath uniquely identifies the group this item belongs to.
function NavItem({ item, collapsed, depth = 0, parentPath = "root" }) {
  const location = useLocation();
  const accordion = useContext(AccordionContext);

  const isAnyChildActive = item.children
    ? item.children.some((c) => hasActiveDescendant(c, location.pathname))
    : false;

  // This item's group key (used when THIS item is a parent rendering its children)
  const selfPath = `${parentPath}>${item.label}`;

  // Open if accordion says so OR a child route is currently active
  const open = accordion
    ? accordion.isOpen(parentPath, item.label) || isAnyChildActive
    : isAnyChildActive;

  const indentPx = 12 + depth * 12;

  // ── Leaf item ─────────────────────────────────────────────────────────
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
                ? "text-[#004368] font-semibold"
                : "text-[#6B8299] hover:text-[#004368]"
              : isActive
                ? "bg-[#004368] text-white font-semibold"
                : "text-[#4A6380] hover:bg-[#EAF1F8] hover:text-[#004368]"
          }`
        }
      >
        {({ isActive }) => (
          <>
            {depth > 0 && !collapsed ? (
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

  // ── Parent item (has children) ─────────────────────────────────────────
  const handleToggle = () => {
    if (!collapsed && accordion) {
      accordion.toggle(parentPath, item.label);
    }
  };

  return (
    <div>
      <button
        onClick={handleToggle}
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

      {/* Children — pass selfPath so each child group is uniquely scoped */}
      {!collapsed && open && (
        <div className="mt-0.5 ml-5 border-l-2 border-[#D0DEE8] pl-2 space-y-0.5">
          {item.children.map((child) => (
            <NavItem
              key={child.to ?? child.label}
              item={child}
              collapsed={collapsed}
              depth={depth + 1}
              parentPath={selfPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Upgrade Plan Banner ────────────────────────────────────────────────────
const handleToUpgradePlan = () => {
  console.log("Upgrade plan");
};

function UpgradePlan({ collapsed }) {
  if (collapsed) return null;

  return (
    <div onClick={handleToUpgradePlan} className="flex-shrink-0 px-3 py-3 ">
      <div className="rounded-xl bg-[#FFFFFF] border border-surface-card p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-primary-text">
            Free Trial
          </span>
          <span className="text-xs text-[#6B8299]">30 Days left</span>
        </div>
        <div className="w-full h-1.5 bg-surface-card rounded-full mb-3">
          <div
            className="h-1.5 bg-[#004368] rounded-full"
            style={{ width: "40%" }}
          />
        </div>
        <button className="w-full flex items-center justify-center gap-2 bg-[#004368] hover:bg-[#003255] text-white text-xs font-semibold py-2.5 rounded-lg transition-colors duration-150">
          <Crown size={13} />
          Upgrade Plan
        </button>
      </div>
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
        ${sidebarCollapsed ? "w-16" : "w-80"}`}
    >
      {/* Logo row */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-[#E2E8F0]">
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

      {/* Nav — scrollable */}
      <AccordionProvider>
        <nav className="flex-1 min-h-0 px-2 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => (
            <NavItem
              key={item.to ?? item.label}
              item={item}
              collapsed={sidebarCollapsed}
              depth={0}
              parentPath="root"
            />
          ))}
        </nav>
      </AccordionProvider>

      {/* Upgrade Plan — pinned to bottom */}
      <UpgradePlan collapsed={sidebarCollapsed} />
    </aside>
  );
}
