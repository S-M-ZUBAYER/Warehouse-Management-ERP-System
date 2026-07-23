import { AlertCircle, ChevronDown, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import Topbar from "../../../components/layout/Topbar";
import InvFooter from "../shared/components/InvFooter";
import calendarIcon from "../../../assets/calendar.svg";
import {
  useInventoryLog,
  MOVEMENT_TYPE_OPTIONS,
} from "./hooks/useInventoryLog";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} ${hours}:${minutes}`;
};

const PURPOSE_LABELS = {
  inbound_receipt: "Inbound",
  sale_deduction: "Sales deduction",
  manual_adjustment: "Manual adjustment",
  return: "Manual Inbound",
  write_off: "Write off",
  transfer_out: "Outbound",
  transfer_in: "Transfer in",
};

const PURPOSE_TRANSLATIONS = {
  en: {
    Purpose: "Purpose",
    Inbound: "Inbound",
    Outbound: "Outbound",
    "Sales deduction": "Sales deduction",
    "Manual adjustment": "Manual adjustment",
    "Manual Inbound": "Manual Inbound",
    "Write off": "Write off",
    "Transfer in": "Transfer in",
  },
  zh: {
    Purpose: "用途",
    Inbound: "入库",
    Outbound: "出库",
    "Sales deduction": "销售扣减",
    "Manual adjustment": "手动调整",
    "Manual Inbound": "手动入库",
    "Write off": "报废",
    "Transfer in": "调入",
  },
  fil: {
    Purpose: "Layunin",
    Inbound: "Papasok",
    Outbound: "Palabas",
    "Sales deduction": "Bawas sa benta",
    "Manual adjustment": "Manu-manong pagsasaayos",
    "Manual Inbound": "Manu-manong papasok",
    "Write off": "Pagbawas",
    "Transfer in": "Paglipat papasok",
  },
  id: {
    Purpose: "Tujuan",
    Inbound: "Masuk",
    Outbound: "Keluar",
    "Sales deduction": "Pengurangan penjualan",
    "Manual adjustment": "Penyesuaian manual",
    "Manual Inbound": "Masuk manual",
    "Write off": "Penghapusan",
    "Transfer in": "Transfer masuk",
  },
  th: {
    Purpose: "วัตถุประสงค์",
    Inbound: "รับเข้า",
    Outbound: "ส่งออก",
    "Sales deduction": "ตัดสต็อกจากการขาย",
    "Manual adjustment": "ปรับด้วยตนเอง",
    "Manual Inbound": "รับเข้าด้วยตนเอง",
    "Write off": "ตัดจำหน่าย",
    "Transfer in": "โอนเข้า",
  },
  vi: {
    Purpose: "Mục đích",
    Inbound: "Nhập kho",
    Outbound: "Xuất kho",
    "Sales deduction": "Trừ do bán hàng",
    "Manual adjustment": "Điều chỉnh thủ công",
    "Manual Inbound": "Nhập thủ công",
    "Write off": "Xóa sổ",
    "Transfer in": "Chuyển vào",
  },
  ms: {
    Purpose: "Tujuan",
    Inbound: "Masuk",
    Outbound: "Keluar",
    "Sales deduction": "Tolakan jualan",
    "Manual adjustment": "Pelarasan manual",
    "Manual Inbound": "Masuk manual",
    "Write off": "Hapus kira",
    "Transfer in": "Pindahan masuk",
  },
};

const translatePurposeText = (label, language) => {
  const lang = String(language || "en").split("-")[0];
  return PURPOSE_TRANSLATIONS[lang]?.[label] ?? PURPOSE_TRANSLATIONS.en[label] ?? label;
};

const getPurpose = (log, language) => {
  const movementType = String(log?.movement_type ?? log?.movementType ?? "")
    .trim()
    .toLowerCase();

  const label = PURPOSE_LABELS[movementType];
  return label ? translatePurposeText(label, language) : "-";
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton row
// ─────────────────────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr className="border-b border-surface-border animate-pulse">
    {Array.from({ length: 8 }).map((_, i) => (
      <td key={i} className="py-4 pr-4 pl-2">
        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
      </td>
    ))}
  </tr>
);

const openDatePicker = (input) => {
  input?.focus();
  try {
    input?.showPicker?.();
  } catch {
    // Some browsers only allow showPicker from a direct click.
  }
};

const DateFilterInput = ({ value, onChange }) => (
  <div
    className="relative"
    onClick={(e) => openDatePicker(e.currentTarget.querySelector("input"))}
  >
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => openDatePicker(e.currentTarget)}
      className="inventory-log-date-input w-full pl-3 pr-10 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
    />
    <img
      src={calendarIcon}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2"
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────────────────────────────────────────
const Pagination = ({ pagination, page, setPage, isFetching }) => {
  const { total = 0, totalPages = 1, limit = 10 } = pagination;
  const currentPage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const to = Math.min(currentPage * limit, total);

  // Build page numbers — show up to 5 around current page
  const getPages = () => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage >= totalPages - 2)
      return [
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-surface-border">
      {/* Left: record count */}
      <p className="text-xs text-slate-500">
        Showing <span className="font-semibold text-slate-700">{from}</span>
        {" – "}
        <span className="font-semibold text-slate-700">{to}</span>
        {" of "}
        <span className="font-semibold text-slate-700">{total}</span>
        {" records"}
        {isFetching && (
          <span className="ml-2 inline-block w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin align-middle" />
        )}
      </p>

      {/* Right: page controls */}
      {total > 0 && (
      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          disabled={currentPage <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-surface-border bg-white text-slate-500 disabled:opacity-40 hover:border-primary hover:text-primary transition-all"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page numbers */}
        {getPages().map((pg) => (
          <button
            key={pg}
            onClick={() => setPage(pg)}
            className={`w-8 h-8 text-xs font-medium rounded-lg border transition-all ${
              pg === currentPage
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-slate-600 border-surface-border hover:border-primary hover:text-primary"
            }`}
          >
            {pg}
          </button>
        ))}

        {/* Next */}
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-surface-border bg-white text-slate-500 disabled:opacity-40 hover:border-primary hover:text-primary transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// InventoryLogPage
// ─────────────────────────────────────────────────────────────────────────────
export default function InventoryLogPage() {
  const { i18n } = useTranslation();
  const {
    warehouseId,
    setWarehouseId,
    movementType,
    setMovementType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    skuName,
    setSkuName,
    handleSearch,
    page,
    setPage,
    items,
    pagination,
    warehouses,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    selectedIds,
    selectedItems,
    selectionLoading,
    toggleSelect,
    toggleAll,
    allSelected,
  } = useInventoryLog();

  console.log("items", items);
  const purposeHeader = translatePurposeText("Purpose", i18n.language);
  const selectedRows = selectedItems.length === selectedIds.length
    ? selectedItems
    : items.filter((log) => selectedIds.includes(log.id));

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Inventory log" />

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div
          className={`grid gap-3 ${
            movementType === "history"
              ? "grid-cols-5 max-w-5xl"
              : "grid-cols-3 max-w-2xl"
          }`}
        >
          {/* Type */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">Type</p>
            <div className="relative">
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                {MOVEMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {movementType === "history" && (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5">
                  Start Date
                </p>
                <DateFilterInput value={startDate} onChange={setStartDate} />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1.5">
                  End Date
                </p>
                <DateFilterInput value={endDate} onChange={setEndDate} />
              </div>
            </>
          )}

          {/* Select Warehouse */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Select Warehouse
            </p>
            <div className="relative">
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
              >
                <option value="">Warehouse name here</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Seller SKU */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-1.5">
              Seller SKU
            </p>

            <div className="relative">
              <input
                type="text"
                placeholder="Input seller SKU here"
                value={skuName}
                onChange={(e) => setSkuName(e.target.value)}
                className="w-full pl-3 pr-10 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />

              {/* 🔍 Search Icon */}
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100 transition"
              >
                <Search size={16} className="text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {/* ── Table card ── */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
              <tr className="border-b border-surface-border">
                <th className="py-3 pl-5 w-12 text-left">
                  {selectionLoading ? (
                    <Loader2 size={16} className="text-primary animate-spin" />
                  ) : (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                    />
                  )}
                </th>
                {[
                  "SL No",
                  "Seller SKU",
                  "Stock In Quantity",
                  "Stock Out Quantity",
                  purposeHeader,
                  "Remaining Quantity",
                  "Operation Time",
                ].map((h) => (
                  <th
                    key={h}
                    className="py-3 pr-4 text-left text-sm font-semibold text-slate-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle size={36} className="text-red-400 opacity-70" />
                      <p className="text-sm font-medium text-slate-700">
                        {error?.response?.data?.message ?? error?.message ?? "Failed to load inventory log"}
                      </p>
                      <button
                        type="button"
                        onClick={refetch}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <RefreshCw size={12} /> Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-16 text-center text-slate-400 text-sm"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                items.map((log, idx) => {
                  const delta = log.quantity_delta ?? 0;
                  const stockIn = delta > 0 ? delta : 0;
                  const stockOut = delta < 0 ? Math.abs(delta) : 0;
                  const purpose = getPurpose(log, i18n.language);
                  const remaining = log.qty_on_hand_after ?? 0;
                  const sl = String(
                    (page - 1) * pagination.limit + idx + 1,
                  ).padStart(2, "0");

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-surface/50 transition-colors ${
                        selectedIds.includes(log.id) ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <td className="pl-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(log.id)}
                          onChange={() => toggleSelect(log.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 pr-4 text-slate-700">{sl}</td>
                      <td className="py-3.5 pr-4 font-mono text-slate-700">
                        {log.merchantSku?.sku_name ?? "—"}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-700">{stockIn}</td>
                      <td className="py-3.5 pr-4 text-slate-700">{stockOut}</td>
                      <td className="py-3.5 pr-4 text-slate-700">
                        {purpose}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-700">
                        {remaining.toLocaleString()}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-500 text-xs">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination (replaces InvFooter pagination) ── */}
        <Pagination
          pagination={pagination}
          page={page}
          setPage={setPage}
          isFetching={isFetching}
        />

        {/* ── Export / Print footer ── */}
        <InvFooter
          selectedRows={selectedRows}
          filename="inventory-log.csv"
          title="Selected Inventory Log Records"
          itemName="inventory log"
          columns={[
            { label: "Seller SKU", render: (row) => row.merchantSku?.sku_name || "" },
            { label: "Quantity Delta", key: "quantity_delta" },
            { label: purposeHeader, render: (row) => getPurpose(row, i18n.language) },
            { label: "Remaining Quantity", key: "qty_on_hand_after" },
            { label: "Operation Time", key: "createdAt" },
          ]}
        />
      </div>

      <style>{`
        .inventory-log-date-input::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
