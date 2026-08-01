import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift, Plus, Search } from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import OrderFooter from "../shared/components/OrderFooter";
import WaybillPdfModal from "../shared/components/WaybillPdfModal";
import {
  cancelManualOrderAfterShipLabel,
  createManualOrderAfterShipPickup,
  fetchAfterShipParcels,
  fetchManualOrderDetail,
  normalizeManualOrder,
  refreshManualOrderAfterShipStatus,
  submitManualOrderAfterShip,
  updateManualOrderCodSettlement,
} from "../shared/utils/orderApi";
import AddManualOrderAftershipPage from "./component/AddManualOrderAftershipPage";
import ManualOrderAftershipDetailModal from "./component/ManualOrderAftershipDetailModal";
import ManualOrderAftershipTable from "./component/ManualOrderAftershipTable";

const STATUS_FILTERS = [
  { value: "creating", label: "Creating", group: "Label" },
  { value: "created", label: "Created", group: "Label" },
  { value: "cancelling", label: "Cancelling", group: "Label" },
  { value: "cancelled", label: "Cancelled", group: "Label" },
  { value: "manifesting", label: "Manifesting", group: "Label" },
  { value: "manifested", label: "Manifested", group: "Label" },
  { value: "failed", label: "Failed", group: "Label" },
  { value: "ALL", label: "All", group: "All" },
];

const STATUS_GROUP_LABELS = ["Label", "All"];
const COUNTRY_OPTIONS = ["ALL", "PH", "VN", "TH", "ID", "MY", "SG"];

const SEARCH_TYPES = ["Single Search", "Batch Search"];
const SKU_TYPES = ["SKU", "Package Number", "Order Number", "Tracking Number"];
const MANUAL_ORDER_OUTPUT_COLUMNS = [
  { label: "Order No", key: "orderNo" },
  { label: "Label ID", key: "labelId" },
  { label: "Tracking Number", key: "awbNumber" },
  { label: "Courier", key: "logisticCompany" },
  { label: "AfterShip Status", key: "status" },
  { label: "Live Status", key: "liveStatus" },
  { label: "Payment", key: "paymentType" },
  { label: "Country", key: "country" },
  { label: "Created", key: "createdAt" },
];

