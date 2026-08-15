import { useTranslation } from "react-i18next";
import { translateStaticText } from "../../i18nDomTranslator";

export default function ListPageSizePagination({
  page,
  limit,
  total,
  itemLabel,
  pageSizeInput,
  onPageChange,
  onPageSizeInputChange,
  onApplyPageSize,
  loading = false,
}) {
  const { i18n } = useTranslation();

  if (!total) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const language = i18n.resolvedLanguage || i18n.language;
  const translatedItemLabel = translateStaticText(itemLabel.toLowerCase(), language);
  const pageSizeLabel = translateStaticText(`${itemLabel} per page`, language);
  const showingLabel = translateStaticText("Showing", language);
  const ofLabel = translateStaticText("of", language);
  const pageLabel = translateStaticText("Page", language);
  const previousLabel = translateStaticText("Previous", language);
  const nextLabel = translateStaticText("Next", language);
  const searchLabel = translateStaticText("Search", language);
  const searchingLabel = translateStaticText("Searching...", language);

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-t border-surface-border px-5 py-4 md:grid-cols-3">
      <div className="flex flex-wrap items-center gap-3 md:justify-start">
        <p className="text-xs text-slate-500">
          {showingLabel} {start}-{end} {ofLabel} {total} {translatedItemLabel}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        <label className="flex items-center gap-2">
          <span>{pageSizeLabel}</span>
          <input
            type="number"
            min="1"
            value={pageSizeInput}
            onChange={(event) => onPageSizeInputChange?.(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onApplyPageSize?.();
            }}
            className="h-8 w-20 rounded-lg border border-surface-border bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-primary"
          />
        </label>
        <button
          type="button"
          onClick={() => onApplyPageSize?.()}
          disabled={loading}
          className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? searchingLabel : searchLabel}
        </button>
      </div>
      <div className="flex items-center gap-1 md:justify-end">
        <button
          type="button"
          onClick={() => onPageChange?.((value) => Math.max(1, value - 1))}
          disabled={page === 1 || loading}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          {previousLabel}
        </button>
        <span className="px-3 py-1.5 text-xs font-semibold text-primary">
          {pageLabel} {page} {ofLabel} {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange?.((value) => Math.min(totalPages, value + 1))}
          disabled={page === totalPages || loading}
          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs text-slate-600 transition-colors hover:bg-surface-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
