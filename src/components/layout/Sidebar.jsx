import { useState, useRef, useEffect, createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Warehouse,
  BaggageClaim,
  ShoppingBasket,
  ChevronDown,
  ChevronRight,
  PanelRight,
  List,
  GitMerge,
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
import grozziielogo from "../../assets/GrozziieLogo.svg";

// ── Nav config ────────────────────────────────────────────────────────────
const navItems = [
  {
    label: "Dashboard",
    i18nKey: "nav.dashboard",
    permissionKey: "dashboard",
    to: "/warehouse_management",
    icon: LayoutDashboard,
  },
  {
    label: "Product Management",
    i18nKey: "nav.productManagement",
    permissionKey: "product_management",
    icon: ProductManagementIcon,
    children: [
      {
        label: "Product List",
        i18nKey: "nav.productList",
        permissionKey: "product_list",
        to: "/warehouse_management/products/list",
        icon: List,
      },
      {
        label: "Combine SKU",
        i18nKey: "nav.combineSku",
        permissionKey: "combine_sku",
        to: "/warehouse_management/products/combine_sku",
        icon: GitMerge,
      },
    ],
  },
  {
    label: "Inventory Management",
    i18nKey: "nav.inventoryManagement",
    permissionKey: "inventory_management",
    icon: InventoryManagementIcon,
    children: [
      {
        label: "Merchant SKU",
        i18nKey: "nav.merchantSku",
        permissionKey: "merchant_sku",
        to: "/warehouse_management/inventory/merchant_SKU",
        icon: Layers,
      },
      {
        label: "SKU Mapping",
        i18nKey: "nav.skuMapping",
        permissionKey: "sku_mapping",
        icon: RotateCcw,
        children: [
          {
            label: "By Product",
            i18nKey: "nav.byProduct",
            permissionKey: "sku_mapping_by_product",
            to: "/warehouse_management/inventory/SKU_mapping/byProduct",
            icon: FileText,
          },
          {
            label: "By Merchant",
            i18nKey: "nav.byMerchant",
            permissionKey: "sku_mapping_by_merchant",
            to: "/warehouse_management/inventory/SKU_mapping/byMerchant",
            icon: AlertCircle,
          },
        ],
      },
      {
        label: "Inventory List",
        i18nKey: "nav.inventoryList",
        permissionKey: "inventory_list",
        to: "/warehouse_management/inventory/list",
        icon: SlidersHorizontal,
      },
      {
        label: "Manual inbound",
        i18nKey: "nav.manualInbound",
        permissionKey: "manual_inbound",
        to: "/warehouse_management/inventory/manual_inbound",
        icon: SlidersHorizontal,
      },
      {
        label: "Inbound",
        i18nKey: "nav.inbound",
        permissionKey: "inbound",
        icon: RotateCcw,
        children: [
          {
            label: "Draft",
            i18nKey: "nav.draft",
            permissionKey: "inbound_draft",
            to: "/warehouse_management/inventory/inbound/draft",
            icon: FileText,
          },
          {
            label: "On The Way",
            i18nKey: "nav.onTheWay",
            permissionKey: "inbound_on_the_way",
            to: "/warehouse_management/inventory/inbound/onTheWay",
            icon: AlertCircle,
          },
          {
            label: "Complete",
            i18nKey: "nav.complete",
            permissionKey: "inbound_complete",
            to: "/warehouse_management/inventory/inbound/completed",
            icon: AlertCircle,
          },
        ],
      },
      {
        label: "Outbound",
        i18nKey: "nav.outbound",
        permissionKey: "inbound",
        icon: RotateCcw,
        children: [
          {
            label: "Draft",
            i18nKey: "nav.draft",
            permissionKey: "inbound_draft",
            to: "/warehouse_management/inventory/outbound/draft",
            icon: FileText,
          },
          {
            label: "On The Way",
            i18nKey: "nav.onTheWay",
            permissionKey: "inbound_on_the_way",
            to: "/warehouse_management/inventory/outbound/onTheWay",
            icon: AlertCircle,
          },
          {
            label: "Complete",
            i18nKey: "nav.complete",
            permissionKey: "inbound_complete",
            to: "/warehouse_management/inventory/outbound/completed",
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
        i18nKey: "nav.inventoryLog",
        permissionKey: "inventory_log",
        to: "/warehouse_management/inventory/log",
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    label: "Order Management",
    i18nKey: "nav.orderManagement",
    permissionKey: "order_management",
    icon: ShoppingBasket,
    children: [
      {
        label: "Order Processing",
        i18nKey: "nav.orderProcessing",
        permissionKey: "order_processing",
        icon: RotateCcw,
        children: [
          {
            label: "New Order",
            i18nKey: "nav.newOrder",
            permissionKey: "new_order",
            to: "/warehouse_management/orders/processing/new_order",
            icon: FileText,
          },
          {
            label: "Processed Order",
            i18nKey: "nav.processedOrder",
            permissionKey: "processed_order",
            to: "/warehouse_management/orders/processing/processed",
            icon: AlertCircle,
          },
          {
            label: "To Pickup Order",
            i18nKey: "nav.toPickupOrder",
            permissionKey: "to_pickup_order",
            to: "/warehouse_management/orders/processing/pick_up",
            icon: AlertCircle,
          },
          {
            label: "Shipped Order",
            i18nKey: "nav.shippedOrder",
            permissionKey: "shipped_order",
            to: "/warehouse_management/orders/processing/shipped",
            icon: AlertCircle,
          },
          {
            label: "Completed",
            i18nKey: "nav.completed",
            permissionKey: "completed_order",
            to: "/warehouse_management/orders/processing/completed",
            icon: AlertCircle,
          },
          {
            label: "All Order",
            i18nKey: "nav.allOrder",
            permissionKey: "all_order",
            to: "/warehouse_management/orders/processing/all_order",
            icon: AlertCircle,
          },
          {
            label: "Canceled Order",
            i18nKey: "nav.canceledOrder",
            permissionKey: "canceled_order",
            to: "/warehouse_management/orders/processing/canceled",
            icon: AlertCircle,
          },
        ],
      },
      {
        label: "Manual Order",
        i18nKey: "nav.manualOrder",
        permissionKey: "manual_order",
        to: "/warehouse_management/orders/manual_order",
        icon: RotateCcw,
      },
      {
        label: "Platform Manual Order",
        i18nKey: "nav.platformManualOrder",
        permissionKey: "manual_order",
        to: "/warehouse_management/orders/platform_manual_order",
        icon: FileText,
      },
      // {
      //   label: "Manual order by aftership",
      //   permissionKey: "manual_order",
      //   to: "/warehouse_management/orders/aftership_manual_order",
      //   icon: RotateCcw,
      // },
    ],
  },
  {
    label: "Warehouse Management",
    i18nKey: "nav.warehouseManagement",
    permissionKey: "warehouse_management",
    to: "/warehouse_management/warehouse",
    icon: Warehouse,
  },
  {
    label: "System Configuration",
    i18nKey: "nav.systemConfiguration",
    permissionKey: "system_configuration",
    icon: SystemConfigurationIcon,
    children: [
      {
        label: "Store Authorization",
        i18nKey: "nav.storeAuthorization",
        permissionKey: "store_authorization",
        to: "/warehouse_management/config/store_authorization",
        icon: MapPin,
      },
      {
        label: "Account Management",
        i18nKey: "nav.accountManagement",
        permissionKey: "account_management",
        icon: RotateCcw,
        children: [
          {
            label: "Sub Account",
            i18nKey: "nav.subAccount",
            permissionKey: "sub_account",
            to: "/warehouse_management/config/account_management/sub_account",
            icon: FileText,
          },
          {
            label: "Role Management",
            i18nKey: "nav.roleManagement",
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

function getEffectiveNavPath(location) {
  if (location.pathname.startsWith("/warehouse_management/orders/detail/")) {
    return location.state?.fromPath || location.state?.orderListPath || location.pathname;
  }
  return location.pathname;
}

// ── Accordion Context ──────────────────────────────────────────────────────
// Key = parentPath (unique per group of siblings), value = open child label.
// This ensures siblings within the SAME parent group close each other,
// while siblings in DIFFERENT parents are fully independent.
function NavIcon({ icon: Icon, label }) {
  if (typeof Icon === "string") {
    return (
      <img
        src={Icon}
        alt=""
        aria-hidden="true"
        className="w-[18px] h-[18px] flex-shrink-0"
      />
    );
  }

  return <Icon size={18} className="flex-shrink-0" aria-label={label} />;
}

function SubSubChildArrow() {
  return (
    <span className="h-6 w-4 border-l border-b border-slate-300 rounded-bl-lg flex-shrink-0 -mt-3" />
  );
}

function CollapsedFlyoutItem({ item, depth = 0, onClose }) {
  const { t } = useTranslation();
  const label = t(item.i18nKey, { defaultValue: item.label });
  if (item.to) {
    return (
      <NavLink
        to={item.to}
        end={item.to === "/warehouse_management"}
        onClick={onClose}
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors
          ${depth > 0 ? "ml-4" : ""}
          ${
            isActive
              ? "bg-[#EAF1F8] text-[#004368] font-semibold"
              : "text-[#4A6380] hover:bg-[#F4F8FB] hover:text-[#004368]"
          }`
        }
      >
        {depth > 0 && <SubSubChildArrow />}
        <span className="truncate">{label}</span>
      </NavLink>
    );
  }

  return (
    <div className={depth > 0 ? "ml-4" : ""}>
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#6B8299]">
        {depth > 0 && <SubSubChildArrow />}
        <span className="truncate">{label}</span>
      </div>
      <div className="space-y-0.5">
        {item.children?.map((child) => (
          <CollapsedFlyoutItem
            key={child.to ?? child.label}
            item={child}
            depth={depth + 1}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
}

function CollapsedFlyout({ item, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="w-64 rounded-xl border border-[#E2E8F0] bg-white p-2 shadow-xl">
      <div className="px-3 py-2 text-sm font-semibold text-[#0F172A]">
        {t(item.i18nKey, { defaultValue: item.label })}
      </div>
      <div className="space-y-0.5">
        {item.children?.map((child) => (
          <CollapsedFlyoutItem
            key={child.to ?? child.label}
            item={child}
            onClose={onClose}
          />
        ))}
      </div>
    </div>
  );
}

function ProductManagementIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.91675 8.75V15.75C2.91675 20.1497 2.91675 22.3497 4.28358 23.7165C5.65042 25.0833 7.8503 25.0833 12.2501 25.0833H15.7501C20.1498 25.0833 22.3498 25.0833 23.7165 23.7165C25.0834 22.3497 25.0834 20.1497 25.0834 15.75V8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.51402 6.20034L2.91675 8.74996H25.0834L23.6225 6.31516C22.6265 4.6552 22.1286 3.82523 21.3262 3.37093C20.5238 2.91663 19.5559 2.91663 17.6201 2.91663H10.4461C8.55172 2.91663 7.60455 2.91663 6.81357 3.35448C6.02259 3.79233 5.51973 4.595 4.51402 6.20034Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8.74996V2.91663" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 21H12.8333M7 17.5H10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InventoryManagementIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.5 7.5V13.5C21.5 17.2712 21.5 19.1569 20.3284 20.3284C19.1569 21.5 17.2712 21.5 13.5 21.5H10.5C8.23386 21.5 6.6486 21.5 5.48999 21.2458" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.86909 5.31461L2.5 7.5H21.5L20.2478 5.41303C19.3941 3.99021 18.9673 3.2788 18.2795 2.8894C17.5918 2.5 16.7621 2.5 15.1029 2.5H8.95371C7.32998 2.5 6.51812 2.5 5.84013 2.8753C5.16215 3.2506 4.73113 3.93861 3.86909 5.31461Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7.5V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.41675 10.5H12.2501" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.41675 14H12.2501" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.41675 17.5H12.2501" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M1.75 11.6458C1.75 11.6458 2.33333 12.026 2.625 12.5833C2.625 12.5833 3.5 10.3958 4.66667 9.66663" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.75 16.9792C1.75 16.9792 2.33333 17.3594 2.625 17.9167C2.625 17.9167 3.5 15.7292 4.66667 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SystemConfigurationIcon({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20.7906 9.15201C21.5969 10.5418 22 11.2366 22 12C22 12.7634 21.5969 13.4582 20.7906 14.848L18.8669 18.1638C18.0638 19.548 17.6623 20.2402 17.0019 20.6201C16.3416 21 15.5402 21 13.9373 21H10.0627C8.45982 21 7.6584 21 6.99807 20.6201C6.33774 20.2402 5.93619 19.548 5.13311 18.1638L3.20942 14.848C2.40314 13.4582 2 12.7634 2 12C2 11.2366 2.40314 10.5418 3.20942 9.152L5.13311 5.83621C5.93619 4.45196 6.33774 3.75984 6.99807 3.37992C7.6584 3 8.45982 3 10.0627 3H13.9373C15.5402 3 16.3416 3 17.0019 3.37992C17.6623 3.75984 18.0638 4.45197 18.8669 5.83622L20.7906 9.15201Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

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
  const closeAll = () => setOpenMap({});

  return (
    <AccordionContext.Provider value={{ toggle, isOpen, getOpenLabel, hasManualOpen, closeAll }}>
      {children}
    </AccordionContext.Provider>
  );
}

// ── Recursive NavItem ──────────────────────────────────────────────────────
// parentPath uniquely identifies the group this item belongs to.
function NavItem({
  item,
  collapsed,
  depth = 0,
  parentPath = "root",
  setCollapsedFlyout,
  closeCollapsedFlyout,
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const accordion = useContext(AccordionContext);
  const effectivePathname = getEffectiveNavPath(location);

  const isAnyChildActive = item.children
    ? item.children.some((c) => hasActiveDescendant(c, effectivePathname))
    : false;

  // This item's group key (used when THIS item is a parent rendering its children)
  const selfPath = `${parentPath}>${item.label}`;
  const label = t(item.i18nKey, { defaultValue: item.label });

  // Open rules:
  // 1) User click always wins inside the same sibling group.
  // 2) If user has not manually opened a sibling group, keep the active route path open.
  // This fixes: Order Management stays open only while it is the selected/open
  // root group; clicking Inventory/Product/System closes the previous root group.
  const manualOpen = accordion ? accordion.isOpen(parentPath, item.label) : false;
  const groupHasManualOpen = accordion ? accordion.hasManualOpen(parentPath) : false;
  const open = manualOpen || (!groupHasManualOpen && isAnyChildActive);
  const visuallyActive = collapsed
    ? isAnyChildActive
    : open || (!groupHasManualOpen && isAnyChildActive);

  const indentPx = 12 + depth * 12;

  // ── Leaf item ─────────────────────────────────────────────────────────
  if (!item.children) {
    return (
      <NavLink
        to={item.to}
        end={item.to === "/warehouse_management"}
        onClick={() => {
          if (depth === 0) accordion?.closeAll();
          closeCollapsedFlyout?.();
        }}
        title={collapsed ? label : undefined}
        style={!collapsed ? { paddingLeft: `${indentPx}px` } : {}}
        className={({ isActive }) =>
          {
            const effectiveActive = item.to && effectivePathname.startsWith(item.to);
            return `flex items-center gap-3 pr-3 py-2.5 rounded-lg transition-all duration-150
          ${collapsed ? "px-3 justify-center" : ""}
          ${
            depth > 0
              ? isActive || effectiveActive
                ? "text-[#004368] font-semibold"
                : "text-[#6B8299] hover:text-[#004368]"
              : isActive || effectiveActive
                ? "bg-[#004368] text-white font-semibold"
                : "text-[#4A6380] hover:bg-[#EAF1F8] hover:text-[#004368]"
          }`;
          }
        }
      >
        {() => (
          <>
            {depth > 0 && !collapsed ? (
              depth > 1 ? (
                <SubSubChildArrow />
              ) : null
            ) : (
            <NavIcon icon={item.icon} label={label} />
            )}
            {!collapsed && (
              <span className="text-sm truncate">{label}</span>
            )}
          </>
        )}
      </NavLink>
    );
  }

  // ── Parent item (has children) ─────────────────────────────────────────
  const handleToggle = (event) => {
    if (collapsed && depth === 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      const flyoutTop = Math.max(
        8,
        Math.min(rect.top, window.innerHeight - 320)
      );

      setCollapsedFlyout?.((current) =>
        current?.label === item.label
          ? null
          : { label: item.label, item, top: flyoutTop }
      );
      return;
    }

    if (!collapsed && accordion) {
      accordion.toggle(parentPath, item.label, open);
    }
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        title={collapsed ? label : undefined}
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
          depth > 1 ? (
            <SubSubChildArrow />
          ) : null
        ) : (
          <NavIcon icon={item.icon} label={label} />
        )}

        {!collapsed && (
          <>
            <span className="text-sm flex-1 text-left truncate">
              {label}
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
              setCollapsedFlyout={setCollapsedFlyout}
              closeCollapsedFlyout={closeCollapsedFlyout}
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
            Free Trial(v-1.1)
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
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const flyoutRef = useRef(null);
  const [collapsedFlyout, setCollapsedFlyout] = useState(null);
  const currentUser = getStoredWarehouseUser();
  const visibleNavItems = filterNavByPermission(navItems, currentUser);
  const closeCollapsedFlyout = () => setCollapsedFlyout(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!sidebarCollapsed || !collapsedFlyout) return;
      if (flyoutRef.current?.contains(event.target)) return;
      if (event.target.closest?.("[data-sidebar-root]")) return;
      closeCollapsedFlyout();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [sidebarCollapsed, collapsedFlyout]);

  return (
    <aside
      data-sidebar-root
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
          onClick={() => {
            closeCollapsedFlyout();
            toggleSidebar();
          }}
          className={`flex items-center justify-center w-8 h-8 rounded-lg
            text-[#004368] hover:bg-[#EAF1F8] transition-all flex-shrink-0
            ${sidebarCollapsed ? "mx-auto" : ""}`}
          title={sidebarCollapsed ? t("common.expandSidebar") : t("common.collapseSidebar")}
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
              setCollapsedFlyout={setCollapsedFlyout}
              closeCollapsedFlyout={closeCollapsedFlyout}
            />
          ))}
        </nav>
      </AccordionProvider>

      {/* Upgrade Plan — pinned to bottom */}
      {sidebarCollapsed && collapsedFlyout?.item && (
        <div
          ref={flyoutRef}
          className="fixed left-[72px] z-[70]"
          style={{ top: `${collapsedFlyout.top}px` }}
        >
          <CollapsedFlyout
            item={collapsedFlyout.item}
            onClose={closeCollapsedFlyout}
          />
        </div>
      )}

      {/* <UpgradePlan collapsed={sidebarCollapsed} /> */}
    </aside>
  );
}
