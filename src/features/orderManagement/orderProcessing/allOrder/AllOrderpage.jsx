import { useNavigate } from "react-router-dom";
import { Calendar, X } from "lucide-react";
import { useMemo, useState } from "react";
import Topbar from "../../../../components/layout/Topbar";
import OrderProcessingFilterBar from "../../shared/components/OrderProcessingFilterBar";
import OrderTable from "../../shared/components/OrderTable";
import OrderFooter from "../../shared/components/OrderFooter";
import { useOrderList } from "../../shared/hooks/useOrderList";

const SECONDS_IN_DAY = 24 * 60 * 60;

const startOfTodaySeconds = () => {
  const now = new Date();
  return Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
};

const endOfTodaySeconds = () => Math.floor(Date.now() / 1000);

const getPresetRange = (preset) => {
  const end = endOfTodaySeconds();
  if (preset === "today") return { start: startOfTodaySeconds(), end };
  if (preset === "last_month") return { start: end - 30 * SECONDS_IN_DAY, end };
  return { start: end - 7 * SECONDS_IN_DAY, end };
};

const formatDateInput = (seconds) => {
  const date = new Date(seconds * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateInputToSeconds = (value, endOfDay = false) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59)
    : new Date(year, month - 1, day, 0, 0, 0);
  return Math.floor(date.getTime() / 1000);
};

export default function AllOrderPage() {
  const navigate = useNavigate();
  const [datePreset, setDatePreset] = useState("last_7_days");
  const [dateRange, setDateRange] = useState(() => getPresetRange("last_7_days"));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState(() => formatDateInput(dateRange.start));
  const [customEnd, setCustomEnd] = useState(() => formatDateInput(dateRange.end));
  const list = useOrderList({ pageType: "all", dateRange });

  const dateLabel = useMemo(() => {
    if (datePreset === "today") return "Today";
    if (datePreset === "last_month") return "Last 1 Month";
    if (datePreset === "custom") return `${formatDateInput(dateRange.start)} to ${formatDateInput(dateRange.end)}`;
    return "Last 7 Days";
  }, [datePreset, dateRange]);

  const applyPreset = (preset) => {
    const nextRange = getPresetRange(preset);
    setDatePreset(preset);
    setDateRange(nextRange);
    setCustomStart(formatDateInput(nextRange.start));
    setCustomEnd(formatDateInput(nextRange.end));
    setDatePickerOpen(false);
  };

  const applyCustomRange = () => {
    const start = dateInputToSeconds(customStart);
    const end = dateInputToSeconds(customEnd, true);
    if (!start || !end || start > end) return;
    setDatePreset("custom");
    setDateRange({ start, end });
    setDatePickerOpen(false);
  };

  const handleDetails = (order) => {
    list.cacheOrderForDetail(order);
    navigate(`/warehouse_management/orders/detail/${encodeURIComponent(order.id)}`, {
      state: { order },
    });
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Order Processing" />
      <OrderProcessingFilterBar {...list} />

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-surface-border/60">
          <h2 className="text-xl font-bold text-slate-800 font-display">All Orders</h2>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDatePickerOpen((open) => !open)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 bg-white hover:bg-surface-card transition-colors"
            >
              <Calendar size={13} className="text-slate-400" />
              {dateLabel}
            </button>

            {datePickerOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-96 rounded-xl border border-surface-border bg-white p-4 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Select Date Range</p>
                  <button
                    type="button"
                    onClick={() => setDatePickerOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Close date picker"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["today", "Today"],
                    ["last_7_days", "Last 7 Days"],
                    ["last_month", "Last 1 Month"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => applyPreset(value)}
                      className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                        datePreset === value
                          ? "border-primary bg-primary text-white"
                          : "border-surface-border text-slate-600 hover:bg-surface-card"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Start
                    <input
                      type="date"
                      value={customStart}
                      onChange={(event) => setCustomStart(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-surface-border px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-primary"
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    End
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(event) => setCustomEnd(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-surface-border px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-primary"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={applyCustomRange}
                  className="mt-3 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Apply Date Range
                </button>
              </div>
            )}
          </div>
        </div>

        <OrderStateMessage list={list} />

        <OrderTable
          orders={list.orders}
          loading={list.isLoading || list.isFetching}
          isError={list.isError}
          errorMessage={list.error?.message || "Failed to load orders"}
          selectedIds={list.selectedIds}
          onToggleSelect={list.toggleSelect}
          onToggleAll={list.toggleAll}
          allSelected={list.allSelected}
          pagination={list.pagination}
          page={list.page}
          setPage={list.setPage}
          showActionsCol={false}
          compact
          onDetails={handleDetails}
        />

        <OrderFooter selectedRows={list.selectedRows} />
      </div>
    </div>
  );
}

function OrderStateMessage({ list }) {
  if (list.isError) {
    return <div className="px-5 py-2 text-xs text-red-500">{list.error?.message || "Failed to load orders"}</div>;
  }
  return null;
}
