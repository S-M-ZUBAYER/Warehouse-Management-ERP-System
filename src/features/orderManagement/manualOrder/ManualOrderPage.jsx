import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift, Plus, Search } from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import OrderFooter from "../shared/components/OrderFooter";
import PageSizePagination from "../shared/components/PageSizePagination";
import WaybillPdfModal from "../shared/components/WaybillPdfModal";
import {
  cancelManualOrderShipment,
  createManualOrderWaybill,
  fetchManualOrderDetail,
  fetchManualOrders,
  normalizeManualOrder,
  refreshManualOrderStatus,
  updateManualOrderCodSettlement,
} from "../shared/utils/orderApi";
import AddManualOrderPage from "./component/AddManualOrderPage";
import ManualOrderDetailModal from "./component/ManualOrderDetailModal";
import ManualOrderTable from "./component/ManualOrderTable";

const STATUS_FILTERS = [
  { value: "CREATED", label: "Created", group: "Order" },
  { value: "BOOKING_PENDING", label: "Booking Pending", group: "Order" },
  { value: "BOOKING_FAILED", label: "Booking Failed", group: "Order" },
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
  { label: "COD", key: "codAmount" },
  { label: "AWB", key: "awbNumber" },
  { label: "Shipment Status", key: "status" },
  { label: "COD Status", key: "codStatus" },
  { label: "Created", key: "createdAt" },
];
const DEFAULT_MANUAL_ORDER_PAGE_SIZE = 10;

export default function ManualOrderPage() {
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
  const [waybillPdf, setWaybillPdf] = useState({ open: false, url: "", filename: "easyparcel-waybill.pdf" });

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

  const openWaybill = (order, response = {}) => {
    const pdf = getManualWaybillPdf(order, response);
    setWaybillPdf({ open: true, url: pdf.url, filename: pdf.filename });
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

  const codSettlementMutation = useMutation({
    mutationFn: (order) => {
      const amount = Number(order?.codAmount || order?.orderValue || 0);
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      return updateManualOrderCodSettlement(order, {
        codStatus: "COD_PAID_TO_COMPANY",
        paidAmount: amount,
        settlementAmount: amount,
        reference: `EP-COD-PAYOUT-${today}`,
        note: "Verified from EasyParcel dashboard",
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
      toast.success(data?.message || "COD marked as paid");
    },
    onError: (err) => toast.error(err?.response?.data?.message || err?.message || "Failed to mark COD paid"),
  });

  if (showAddPage) {
    return (
      <AddManualOrderPage
        mode={addMode}
        onBack={() => setShowAddPage(false)}
        onCreated={(order) => {
          setShowAddPage(false);
          queryClient.invalidateQueries({ queryKey: ["manual-orders"] });
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

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Manual Order" />

      <div className="rounded-xl border border-surface-border bg-white p-4">
        <div className="grid grid-cols-12 items-end gap-3">
          <div className="col-span-12 md:col-span-3">
            <p className="mb-1.5 text-xs font-semibold text-slate-600">Manual Order Status</p>
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

        <ManualOrderTable
          orders={paginatedOrders}
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
          onMarkCodPaid={(order) => codSettlementMutation.mutate(order)}
          pushLoadingId={waybillMutation.isPending ? waybillMutation.variables?.id : ""}
          cancelLoadingId={cancelShipmentMutation.isPending ? cancelShipmentMutation.variables?.id : ""}
          refreshLoadingId={refreshStatusMutation.isPending ? refreshStatusMutation.variables?.id : ""}
          codSettlementLoadingId={codSettlementMutation.isPending ? codSettlementMutation.variables?.id : ""}
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
        filename={waybillPdf.filename}
        loading={waybillMutation.isPending}
        onClose={() => setWaybillPdf((current) => ({ ...current, open: false }))}
      />

      <ManualOrderDetailModal
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
  return `${orderNo || "easyparcel-waybill"}.pdf`;
}
