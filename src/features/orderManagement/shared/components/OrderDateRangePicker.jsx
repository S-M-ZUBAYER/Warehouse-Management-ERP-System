import { useEffect, useState } from "react";
import { Calendar, X } from "lucide-react";

export const SECONDS_IN_DAY = 24 * 60 * 60;

export const startOfTodaySeconds = () => {
  const now = new Date();
  return Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000);
};

export const endOfTodaySeconds = () => Math.floor(Date.now() / 1000);

const presetRangeCache = new Map();

const getLookbackStartSeconds = (days) => {
  if (!days) return null;
  return endOfTodaySeconds() - Math.max(1, Number(days) || 1) * SECONDS_IN_DAY;
};

export const getPresetRange = (preset) => {
  if (preset === "all_dates") return { start: null, end: null };
  const todayKey = new Date().toISOString().slice(0, 10);
  const cacheKey = `${preset || "last_7_days"}:${todayKey}`;
  const cachedRange = presetRangeCache.get(cacheKey);
  if (cachedRange) return { ...cachedRange };

  const end = endOfTodaySeconds();
  const range = preset === "today"
    ? { start: startOfTodaySeconds(), end }
    : preset === "last_month"
      ? { start: end - 30 * SECONDS_IN_DAY, end }
      : { start: end - 7 * SECONDS_IN_DAY, end };

  presetRangeCache.set(cacheKey, range);
  return { ...range };
};

export const formatDateInput = (seconds) => {
  if (!seconds) return "";
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

export const getDateRangeLabel = (datePreset, dateRange) => {
  if (datePreset === "all_dates") return "All dates";
  if (datePreset === "today") return "Today";
  if (datePreset === "last_month") return "Last 1 Month";
  if (datePreset === "custom") return `${formatDateInput(dateRange.start)} to ${formatDateInput(dateRange.end)}`;
  return "Last 7 Days";
};

export default function OrderDateRangePicker({ datePreset, setDatePreset, dateRange, setDateRange, allowAllDates = false, maxLookbackDays = null }) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState(() => formatDateInput(dateRange.start));
  const [customEnd, setCustomEnd] = useState(() => formatDateInput(dateRange.end));
  const minStartSeconds = getLookbackStartSeconds(maxLookbackDays);
  const minStartDate = formatDateInput(minStartSeconds);
  const maxEndDate = formatDateInput(endOfTodaySeconds());

  useEffect(() => {
    setCustomStart(formatDateInput(dateRange.start));
    setCustomEnd(formatDateInput(dateRange.end));
  }, [dateRange.start, dateRange.end]);

  const applyPreset = (preset) => {
    const nextRange = getPresetRange(preset);
    setDatePreset(preset);
    setDateRange(nextRange);
    setDatePickerOpen(false);
  };

  const applyCustomRange = () => {
    const start = dateInputToSeconds(customStart);
    const end = dateInputToSeconds(customEnd, true);
    if (!start || !end || start > end) return;
    if (minStartSeconds && start < minStartSeconds) return;
    if (end > endOfTodaySeconds()) return;
    setDatePreset("custom");
    setDateRange({ start, end });
    setDatePickerOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setDatePickerOpen((open) => !open)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 bg-white hover:bg-surface-card transition-colors"
      >
        <Calendar size={13} className="text-slate-400" />
        {getDateRangeLabel(datePreset, dateRange)}
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
              ...(allowAllDates ? [["all_dates", "All dates"]] : []),
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
                min={minStartDate}
                max={maxEndDate}
                className="mt-1 w-full rounded-lg border border-surface-border px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-primary"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              End
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                min={minStartDate}
                max={maxEndDate}
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
  );
}
