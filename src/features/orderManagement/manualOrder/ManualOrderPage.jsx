import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Gift, Loader2, Plus, Search, UploadCloud } from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import OrderFooter from "../shared/components/OrderFooter";
import ManualOrderSubscriptionGate from "../shared/components/ManualOrderSubscriptionGate";
import PageSizePagination from "../shared/components/PageSizePagination";
import WaybillPdfModal from "../shared/components/WaybillPdfModal";
import {
  cancelManualOrderShipment,
  completeManualOrderShippingWalletCheckout,
  createManualOrderWaybill,
  fetchManualOrderDetail,
  fetchManualOrders,
  normalizeManualOrder,
  refreshManualOrderStatus,
  updateManualOrderDeliveryInfo,
} from "../shared/utils/orderApi";
import AddManualOrderPage from "./component/AddManualOrderPage";
import ManualOrderDetailModal from "./component/ManualOrderDetailModal";
import ManualOrderTable from "./component/ManualOrderTable";
import { translateStaticText } from "../../../i18nDomTranslator";

const STATUS_FILTERS = [
  { value: "CREATED", label: "Created", group: "Order" },
  { value: "BOOKING_PENDING", label: "Booking Pending", group: "Order" },
  { value: "BOOKING_FAILED", label: "Booking Failed", group: "Order" },
  { value: "MANUAL_DELIVERY", label: "Self-arranged Delivery", group: "Order" },
  { value: "SCHEDULE_IN_ARRANGEMENT", label: "Schedule In Arrangement", group: "Pending AWB" },
  { value: "TO_BE_COLLECTED", label: "To Be Collected", group: "On Going" },
  { value: "DROP_OFF", label: "Drop Off", group: "On Going" },
  { value: "COLLECTED", label: "Collected", group: "On Going" },
  { value: "DELIVERY_IN_TRANSIT", label: "Delivery In Transit", group: "On Going" },
  { value: "DELIVERY_ON_HOLD", label: "Delivery On Hold", group: "On Going" },
  { value: "DELIVERED", label: "Delivered", group: "Completed" },
  { value: "RETURNED", label: "Returned", group: "Completed" },
  { value: "CANCELLED", label: "Cancelled", group: "Cancelled" },
  { value: "ALL", label: "All", group: "All" },
];

const STATUS_GROUP_LABELS = ["Order", "Pending AWB", "On Going", "Completed", "Cancelled", "All"];

const SEARCH_TYPES = ["Single Search", "Batch Search"];
const SKU_TYPES = ["SKU", "Package Number", "Order Number", "Tracking Number"];
const MANUAL_ORDER_OUTPUT_COLUMNS = [
  { label: "Order No", key: "orderNo" },
  { label: "Country", key: "sender.country" },
  { label: "Receiver", key: "buyer.name" },
  { label: "Payment", key: "paymentType" },
  { label: "Courier", key: "logisticCompany" },
  { label: "Tracking Number", key: "awbNumber" },
  { label: "Shipment Status", key: "status" },
  { label: "Created", key: "createdAt" },
];
const DEFAULT_MANUAL_ORDER_PAGE_SIZE = 10;
const SHIPPING_WALLET_SESSION_PREFIX = "manual-order-shipping-wallet-confirmed:";

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read waybill PDF file"));
    reader.readAsDataURL(file);
  });

