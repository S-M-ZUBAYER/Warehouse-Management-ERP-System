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
import { getStoredWarehouseUser, filterNavByPermission } from "@/utils/permissions";
import grozziielogo from "../../assets/Frame.jpg";

// ── Nav config ────────────────────────────────────────────────────────────
const navItems = [
  {
    label: "Dashboard",
    permissionKey: "dashboard",
    to: "/warehouse_management",
    icon: LayoutDashboard,
  },
  {
    label: "Product Management",
    permissionKey: "product_management",
    icon: Package,
    children: [
      {
        label: "Product List",
        permissionKey: "product_list",
        to: "/warehouse_management/products/list",
        icon: List,
      },
      {
        label: "Combine SKU",
        permissionKey: "combine_sku",
        to: "/warehouse_management/products/combine_sku",
        icon: GitMerge,
      },
    ],
  },
  {
    label: "Inventory Management",
    permissionKey: "inventory_management",
    icon: ClipboardList,
    children: [
      {
        label: "Merchant SKU",
        permissionKey: "merchant_sku",
        to: "/warehouse_management/inventory/merchant_SKU",
        icon: Layers,
      },
      {
        label: "SKU Mapping",
        permissionKey: "sku_mapping",
        icon: RotateCcw,
        children: [
          {
            label: "By Product",
            permissionKey: "sku_mapping_by_product",
            to: "/warehouse_management/inventory/SKU_mapping/byProduct",
            icon: FileText,
          },
          {
            label: "By Merchant",
            permissionKey: "sku_mapping_by_merchant",
            to: "/warehouse_management/inventory/SKU_mapping/byMerchant",
            icon: AlertCircle,
          },
        ],
      },
      {
        label: "Inventory List",
        permissionKey: "inventory_list",
        to: "/warehouse_management/inventory/list",
        icon: SlidersHorizontal,
      },
      {
        label: "Manual inbound",
        permissionKey: "manual_inbound",
        to: "/warehouse_management/inventory/manual_inbound",
        icon: SlidersHorizontal,
      },
      {
        label: "Inbound",
        permissionKey: "inbound",
        icon: RotateCcw,
        children: [
          {
            label: "Draft",
            permissionKey: "inbound_draft",
            to: "/warehouse_management/inventory/inbound/draft",
            icon: FileText,
          },
          {
            label: "On The Way",
            permissionKey: "inbound_on_the_way",
            to: "/warehouse_management/inventory/inbound/onTheWay",
            icon: AlertCircle,
          },
          {
            label: "Complete",
            permissionKey: "inbound_complete",
            to: "/warehouse_management/inventory/inbound/completed",
            icon: AlertCircle,
          },
        ],
      },
      // {
      //   label: "Outbound Order",
      //   permissionKey: "outbound_order",
      //   to: "/warehouse_management/inventory/outbound_order",
      //   icon: SlidersHorizontal,
      // },
      {
        label: "Inventory Log",
        permissionKey: "inventory_log",
        to: "/warehouse_management/inventory/log",
        icon: SlidersHorizontal,
      },
    ],
  },
  // {
  //   label: "Order Management",
  //   permissionKey: "order_management",
  //   icon: ShoppingBasket,
  //   children: [
  //     {
  //       label: "Order Processing",
  //       permissionKey: "order_processing",
  //       icon: RotateCcw,
  //       children: [
  //         {
  //           label: "New Order",
  //           permissionKey: "new_order",
  //           to: "/warehouse_management/orders/processing/new_order",
  //           icon: FileText,
  //         },
  //         {
  //           label: "Processed Order",
  //           permissionKey: "processed_order",
  //           to: "/warehouse_management/orders/processing/processed",
  //           icon: AlertCircle,
  //         },
  //         {
  //           label: "To Pickup Order",
  //           permissionKey: "to_pickup_order",
  //           to: "/warehouse_management/orders/processing/pick_up",
  //           icon: AlertCircle,
  //         },
  //         {
  //           label: "Shipped Order",
  //           permissionKey: "shipped_order",
  //           to: "/warehouse_management/orders/processing/shipped",
  //           icon: AlertCircle,
  //         },
  //         {
  //           label: "Completed",
  //           permissionKey: "completed_order",
  //           to: "/warehouse_management/orders/processing/completed",
  //           icon: AlertCircle,
  //         },
  //         {
  //           label: "All Order",
  //           permissionKey: "all_order",
  //           to: "/warehouse_management/orders/processing/all_order",
  //           icon: AlertCircle,
  //         },
  //         {
  //           label: "Canceled Order",
  //           permissionKey: "canceled_order",
  //           to: "/warehouse_management/orders/processing/canceled",
  //           icon: AlertCircle,
  //         },
  //       ],
  //     },
  //     {
  //       label: "Manual Order",
  //       permissionKey: "manual_order",
  //       to: "/warehouse_management/orders/manual_order",
  //       icon: RotateCcw,
  //     },
  //   ],
  // },
  {
    label: "Warehouse Management",
    permissionKey: "warehouse_management",
    to: "/warehouse_management/warehouse",
    icon: Warehouse,
  },
  {
    label: "System Configuration",
    permissionKey: "system_configuration",
    icon: Bolt,
    children: [
      {
        label: "Store Authorization",
        permissionKey: "store_authorization",
        to: "/warehouse_management/config/store_authorization",
        icon: MapPin,
      },
      {
        label: "Account Management",
        permissionKey: "account_management",
        icon: RotateCcw,
        children: [
          {
            label: "Sub Account",
            permissionKey: "sub_account",
            to: "/warehouse_management/config/account_management/sub_account",
            icon: FileText,
          },
          {
            label: "Role Management",
            permissionKey: "role_management",
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
   * @param {boolean} currentlyOpen — true when the item is already visually open, including active-route fallback
   */
  const toggle = (parentPath, label, currentlyOpen = false) => {
    setOpenMap((prev) => {
      const next = { ...prev };
      const childPrefix = `${parentPath}>${label}`;

      Object.keys(next).forEach((key) => {
        if (key.startsWith(childPrefix)) delete next[key];
      });

      if (currentlyOpen || next[parentPath] === label) {
        // Explicit closed marker keeps active route from immediately reopening
        // the same dropdown after the user closes it.
        next[parentPath] = "__closed__";
        return next;
      }

      const prevLabel = next[parentPath];
      if (prevLabel && prevLabel !== "__closed__") {
        const prevChildPrefix = `${parentPath}>${prevLabel}`;
        Object.keys(next).forEach((key) => {
          if (key.startsWith(prevChildPrefix)) delete next[key];
        });
      }

      next[parentPath] = label;
      return next;
    });
  };

  const isOpen = (parentPath, label) => openMap[parentPath] === label;
  const getOpenLabel = (parentPath) => openMap[parentPath];
  const hasManualOpen = (parentPath) => Object.prototype.hasOwnProperty.call(openMap, parentPath);

  return (
    <AccordionContext.Provider value={{ toggle, isOpen, getOpenLabel, hasManualOpen }}>
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

  // Open rules:
  // 1) User click always wins inside the same sibling group.
  // 2) If user has not manually opened a sibling group, keep the active route path open.
  // This fixes: Order Management stays open only while it is the selected/open
  // root group; clicking Inventory/Product/System closes the previous root group.
  const manualOpen = accordion ? accordion.isOpen(parentPath, item.label) : false;
  const groupHasManualOpen = accordion ? accordion.hasManualOpen(parentPath) : false;
  const open = manualOpen || (!groupHasManualOpen && isAnyChildActive);
  const visuallyActive = open || (!groupHasManualOpen && isAnyChildActive);

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
      accordion.toggle(parentPath, item.label, open);
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
            visuallyActive
              ? "bg-[#004368] text-white font-semibold"
              : "text-[#4A6380] hover:bg-[#EAF1F8] hover:text-[#004368]"
          }`}
      >
        {depth > 0 && !collapsed ? (
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0
              ${visuallyActive ? "bg-white" : "bg-[#94A3B8]"}`}
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
  const currentUser = getStoredWarehouseUser();
  const visibleNavItems = filterNavByPermission(navItems, currentUser);

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
          {visibleNavItems.map((item) => (
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