export default function ManualOrderAftershipPage() {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState("created");
  const [country, setCountry] = useState("ALL");
  const [paymentType, setPaymentType] = useState("ALL");
  const [dateField, setDateField] = useState("createdAt");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchType, setSearchType] = useState("Single Search");
  const [skuType, setSkuType] = useState("Order Number");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedOrderRows, setSelectedOrderRows] = useState([]);
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [addMode, setAddMode] = useState("order");
  const [detailOrder, setDetailOrder] = useState(null);
  const [waybillPdf, setWaybillPdf] = useState({ open: false, url: "", filename: "aftership-waybill.pdf" });

  const queryParams = useMemo(() => ({
    status: activeStatus === "ALL" ? "" : activeStatus,
    country: country === "ALL" ? "" : country,
    paymentType,
    search: appliedSearch,
    dateFrom,
    dateTo,
    dateField,
    liveStatus: true,
    page: 1,
    limit: 200,
    searchType,
    skuType,
  }), [activeStatus, appliedSearch, country, dateField, dateFrom, dateTo, paymentType, searchType, skuType]);

  const manualOrdersQuery = useQuery({
    queryKey: ["manual-orders-aftership", queryParams],
    queryFn: () => fetchAfterShipParcels(queryParams),
    staleTime: 1000 * 30,
    placeholderData: (previous) => previous,
  });

  const orders = manualOrdersQuery.data?.orders || [];
  const statusCounts = manualOrdersQuery.data?.statusCounts || {};
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
  }, [queryParams]);

  const openWaybill = (order, response = {}) => {
    const pdf = getManualWaybillPdf(order, response);
    setWaybillPdf({ open: true, url: pdf.url, filename: pdf.filename });
  };

  const waybillMutation = useMutation({
    mutationFn: submitManualOrderAfterShip,
    onSuccess: (data, sourceOrder) => {
      const updatedOrder = normalizeManualOrder(data?.order || data?.manualOrder || data || sourceOrder?.raw || sourceOrder);
      queryClient.invalidateQueries({ queryKey: ["manual-orders-aftership"] });
      if (data?.afterShipError) {
        toast.error(data.message || data.afterShipError);
        return;
      }
      toast.success(data?.message || "AfterShip waybill is ready");
      openWaybill(updatedOrder, data);
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders-aftership"] });
      toast.error(err?.response?.data?.message || err?.message || "Failed to create AfterShip waybill");
    },
  });

  const detailMutation = useMutation({
    mutationFn: (order) => fetchManualOrderDetail(order.rawId || order.id),
    onSuccess: (order) => setDetailOrder(order),
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to load manual order details"),
  });

  const refreshStatusMutation = useMutation({
    mutationFn: refreshManualOrderAfterShipStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders-aftership"] });
      if (data?.afterShipError) toast.error(data.message || data.afterShipError);
      else toast.success(data?.message || "Status refreshed");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to refresh status"),
  });

  const cancelShipmentMutation = useMutation({
    mutationFn: (order) => cancelManualOrderAfterShipLabel(order, { reason: "Cancelled from ERP manual order", remark: "Customer requested cancellation" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders-aftership"] });
      toast.success(data?.message || "AfterShip label cancelled");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to cancel AfterShip label"),
  });

  const pickupMutation = useMutation({
    mutationFn: (order) => createManualOrderAfterShipPickup(order, buildDefaultPickupPayload()),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders-aftership"] });
      toast.success(data?.message || "AfterShip pickup created");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to create AfterShip pickup"),
  });

  const codSettlementMutation = useMutation({
    mutationFn: (order) => {
      const amount = Number(order?.codAmount || order?.orderValue || 0);
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      return updateManualOrderCodSettlement(order, {
        codStatus: "COD_PAID_TO_COMPANY",
        paidAmount: amount,
        settlementAmount: amount,
        reference: `EP-COD-PAYOUT-${today}`,
        note: "Verified from AfterShip dashboard",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders-aftership"] });
      toast.success(data?.message || "COD marked as paid");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to mark COD paid"),
  });

  if (showAddPage) {
    return (
      <AddManualOrderAftershipPage
        mode={addMode}
        onBack={() => setShowAddPage(false)}
        onCreated={(order) => {
          setShowAddPage(false);
          queryClient.invalidateQueries({ queryKey: ["manual-orders-aftership"] });
          if (hasManualWaybill(order)) openWaybill(order);
        }}
      />
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
        ? (await fetchAfterShipParcels({ ...queryParams, page: 1, limit: 1000 })).orders || []
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

  const handleSearch = () => {
    setAppliedSearch(search);
    setSelectedIds([]);
    setSelectedOrderRows([]);
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Manual Order by AfterShip" />

      <div className="rounded-xl border border-surface-border bg-white p-4">
        <div className="grid grid-cols-12 items-end gap-3">
          <div className="col-span-12 md:col-span-3">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">AfterShip Status</p>
            <select
              value={activeStatus}
              onChange={(event) => {
                setActiveStatus(event.target.value);
                setSelectedIds([]);
                setSelectedOrderRows([]);
              }}
              className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary"
            >
              {STATUS_GROUP_LABELS.map((group) => (
                <optgroup key={group} label={group}>
                  {STATUS_FILTERS.filter((status) => status.group === group).map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}{status.value !== "ALL" && statusCounts[status.value] !== undefined ? ` (${statusCounts[status.value]})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="col-span-12 md:col-span-1">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Country</p>
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary"
            >
              {COUNTRY_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
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
              <option value="COD">COD</option>
            </select>
          </div>
          <div className="col-span-12 md:col-span-2">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Date Field</p>
            <select value={dateField} onChange={(e) => setDateField(e.target.value)} className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary">
              <option value="createdAt">Created</option>
              <option value="updatedAt">Updated</option>
            </select>
          </div>
          <div className="col-span-12 md:col-span-2">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Date From</p>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary" />
          </div>
          <div className="col-span-12 md:col-span-2">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Date To</p>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-primary" />
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
              <h2 className="text-base font-bold text-slate-800 font-display">Manual Order by AfterShip List</h2>
              <p className="mt-1 text-xs text-slate-400">Showing AfterShip label parcels and label statuses from the Shipping API.</p>
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
                Add AfterShip Manual Order
              </button>
            </div>
          </div>

          <div className="flex items-center gap-5 border-b border-surface-border overflow-x-auto">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status.value}
                onClick={() => {
                setActiveStatus(status.value);
                setSelectedIds([]);
                setSelectedOrderRows([]);
              }}
                className={`relative whitespace-nowrap pb-3 text-sm font-medium transition-colors ${activeStatus === status.value ? "font-semibold text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary" : "text-slate-500 hover:text-slate-700"}`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        <ManualOrderAftershipTable
          orders={orders}
          loading={manualOrdersQuery.isFetching}
          isError={manualOrdersQuery.isError}
          onRetry={() => manualOrdersQuery.refetch()}
          selectedIds={selectedIds}
          selectionLoading={selectionLoading}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          onDetails={(order) => detailMutation.mutate(order)}
          onPush={handlePush}
          onCancel={(order) => cancelShipmentMutation.mutate(order)}
          onRefreshStatus={(order) => refreshStatusMutation.mutate(order)}
          onCreatePickup={(order) => pickupMutation.mutate(order)}
          onMarkCodPaid={(order) => codSettlementMutation.mutate(order)}
          pushLoadingId={waybillMutation.isPending ? waybillMutation.variables?.id : ""}
          cancelLoadingId={cancelShipmentMutation.isPending ? cancelShipmentMutation.variables?.id : ""}
          refreshLoadingId={refreshStatusMutation.isPending ? refreshStatusMutation.variables?.id : ""}
          pickupLoadingId={pickupMutation.isPending ? pickupMutation.variables?.id : ""}
          codSettlementLoadingId={codSettlementMutation.isPending ? codSettlementMutation.variables?.id : ""}
        />

        <OrderFooter selectedRows={selectedRows} columns={MANUAL_ORDER_OUTPUT_COLUMNS} title="Manual Orders" />
      </div>

      <WaybillPdfModal
        open={waybillPdf.open}
        title="AfterShip Waybill PDF"
        pdfUrl={waybillPdf.url}
        filename={waybillPdf.filename}
        loading={waybillMutation.isPending}
        onClose={() => setWaybillPdf((current) => ({ ...current, open: false }))}
      />

      <ManualOrderAftershipDetailModal
        open={Boolean(detailOrder)}
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onPrintWaybill={openWaybill}
      />
    </div>
  );
}

function hasManualWaybill(order) {
  const trackingNo = String(order?.trackingNo || "").trim();
  return Boolean(
    order?.afterShip?.trackingNumber ||
      order?.afterShip?.labelUrl ||
      order?.waybillPdfUrl ||
      order?.logistics?.awbLink ||
      (trackingNo && trackingNo !== "-")
  );
}

function buildDefaultPickupPayload() {
  const pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    pickupDate,
    pickupStartTime: "09:00:00",
    pickupEndTime: "18:00:00",
  };
}

function getManualWaybillPdf(order = {}, response = {}) {
  if (response instanceof Blob) {
    return { url: URL.createObjectURL(response), filename: inferPdfFilename("", order?.orderNo) };
  }

  if (typeof response === "string") {
    return { url: resolvePdfUrl(response), filename: inferPdfFilename(response, order?.orderNo) };
  }

  const afterShip = response?.afterShip || order?.afterShip || {};
  const candidates = [
    response?.pdfUrl,
    response?.waybillPdfUrl,
    response?.awbLink,
    response?.url,
    response?.fileUrl,
    order?.waybillPdfUrl,
    order?.logistics?.awbLink,
    afterShip?.labelUrl,
    afterShip?.waybillPdfUrl,
    afterShip?.pdfUrl,
  ];
  const rawUrl = candidates.find((value) => typeof value === "string" && value.trim());
  const rawFilename = response?.waybillPdfFilename || response?.pdfFilename || response?.fileName || response?.filename || order?.waybillPdfFilename || afterShip?.pdfFilename || "";
  const url = resolvePdfUrl(rawUrl || "");
  const filename = rawFilename || inferPdfFilename(rawUrl, order?.orderNo);

  return { url, filename };
}

function resolvePdfUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  if (/^(https?:|blob:|data:)/i.test(trimmed)) return trimmed;
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 200) return `data:application/pdf;base64,${trimmed}`;

  const baseUrl = resolveBackendOrigin();
  const path = stripApiPrefix(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
  return `${baseUrl}${path}`;
}

function resolveBackendOrigin() {
  const configured = String(import.meta.env.VITE_AUTH_BASE_URL || window.location.origin || "").trim();
  try {
    const url = new URL(configured, window.location.origin);
    return url.origin;
  } catch {
    return configured.replace(/\/api\/v\d+\/?$/i, "").replace(/\/+$/, "");
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
  return `${orderNo || "aftership-waybill"}.pdf`;
}