export default function ManualOrderPage() {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  const tr = (text) => translateStaticText(text, language);
  const tw = (key, defaultValue, options = {}) => t(key, { defaultValue, ...options });
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState("CREATED");
  const [paymentType, setPaymentType] = useState("ALL");
  const [searchType, setSearchType] = useState("Single Search");
  const [skuType, setSkuType] = useState("Order Number");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedOrderRows, setSelectedOrderRows] = useState([]);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_MANUAL_ORDER_PAGE_SIZE);
  const [pageSizeInput, setPageSizeInput] = useState(String(DEFAULT_MANUAL_ORDER_PAGE_SIZE));
  const [showAddPage, setShowAddPage] = useState(false);
  const [addMode, setAddMode] = useState("order");
  const [detailOrder, setDetailOrder] = useState(null);
  const [deliveryEditOrder, setDeliveryEditOrder] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({ logisticCompany: "", trackingNumber: "", waybillUrl: "", waybillFile: null, note: "" });
  const [waybillPdf, setWaybillPdf] = useState({ open: false, url: "", previewUrl: "", filename: "easyparcel-waybill.pdf" });
  const confirmingShippingWalletSessionsRef = useRef(new Set());

  const queryParams = useMemo(() => ({
    status: activeStatus,
    paymentType,
    search: appliedSearch,
    searchType,
    skuType,
  }), [activeStatus, appliedSearch, paymentType, searchType, skuType]);

  const manualOrdersQuery = useQuery({
    queryKey: ["manual-orders", queryParams],
    queryFn: () => fetchManualOrders(queryParams),
    staleTime: 1000 * 30,
    placeholderData: (previous) => previous,
  });

  const orders = manualOrdersQuery.data?.orders || [];
  const statusCounts = manualOrdersQuery.data?.statusCounts || {};
  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const effectivePage = Math.min(page, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (effectivePage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [effectivePage, orders, pageSize]);
  const selectedRows = useMemo(() => {
    const cachedRowsMatchSelection =
      selectedOrderRows.length === selectedIds.length &&
      selectedIds.every((id) => selectedOrderRows.some((order) => order.id === id));

    if (cachedRowsMatchSelection) return selectedOrderRows;
    return orders.filter((order) => selectedIds.includes(order.id));
  }, [orders, selectedIds, selectedOrderRows]);

  useEffect(() => {
    setSelectedOrderRows((current) => current.filter((order) => selectedIds.includes(order.id)));
  }, [selectedIds]);

  useEffect(() => {
    setSelectedIds([]);
    setSelectedOrderRows([]);
    setPage(1);
  }, [queryParams]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get("shipping_wallet_session_id");
    const cancelled = params.get("shipping_wallet_cancelled");
    if (!sessionId && !cancelled) return;

    const nextParams = new URLSearchParams(location.search);
    nextParams.delete("shipping_wallet_session_id");
    nextParams.delete("shipping_wallet_cancelled");
    navigate(
      {
        pathname: location.pathname,
        search: nextParams.toString() ? `?${nextParams.toString()}` : "",
      },
      { replace: true },
    );

    if (cancelled) {
      toast.info(tw("manualOrderShipping.topUpCancelled", "Shipping wallet top-up was cancelled."));
      return;
    }

    const sessionKey = `${SHIPPING_WALLET_SESSION_PREFIX}${sessionId}`;
    if (confirmingShippingWalletSessionsRef.current.has(sessionId) || sessionStorage.getItem(sessionKey) === "1") {
      return;
    }
    confirmingShippingWalletSessionsRef.current.add(sessionId);
    sessionStorage.setItem(sessionKey, "1");

    completeManualOrderShippingWalletCheckout(sessionId)
      .then((result) => {
        queryClient.invalidateQueries({ queryKey: ["manual-order-shipping-wallet"] });
        if (result?.alreadyCompleted) return;
        const balance = result?.wallet?.balanceMyr;
        toast.success(
          balance !== undefined
            ? `${tw("manualOrderShipping.topUpSuccess", "Shipping wallet topped up successfully.")} ${tw("manualOrderShipping.currentBalance", "Current balance")}: MYR ${Number(balance).toFixed(2)}`
            : tw("manualOrderShipping.topUpSuccess", "Shipping wallet topped up successfully."),
        );
      })
      .catch((err) => {
        sessionStorage.removeItem(sessionKey);
        confirmingShippingWalletSessionsRef.current.delete(sessionId);
        toast.error(err?.response?.data?.message || err?.message || tw("manualOrderShipping.confirmTopUpFailed", "Failed to confirm shipping wallet top-up."));
      });
  }, [location.pathname, location.search, navigate, queryClient, tw]);

  const openWaybill = (order, response = {}) => {
    const pdf = getManualWaybillPdf(order, response);
    setWaybillPdf({
      open: true,
      url: pdf.url,
      previewUrl: pdf.url,
      filename: pdf.filename,
    });
  };

  const waybillMutation = useMutation({
    mutationFn: createManualOrderWaybill,
    onSuccess: (data, sourceOrder) => {
      const updatedOrder = normalizeManualOrder(data?.order || data?.manualOrder || data || sourceOrder?.raw || sourceOrder);
      queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
      if (data?.easyParcelError) {
        toast.error(data.message || data.easyParcelError);
        return;
      }
      toast.success(data?.message || "EasyParcel waybill is ready");
      openWaybill(updatedOrder, data);
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
      toast.error(err?.response?.data?.message || err?.message || "Failed to create EasyParcel waybill");
    },
  });

  const detailMutation = useMutation({
    mutationFn: (order) => fetchManualOrderDetail(order.rawId || order.id),
    onSuccess: (order) => setDetailOrder(order),
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to load manual order details"),
  });

  const refreshStatusMutation = useMutation({
    mutationFn: refreshManualOrderStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
      if (data?.easyParcelError) toast.error(data.message || data.easyParcelError);
      else toast.success(data?.message || "Status refreshed");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to refresh status"),
  });

  const cancelShipmentMutation = useMutation({
    mutationFn: (order) => cancelManualOrderShipment(order, { remark: "Cancelled from ERP manual order" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
      toast.success(data?.message || "EasyParcel shipment cancelled");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to cancel EasyParcel shipment"),
  });

  const deliveryInfoMutation = useMutation({
    mutationFn: ({ order, payload }) => updateManualOrderDeliveryInfo(order, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
      const updated = data?.order ? normalizeManualOrder(data.order) : null;
      if (updated && detailOrder) setDetailOrder(updated);
      setDeliveryEditOrder(null);
      toast.success(data?.message || "Delivery information updated");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to update delivery information"),
  });

  if (showAddPage) {
    return (
      <ManualOrderSubscriptionGate>
        <AddManualOrderPage
          mode={addMode}
          onBack={() => setShowAddPage(false)}
          onCreated={(order) => {
            setShowAddPage(false);
            queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
            const pdf = getManualWaybillPdf(order);
            if (hasManualWaybill(order) || pdf.url) openWaybill(order);
          }}
        />
      </ManualOrderSubscriptionGate>
    );
  }

  const toggleSelect = (id) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        setSelectedOrderRows((rows) => rows.filter((order) => order.id !== id));
        return current.filter((item) => item !== id);
      }

      const selectedOrder = orders.find((order) => order.id === id);
      if (selectedOrder) {
        setSelectedOrderRows((rows) => rows.some((order) => order.id === id) ? rows : [...rows, selectedOrder]);
      }
      return [...current, id];
    });
  };

  const toggleAll = async ({ allPages = false } = {}) => {
    setSelectionLoading(true);
    try {
      const sourceRows = allPages
        ? (await fetchManualOrders({ ...queryParams, page: 1, limit: 1000 })).orders || []
        : orders;

      setSelectedIds((current) => {
        const shouldClear = sourceRows.length && sourceRows.every((order) => current.includes(order.id));
        setSelectedOrderRows(shouldClear ? [] : sourceRows);
        return shouldClear ? [] : sourceRows.map((order) => order.id);
      });
    } finally {
      setSelectionLoading(false);
    }
  };

  const handlePush = (order) => {
    const status = String(order?.statusCode || "").toUpperCase();
    if (status !== "CANCELLED" && hasManualWaybill(order)) {
      openWaybill(order);
      return;
    }
    waybillMutation.mutate(order);
  };

  const handleDetails = (order) => {
    setDetailOrder(null);
    detailMutation.mutate(order);
  };

  const handleSearch = () => {
    setAppliedSearch(search);
    setSelectedIds([]);
    setSelectedOrderRows([]);
  };

  const handlePageSizeSearch = () => {
    const nextPageSize = Math.max(1, Number.parseInt(pageSizeInput, 10) || DEFAULT_MANUAL_ORDER_PAGE_SIZE);
    setPageSize(nextPageSize);
    setPageSizeInput(String(nextPageSize));
    setPage(1);
  };

  const openDeliveryEditor = (order) => {
    const info = order?.manualDeliveryInfo || {};
    setDetailOrder(null);
    setDeliveryEditOrder(order);
    setDeliveryForm({
      logisticCompany: order?.logisticCompany || info.logisticCompany || "",
      trackingNumber: order?.awbNumber || order?.trackingNo || info.trackingNumber || "",
      waybillUrl: order?.waybillPdfUrl || info.waybillUrl || "",
      waybillFile: null,
      note: info.note || "",
    });
  };

  const submitDeliveryInfo = () => {
    if (!deliveryEditOrder) return;
    deliveryInfoMutation.mutate({ order: deliveryEditOrder, payload: deliveryForm });
  };

  const handleDeliveryWaybillFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error(tr("Waybill upload must be a PDF file."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(tr("Waybill PDF file size must be 5MB or less."));
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setDeliveryForm((current) => ({
        ...current,
        waybillFile: { name: file.name, type: file.type, size: file.size, dataUrl },
      }));
    } catch (err) {
      toast.error(err?.message || tr("Failed to read waybill PDF file"));
    }
  };

  return (
    <ManualOrderSubscriptionGate>
      <div className="space-y-4 font-body">
        <Topbar PageTitle="Manual Order" />

      <div className="rounded-xl border border-surface-border bg-white p-4">
        <div className="grid grid-cols-12 items-end gap-3">
          <div className="col-span-12 md:col-span-3">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Manual Order Status</p>
            <select
              key={`manual-status-select-${language}`}
              value={activeStatus}
              onChange={(event) => {
                setActiveStatus(event.target.value);
                setSelectedIds([]);
                setSelectedOrderRows([]);
              }}
              className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary"
            >
              {STATUS_GROUP_LABELS.map((group) => (
                <optgroup key={`${group}-${language}`} label={tr(group)}>
                  {STATUS_FILTERS.filter((status) => status.group === group).map((status) => (
                    <option key={`${status.value}-${language}`} value={status.value}>
                      {tr(status.label)}{status.value !== "ALL" && statusCounts[status.value] !== undefined ? ` (${statusCounts[status.value]})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-2">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Payment</p>
            <select
              value={paymentType}
              onChange={(event) => setPaymentType(event.target.value)}
              className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary"
            >
              <option value="ALL">All</option>
              <option value="PREPAID">Prepaid</option>
            </select>
          </div>
          <div className="col-span-12 md:col-span-2">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Search Type</p>
            <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary">
              {SEARCH_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="col-span-12 md:col-span-2">
            <select value={skuType} onChange={(e) => setSkuType(e.target.value)} className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary">
              {SKU_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="relative col-span-12 md:col-span-2">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full rounded-lg border border-surface-border bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-primary"
            />
          </div>
          <button onClick={handleSearch} className="col-span-12 rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary-dark md:col-span-1">Search</button>
        </div>
      </div>

      <div className="rounded-xl border border-surface-border bg-white overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 font-display">Manual Order List</h2>
              <p className="mt-1 text-xs text-slate-400">Manual orders are shown only here and are not mixed with Order Processing orders.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setAddMode("gift"); setShowAddPage(true); }}
                className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card"
              >
                <Gift size={14} className="text-slate-500" />
                Add Gift
              </button>
              <button
                onClick={() => { setAddMode("order"); setShowAddPage(true); }}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                <Plus size={14} />
                Add Manual Order
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 border-b border-surface-border overflow-x-auto">
            {STATUS_FILTERS.map((status) => (
              <button
                key={`${status.value}-${language}`}
                onClick={() => {
                setActiveStatus(status.value);
                setSelectedIds([]);
                setSelectedOrderRows([]);
              }}
                className={`relative whitespace-nowrap pb-3 text-sm font-medium transition-colors ${activeStatus === status.value ? "font-semibold text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : "text-slate-500 hover:text-slate-700"}`}
              >
                {tr(status.label)}
              </button>
            ))}
          </div>
        </div>

        <ManualOrderTable
          orders={paginatedOrders}
          loading={manualOrdersQuery.isFetching}
          isError={manualOrdersQuery.isError}
          onRetry={() => manualOrdersQuery.refetch()}
          selectedIds={selectedIds}
          selectionLoading={selectionLoading}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          onDetails={handleDetails}
          onPush={handlePush}
          onCancel={(order) => cancelShipmentMutation.mutate(order)}
          onRefreshStatus={(order) => refreshStatusMutation.mutate(order)}
          onUpdateManualDelivery={openDeliveryEditor}
          pushLoadingId={waybillMutation.isPending ? waybillMutation.variables?.id : ""}
          cancelLoadingId={cancelShipmentMutation.isPending ? cancelShipmentMutation.variables?.id : ""}
          refreshLoadingId={refreshStatusMutation.isPending ? refreshStatusMutation.variables?.id : ""}
        />

        <PageSizePagination
          page={effectivePage}
          limit={pageSize}
          total={orders.length}
          onPageChange={setPage}
          pageSizeInput={pageSizeInput}
          onPageSizeInputChange={setPageSizeInput}
          onApplyPageSize={handlePageSizeSearch}
          loading={manualOrdersQuery.isFetching}
        />

        <OrderFooter selectedRows={selectedRows} columns={MANUAL_ORDER_OUTPUT_COLUMNS} title="Manual Orders" />
      </div>

      <WaybillPdfModal
        open={waybillPdf.open}
        title="EasyParcel Waybill PDF"
        pdfUrl={waybillPdf.url}
        previewUrl={waybillPdf.previewUrl}
        filename={waybillPdf.filename}
        loading={waybillMutation.isPending}
        onClose={() => setWaybillPdf((current) => ({ ...current, open: false }))}
      />

      <ManualOrderDetailModal
        open={Boolean(detailOrder)}
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onPrintWaybill={openWaybill}
        onUpdateManualDelivery={openDeliveryEditor}
      />

      {detailMutation.isPending && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="flex w-full max-w-sm flex-col items-center rounded-2xl bg-white px-8 py-7 text-center shadow-2xl">
            <Loader2 size={30} className="animate-spin text-primary" />
            <h3 className="mt-4 text-base font-bold text-slate-900">{tr("Loading Details")}</h3>
            <p className="mt-2 text-sm text-slate-500">{tr("Loading manual order details...")}</p>
          </div>
        </div>
      )}

      {deliveryEditOrder && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-surface-border px-6 py-5">
              <h3 className="text-base font-bold text-slate-900">{tr("Update Delivery Information")}</h3>
              <p className="mt-1 text-xs text-slate-500">{deliveryEditOrder.orderNo}</p>
            </div>
            <div className="space-y-4 px-6 py-5">
              {[
                [tr("Courier / Delivery Company"), "logisticCompany", tr("Courier name")],
                [tr("Tracking Number / AWB"), "trackingNumber", tr("Tracking number")],
                [tr("Waybill URL"), "waybillUrl", "https://..."],
              ].map(([label, key, placeholder]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
                  <input
                    value={deliveryForm[key]}
                    onChange={(event) => setDeliveryForm((current) => ({ ...current, [key]: event.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
                  />
                </label>
              ))}
              <div>
                <span className="mb-1 block text-xs font-semibold text-slate-600">{tr("Waybill PDF")}</span>
                <input
                  id="manual-delivery-waybill-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleDeliveryWaybillFile}
                  className="hidden"
                />
                <label
                  htmlFor="manual-delivery-waybill-upload"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-surface-border px-3 py-3 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
                >
                  <UploadCloud size={16} />
                  {deliveryForm.waybillFile ? tr("Change Waybill PDF") : tr("Upload Waybill PDF")}
                </label>
                {deliveryForm.waybillFile && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span className="min-w-0 truncate" title={deliveryForm.waybillFile.name}>{deliveryForm.waybillFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setDeliveryForm((current) => ({ ...current, waybillFile: null }))}
                      className="font-semibold text-red-500 hover:underline"
                    >
                      {tr("Remove")}
                    </button>
                  </div>
                )}
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">{tr("Note")}</span>
                <textarea
                  value={deliveryForm.note}
                  onChange={(event) => setDeliveryForm((current) => ({ ...current, note: event.target.value }))}
                  rows={3}
                  placeholder={tr("Delivery note")}
                  className="w-full resize-none rounded-lg border border-surface-border px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t border-surface-border px-6 py-4">
              <button
                type="button"
                onClick={() => setDeliveryEditOrder(null)}
                className="rounded-xl border border-surface-border px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-card"
              >
                {tr("Cancel")}
              </button>
              <button
                type="button"
                onClick={submitDeliveryInfo}
                disabled={deliveryInfoMutation.isPending}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {deliveryInfoMutation.isPending ? tr("Saving...") : tr("Save")}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ManualOrderSubscriptionGate>
  );
}

function hasManualWaybill(order) {
  const trackingNo = String(order?.trackingNo || "").trim();
  return Boolean(
    order?.easyParcel?.awb ||
      order?.easyParcel?.awbLink ||
      order?.waybillPdfUrl ||
      order?.logistics?.awbLink ||
      (trackingNo && trackingNo !== "-")
  );
}

function getManualWaybillPdf(order = {}, response = {}) {
  if (response instanceof Blob) {
    return { url: URL.createObjectURL(response), filename: inferPdfFilename("", order?.orderNo) };
  }

  if (typeof response === "string") {
    return { url: resolvePdfUrl(response), filename: inferPdfFilename(response, order?.orderNo) };
  }

  const easyParcel = response?.easyParcel || order?.easyParcel || {};
  const paymentParcel = easyParcel?.paymentResponse?.result?.[0]?.parcel?.[0] || {};
  const candidates = [
    response?.pdfUrl,
    response?.waybillPdfUrl,
    response?.awbLink,
    response?.url,
    response?.fileUrl,
    order?.waybillPdfUrl,
    order?.logistics?.awbLink,
    easyParcel?.pdfUrl,
    easyParcel?.waybillPdfUrl,
    easyParcel?.labelUrl,
    easyParcel?.awbLink,
    easyParcel?.awb_id_link,
    easyParcel?.awbUrl,
    easyParcel?.awb_url,
    paymentParcel?.awb_id_link,
    paymentParcel?.awbLink,
    paymentParcel?.awb_url,
  ];
  const rawUrl = candidates.find((value) => typeof value === "string" && value.trim());
  const rawFilename = response?.pdfFilename || response?.fileName || response?.filename || order?.waybillPdfFilename || easyParcel?.pdfFilename || easyParcel?.fileName || "";
  const url = resolvePdfUrl(rawUrl || "");
  const filename = rawFilename || inferPdfFilename(rawUrl, order?.orderNo);

  return { url, filename };
}

function resolvePdfUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^(blob:|data:)/i.test(trimmed)) return trimmed;
  if (/^https?:/i.test(trimmed)) return resolveHostedUrl(trimmed);
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 200) return `data:application/pdf;base64,${trimmed}`;

  const baseUrl = resolveBackendOrigin();
  const path = stripApiPrefix(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  return `${baseUrl}${path}`;
}

function getManualWaybillPreviewUrl(order = {}, response = {}) {
  const sourceOrder = response?.order || response?.manualOrder || order;
  const id = sourceOrder?.rawId || sourceOrder?.id || order?.rawId || order?.id || "";
  const manualOrderId = String(id || "").replace(/^manual:/, "");
  if (!manualOrderId) return "";
  return `${resolveApiBaseUrl()}/order-management/manual-orders/${encodeURIComponent(manualOrderId)}/waybill-pdf`;
}

function resolveApiBaseUrl() {
  return resolveHostedUrl(import.meta.env.VITE_AUTH_BASE_URL || window.location.origin || "").replace(/\/+$/, "");
}

function resolveBackendOrigin() {
  const configured = String(import.meta.env.VITE_AUTH_BASE_URL || window.location.origin || "").trim();
  try {
    const url = new URL(resolveHostedUrl(configured), window.location.origin);
    return url.origin;
  } catch {
    return configured.replace(/\/api\/v\d+\/?$/i, "").replace(/\/+$/, "");
  }
}

function resolveHostedUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || typeof window === "undefined") return raw;
  try {
    const url = new URL(raw, window.location.origin);
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase());
    const currentIsLocal = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname.toLowerCase());
    if (isLocal && !currentIsLocal) {
      return `${window.location.origin}${url.pathname}${url.search}${url.hash}`;
    }
    return url.href;
  } catch {
    return raw;
  }
}

function stripApiPrefix(path = "") {
  return path.replace(/^\/api\/v\d+(?=\/)/i, "");
}

function inferPdfFilename(value, orderNo) {
  const trimmed = String(value || "").trim();
  const withoutQuery = trimmed.split("?")[0];
  const fromPath = withoutQuery.split("/").filter(Boolean).pop();
  if (fromPath && fromPath.toLowerCase().endsWith(".pdf")) return fromPath;
  return `${orderNo || "easyparcel-waybill"}.pdf`;
}
