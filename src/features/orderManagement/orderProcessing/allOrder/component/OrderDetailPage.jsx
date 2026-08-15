import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import Topbar from "../../../../../components/layout/Topbar";
import ConfirmActionModal from "../../../../../components/shared/ConfirmActionModal";
import { translateStaticText } from "../../../../../i18nDomTranslator";
import { useOrderDetail } from "../../../shared/hooks/useOrderDetail";
import {
  clearOrderDetailReturnContext,
  removeWithdrawOrders,
  setOrderDetailReturnContext,
} from "../../../shared/utils/orderApi";

function parseOrderRouteParam(param = "") {
  const decoded = decodeURIComponent(param);
  const [platform, ...rest] = decoded.split(":");
  return {
    platform,
    orderId: rest.join(":"),
    fullId: decoded,
  };
}

function InfoRow({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[10px] text-slate-400">{label}</p>
      <p className="text-xs font-semibold leading-relaxed text-slate-900 break-words [overflow-wrap:anywhere]">
        {value || "-"}
      </p>
    </div>
  );
}

function Section({ title, children, className = "", rightSlot = null }) {
  return (
    <div className={`bg-white rounded-lg p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 font-display">{title}</h3>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

function RightInfoRow({ label, value }) {
  const displayValue = label === "Address" ? truncateWords(value, 50) : value;
  return (
    <div className="grid grid-cols-[minmax(96px,0.8fr)_minmax(0,1.4fr)] items-start gap-3">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="min-w-0 text-right text-xs font-semibold leading-relaxed text-slate-900 break-words [overflow-wrap:anywhere]">
        {displayValue || "-"}
      </span>
    </div>
  );
}

function truncateWords(value, limit = 50) {
  const text = String(value || "").trim();
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length <= limit) return text;
  return `${words.slice(0, limit).join(" ")}...`;
}

const getWarehouseName = (value) =>
  value?.warehouseName ||
  value?.warehouse?.name ||
  value?.raw?.warehouse?.name ||
  value?.raw?.warehouse_name ||
  value?.raw?.warehouseName ||
  "-";

const getSkuTotalAvailable = (sku) => Number(sku?.totalAvailable ?? sku?.onHand ?? 0);
const getOrderItemQuantity = (item) => Number(item?.quantity || 1);
const CAN_CHANGE_MAPPING_TABS = ["To Pack", "Pack Failed", "Out Of Stock", "Exchange/Add"];

const adjustmentSkuLabel = (sku = {}) => sku.sku || sku.name || "-";
const isValidQuantity = (value) => Number.isInteger(Number(value)) && Number(value) >= 1;

function SkuAdjustmentList({ title, rows = [], onChange, onQuantity, onDelete, loading, tr }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-bold text-slate-700">{tr(title)}</h4>
      {!rows.length ? (
        <p className="rounded-lg border border-surface-border px-3 py-3 text-xs text-slate-400">{tr("No SKU")}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((adjustment) => (
            <div key={adjustment.id} className="flex items-center justify-between gap-3 rounded-lg border border-surface-border px-3 py-2">
              <div className="min-w-0 text-xs">
                <p className="font-semibold text-slate-800">
                  {adjustment.adjustmentType === "add"
                    ? adjustmentSkuLabel(adjustment.replacementSku)
                    : `${adjustmentSkuLabel(adjustment.originalSku)} -> ${adjustmentSkuLabel(adjustment.replacementSku)}`}
                </p>
                <p className="mt-1 text-slate-400">
                  {tr("Qty")} {adjustment.quantity || 1}{adjustment.replacementWarehouseName ? ` | ${adjustment.replacementWarehouseName}` : ""}
                </p>
              </div>
              {(onChange || onQuantity || onDelete) && (
                <div className="flex shrink-0 items-center gap-2">
                  {onChange && (
                    <button type="button" onClick={() => onChange(adjustment)} className="text-xs font-semibold text-primary hover:underline">
                      {tr("Change")}
                    </button>
                  )}
                  {onQuantity && (
                    <button type="button" onClick={() => onQuantity(adjustment)} className="text-xs font-semibold text-primary hover:underline">
                      {tr("Quantity")}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onDelete(adjustment)}
                      className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                    >
                      {tr("Delete")}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getConfirmText(type) {
  if (type === "add") {
    return {
      title: "Confirm Add SKU",
      message: "Are you sure you want to add more SKU for this order?",
      confirmLabel: "Add",
    };
  }
  if (type === "change" || type === "changeAdjustment") {
    return {
      title: "Confirm Change SKU",
      message: "Are you sure you want to change this SKU for this order?",
      confirmLabel: "Change",
    };
  }
  if (type === "delete") {
    return {
      title: "Confirm Delete SKU",
      message: "Are you sure you want to delete this SKU adjustment?",
      confirmLabel: "Delete",
      danger: true,
    };
  }
  if (type === "quantity") {
    return {
      title: "Confirm Quantity Change",
      message: "Are you sure you want to change this SKU quantity?",
      confirmLabel: "Change",
    };
  }
  if (type === "save") {
    return {
      title: "Confirm Save",
      message: "Are you sure you want to save this SKU adjustment?",
      confirmLabel: "Save",
    };
  }
  return {
    title: "Confirm Action",
    message: "Are you sure?",
    confirmLabel: "Confirm",
  };
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const params = useParams();
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const tr = (text) => translateStaticText(text, language);
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const [quantityDraft, setQuantityDraft] = useState("1");
  const { platform, orderId } = parseOrderRouteParam(params.id || params.orderId || "");
  const canChangeAndPack =
    location.state?.pageType === "new" &&
    CAN_CHANGE_MAPPING_TABS.includes(location.state?.activeTab);
  const canChangeWithdrawMapping =
    location.state?.pageType === "processed" &&
    location.state?.activeTab === "Withdraw";
  const canChangeMapping =
    canChangeAndPack || canChangeWithdrawMapping;
  const packAfterMapping =
    canChangeAndPack;

  useEffect(() => {
    if (!location.state?.fromPath) return;
    setOrderDetailReturnContext({
      fromPath: location.state.fromPath,
      orderId,
    });
  }, [location.state?.fromPath, orderId]);

  const {
    order,
    isLoading,
    isFetching,
    isError,
    error,
    showMappingModal,
    setShowMappingModal,
    mappingSearch,
    setMappingSearch,
    mappingSearchType,
    setMappingSearchType,
    handleMappingSearch,
    merchantSkus,
    mappingWarehouse,
    warehouseOptions,
    selectedWarehouseId,
    handleWarehouseChange,
    merchantSkusLoading,
    selectedSkuId,
    setSelectedSkuId,
    mappingQuantity,
    setMappingQuantity,
    mappingTargetItem,
    openMappingModal,
    openAddSkuModal,
    skuAdjustments,
    skuAdjustmentsLoading,
    deleteSkuAdjustment,
    deletingSkuAdjustment,
    updateSkuAdjustmentQuantity,
    updatingSkuAdjustmentQuantity,
    confirmMapping,
    mappingSaving,
  } = useOrderDetail({
    platform,
    orderId,
    initialOrder: location.state?.order,
    packAfterMapping,
    skuOverrideOnly: canChangeWithdrawMapping,
    sourceTab: location.state?.activeTab || "",
    onPackAfterMappingSuccess: async ({ order: packedOrder, context, platform: packedPlatform } = {}) => {
      if (canChangeWithdrawMapping) {
        const packedOrderId = packedOrder?.rawId || packedOrder?.orderNo || packedOrder?.id || orderId;
        await removeWithdrawOrders({
          context,
          platform: packedPlatform,
          orderIds: [packedOrderId],
        });
        queryClient.removeQueries({ queryKey: ["order-management", "processed-order-tab-counts"] });
        clearOrderDetailReturnContext();
        return;
      }

      navigate("/warehouse_management/orders/processing/new_order");
    },
  });

  const items = order?.items || [];
  const firstItem = items[0];
  const mappingGridClass = canChangeMapping
    ? "grid-cols-[1.7fr_0.8fr_0.8fr_0.5fr]"
    : "grid-cols-[1.7fr_0.8fr_0.8fr]";
  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );
  const exchangeAdjustments = (skuAdjustments || []).filter((item) => item.adjustmentType === "exchange");
  const addAdjustments = (skuAdjustments || []).filter((item) => item.adjustmentType === "add");
  const showSkuAdjustmentSection = canChangeMapping || skuAdjustmentsLoading || (skuAdjustments || []).length > 0;
  const askConfirm = (type, payload = null) => {
    if (type === "quantity") {
      setQuantityDraft(String(Math.max(1, Number(payload?.quantity || 1))));
    }
    setPendingConfirm({ type, payload });
  };
  const closeConfirm = () => setPendingConfirm(null);
  const confirmText = getConfirmText(pendingConfirm?.type);
  const handleConfirmedAction = () => {
    const action = pendingConfirm;
    if (!action) return;

    if (action.type === "add") {
      setPendingConfirm(null);
      openAddSkuModal();
    } else if (action.type === "change") {
      setPendingConfirm(null);
      openMappingModal(action.payload);
    } else if (action.type === "changeAdjustment") {
      setPendingConfirm(null);
      if (action.payload?.adjustmentType === "add") {
        openAddSkuModal(action.payload);
      } else {
        const target = items.find((item) => String(item.id) === String(action.payload.platformOrderItemId)) || firstItem;
        openMappingModal(target);
      }
    } else if (action.type === "delete") {
      setPendingConfirm(null);
      deleteSkuAdjustment(action.payload);
    } else if (action.type === "quantity") {
      if (!isValidQuantity(quantityDraft)) return;
      const sourceItem = items.find((item) => String(item.id) === String(action.payload?.platformOrderItemId)) || firstItem;
      updateSkuAdjustmentQuantity(
        {
          adjustment: action.payload,
          quantity: Number(quantityDraft),
          sourceItem,
        },
        { onSettled: () => setPendingConfirm(null) }
      );
    } else if (action.type === "save") {
      setPendingConfirm(null);
      confirmMapping();
    }
  };

  if (isLoading && !order) {
    return (
      <div className="space-y-4 font-body">
        <Topbar PageTitle="Back to Order List" showBack onBack={() => navigate(-1)} />
        <div className="bg-white rounded-xl border border-surface-border p-8 text-sm text-slate-500">
          Loading order details...
        </div>
      </div>
    );
  }

  if ((isError && !order) || !order) {
    return (
      <div className="space-y-4 font-body">
        <Topbar PageTitle="Back to Order List" showBack onBack={() => navigate(-1)} />
        <div className="bg-white rounded-xl border border-surface-border p-8 text-sm text-red-500">
          {error?.message || "Order details not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 font-body">
      <Topbar PageTitle="Back to Order List" showBack onBack={() => navigate(-1)} />

      {isFetching && (
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-xs text-primary">Refreshing order details...</div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-5">
          <Section title="Order Information">
            <div className="grid grid-cols-6 gap-4">
              <InfoRow label="Warehouse Package No." value={order.pkgNo} />
              <InfoRow label="Order Number" value={order.orderNo} />
              <InfoRow label="Order Status" value={order.status} />
              <InfoRow label="Order Time" value={order.orderTime || order.createdAt} />
              <InfoRow label="Store Name" value={order.storeName} />
              <InfoRow label="Platform Name" value={order.platformLabel} />
            </div>
          </Section>

          <Section title="Logistic Information">
            <div className="grid grid-cols-4 gap-4">
              <InfoRow label="Buyer designated logistic" value={order.logistics?.buyerLogistic} />
              <InfoRow label="Logistics Name" value={order.logistics?.logisticsName} />
              <InfoRow label="Tracking No." value={order.logistics?.trackingNo || order.trackingNo} />
              <InfoRow label="Estimated Delivery Time" value={order.logistics?.estimatedDeliveryTime} />
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-white rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 font-display">Items</h3>
                <span className="text-xs text-slate-400">Subtotal</span>
              </div>
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400">No item data</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <img src={item.image} alt={item.sku} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">SKU-{item.sku}</p>
                        <p
                          className="text-xs leading-4 text-slate-500 break-words"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.currency || "USD"}{item.unitPrice || 0} × {item.quantity || 1}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-800 whitespace-nowrap pt-5">
                        $ {item.subtotal || 0}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg p-5">
              <div className="mb-3">
                <div className={`grid ${mappingGridClass} gap-2 text-xs font-semibold text-slate-800`}>
                  <span className="col-span-1">Merchant Mapping</span>
                  <span>To Allocate /Deduct</span>
                  <span>Allocate /Deduct</span>
                  {canChangeMapping && <span>Action</span>}
                </div>
              </div>
              <div className="space-y-3">
                {(items.length ? items : [firstItem]).filter(Boolean).map((item) => (
                  <div key={item.id} className={`grid ${mappingGridClass} gap-2 items-center`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={item.image} alt={item.sku} className="w-10 h-10 rounded object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">SKU-{item.sku}</p>
                        <p className="text-xs text-slate-400 truncate">{`Available Inventory: ${item.available ?? "--"}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-8 h-7 border border-surface-border rounded text-xs flex items-center justify-center text-slate-700">
                        {item.quantity || 1}
                      </span>
                    </div>
                    <span className="text-sm text-slate-700 text-center">{item.quantity || 1}</span>
                    {canChangeMapping && (
                      <button
                        onClick={() => askConfirm("change", item)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {tr("Change")}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {showSkuAdjustmentSection && (
              <div className="bg-white rounded-lg p-5 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-slate-800 font-display">{tr("Exchange / Add SKU")}</h3>
                  {canChangeMapping && (
                    <button
                      type="button"
                      onClick={() => askConfirm("add")}
                      className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                    >
                      + {tr("Add More SKU")}
                    </button>
                  )}
                </div>
                {skuAdjustmentsLoading ? (
                  <p className="text-xs text-slate-400">{tr("Loading SKU adjustments...")}</p>
                ) : (
                  <div className="space-y-4">
                    <SkuAdjustmentList
                      title="Exchange SKU"
                      rows={exchangeAdjustments}
                      onChange={canChangeMapping ? (adjustment) => askConfirm("changeAdjustment", adjustment) : undefined}
                      onQuantity={canChangeMapping ? (adjustment) => askConfirm("quantity", adjustment) : undefined}
                      onDelete={canChangeMapping ? (adjustment) => askConfirm("delete", adjustment) : undefined}
                      loading={deletingSkuAdjustment}
                      tr={tr}
                    />
                    <SkuAdjustmentList
                      title="Add SKU"
                      rows={addAdjustments}
                      onChange={canChangeMapping ? (adjustment) => askConfirm("changeAdjustment", adjustment) : undefined}
                      onQuantity={canChangeMapping ? (adjustment) => askConfirm("quantity", adjustment) : undefined}
                      onDelete={canChangeMapping ? (adjustment) => askConfirm("delete", adjustment) : undefined}
                      loading={deletingSkuAdjustment}
                      tr={tr}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-800 font-display mb-5">Order Log</h3>
            <div className="flex items-center gap-0">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="text-xs text-slate-500 mt-2">Unpaid</div>
              </div>
              <div className="w-16 h-px bg-primary mx-1" />
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="text-xs text-slate-500 mt-2">{order.status}</div>
              </div>
              <div className="w-16 h-px bg-surface-border mx-1" />
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2 border-surface-border bg-white" />
              </div>
            </div>
            <div className="mt-2 ml-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                {`The platform status is - ${order.platformLabel} - ${order.rawStatus || order.status}. Total item quantity: ${totalQty || 0}`}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">Payment Information</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {order.payment?.type || "Prepaid"}
              </span>
            </div>
            <div className="space-y-3">
              <RightInfoRow label="Payment Date and Time" value={order.payment?.paidAt} />
              <RightInfoRow label="Subtotal" value={order.payment?.subtotal} />
              <RightInfoRow label="Shipping Fee paid by Buyer" value={order.payment?.shippingFee} />
              <RightInfoRow label="Total Discount" value={order.payment?.discount} />
              <RightInfoRow label="Order Value" value={order.payment?.orderValue || order.price} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-800 font-display mb-4">Customer Information</h3>
            <div className="space-y-3">
              <RightInfoRow label="User Name" value={order.customer?.userName} />
              <RightInfoRow label="Recipient Name" value={order.customer?.recipientName} />
              <RightInfoRow label="Phone" value={order.customer?.phone} />
              <RightInfoRow label="Address" value={order.customer?.address} />
              <RightInfoRow label="City / Town" value={order.customer?.city} />
              <RightInfoRow label="State" value={order.customer?.state} />
              <RightInfoRow label="Post Code" value={order.customer?.postCode} />
              <RightInfoRow label="Country / Region" value={order.customer?.country} />
            </div>
          </div>

          <div className="bg-white rounded-lg p-5">
            <h3 className="text-sm font-bold text-slate-800 font-display mb-3">Note</h3>
            <p className="text-xs text-slate-400">{order.note || "Note Here"}</p>
          </div>
        </div>
      </div>

      {showMappingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.28)", backdropFilter: "blur(5px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowMappingModal(false)}
        >
          <div className="bg-white rounded-[24px] shadow-2xl w-full font-body overflow-hidden" style={{ maxWidth: "980px", animation: "popIn 0.18s ease both" }}>
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 font-display">
                {`${tr(mappingTargetItem?.adjustmentType === "add" ? "Add SKU" : "Change Mapping")} _ ${tr("Warehouse Package No")}: ${order.pkgNo}`}
              </h2>
              <button onClick={() => setShowMappingModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="mx-6 rounded-lg border border-surface-border px-4 py-4">
              <div className="flex items-center gap-4">
                <img src={mappingTargetItem?.image || firstItem?.image} alt="item" className="h-12 w-12 rounded object-cover" />
                <div className="min-w-0">
                  <p className="max-w-[340px] truncate text-xs font-medium text-slate-800">{mappingTargetItem?.name || firstItem?.name}</p>
                  <p className="mt-1 text-xs text-slate-700 font-mono">{mappingTargetItem?.sku || firstItem?.sku}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
                    <span>{tr("ERP Warehouse")}:</span>
                    <select
                      value={selectedWarehouseId || mappingWarehouse?.id || ""}
                      onChange={(e) => handleWarehouseChange(e.target.value)}
                      className="h-7 min-w-36 rounded border border-surface-border bg-white px-2 text-[11px] text-slate-600 outline-none focus:border-primary"
                    >
                      {mappingWarehouse?.id && !warehouseOptions.some((warehouse) => String(warehouse.id) === String(mappingWarehouse.id)) && (
                        <option value={mappingWarehouse.id}>{mappingWarehouse.name || getWarehouseName(mappingTargetItem || firstItem)}</option>
                      )}
                      {warehouseOptions.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                      ))}
                    </select>
                    <label className="flex items-center gap-1">
                      <span>{tr("Quantity")}:</span>
                      <input
                        type="number"
                        min="1"
                        value={mappingQuantity}
                        onChange={(event) => setMappingQuantity(Math.max(1, Number(event.target.value || 1)))}
                        className="h-7 w-16 rounded border border-surface-border bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-primary"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-6 mt-5 rounded-lg border border-surface-border px-4 py-4 flex items-center gap-3">
              <select
                value={mappingSearchType}
                onChange={(e) => setMappingSearchType(e.target.value)}
                className="h-9 w-24 rounded border border-surface-border bg-white px-3 text-xs text-slate-500 outline-none"
              >
                <option value="sku_name">{tr("SKU Name")}</option>
                <option value="product_name">{tr("Product Name")}</option>
              </select>
              <div className="relative w-56">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={tr("Search")}
                  value={mappingSearch}
                  onChange={(e) => setMappingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMappingSearch()}
                  className="h-9 w-full rounded border border-surface-border pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                />
              </div>
              <button onClick={handleMappingSearch} className="h-9 rounded bg-primary px-5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark">
                {tr("Search")}
              </button>
            </div>

            <div className="mx-6 mt-5 rounded-lg border border-surface-border px-4 py-5">
              <h3 className="text-sm font-bold text-slate-800 font-display mb-6">{tr("Select Merchant SKU")}</h3>
              <div className="overflow-auto" style={{ maxHeight: "260px" }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white [&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                    <tr className="border-b border-surface-border">
                      {["Select", "Image", "Product Name", "SKU", "Warehouse", "Total Available", "Available For Platform", "Lock"].map((h) => (
                        <th key={h} className="py-2.5 text-left text-xs font-semibold text-slate-600 pr-4">{tr(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {merchantSkusLoading ? (
                      <tr><td colSpan={8} className="py-8 text-center text-xs text-slate-400">{tr("Loading merchant SKUs...")}</td></tr>
                    ) : merchantSkus.length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-xs text-slate-400">{tr("No merchant SKU found")}</td></tr>
                    ) : (
                      merchantSkus.map((sku) => {
                        const totalAvailable = getSkuTotalAvailable(sku);
                        const canSelectSku = totalAvailable >= Math.max(1, Number(mappingQuantity || 1));
                        return (
                          <tr key={sku.id} className={`transition-colors ${canSelectSku ? "hover:bg-surface/50" : "bg-slate-50 opacity-60"}`}>
                            <td className="py-2.5 pr-4">
                              <input
                                type="checkbox"
                                checked={String(selectedSkuId) === String(sku.id)}
                                disabled={!canSelectSku}
                                onChange={() => canSelectSku && setSelectedSkuId(sku.id)}
                                title={canSelectSku ? tr("Select SKU") : tr("Total available quantity is not enough")}
                                className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer disabled:cursor-not-allowed"
                              />
                            </td>
                            <td className="py-2.5 pr-4"><img src={sku.image} alt={sku.name} className="w-8 h-8 rounded object-cover" /></td>
                            <td className="py-2.5 pr-4 text-xs text-slate-700"><span className="block max-w-44 truncate">{sku.name}</span></td>
                            <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{sku.sku}</td>
                            <td className="py-2.5 pr-4 text-xs text-slate-600"><span className="block max-w-36 truncate">{sku.warehouseName}</span></td>
                            <td className="py-2.5 pr-4 text-xs text-slate-600">{totalAvailable.toLocaleString()}</td>
                            <td className="py-2.5 pr-4 text-xs text-slate-600">{Number(sku.availableForPlatform ?? sku.available ?? 0).toLocaleString()}</td>
                            <td className="py-2.5 pr-4 text-xs text-slate-600">{Number(sku.lockQuantity ?? sku.allocated ?? 0).toLocaleString()}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5">
              <button onClick={() => setShowMappingModal(false)} className="h-10 min-w-32 rounded-lg border border-surface-border bg-white px-7 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card">
                {tr("Cancel")}
              </button>
              <button
                onClick={() => askConfirm("save")}
                disabled={mappingSaving}
                className="h-10 min-w-32 rounded-lg bg-primary px-7 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {mappingSaving ? tr("Saving...") : (packAfterMapping || canChangeWithdrawMapping) ? tr("Save") : tr("Confirm")}
              </button>
            </div>
          </div>
          <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
      )}
      <ConfirmActionModal
        open={!!pendingConfirm}
        title={tr(confirmText.title)}
        message={
          pendingConfirm?.type === "quantity" ? (
            <div className="space-y-3">
              <p>{tr(confirmText.message)}</p>
              <label className="block text-xs font-semibold text-slate-600">
                {tr("Quantity")}
                <input
                  type="number"
                  min="1"
                  value={quantityDraft}
                  onChange={(event) => setQuantityDraft(event.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-surface-border bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-primary"
                />
              </label>
            </div>
          ) : tr(confirmText.message)
        }
        confirmLabel={tr(confirmText.confirmLabel)}
        cancelLabel={tr("Cancel")}
        loading={mappingSaving || deletingSkuAdjustment || updatingSkuAdjustmentQuantity}
        loadingLabel={tr(pendingConfirm?.type === "quantity" ? "Changing..." : "Working...")}
        confirmDisabled={pendingConfirm?.type === "quantity" && !isValidQuantity(quantityDraft)}
        danger={Boolean(confirmText.danger)}
        onCancel={closeConfirm}
        onConfirm={handleConfirmedAction}
      />
    </div>
  );
}
