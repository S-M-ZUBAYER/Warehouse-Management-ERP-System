import { ChevronDown, Loader2, X } from "lucide-react";

export default function AddStoreModal({
  open,
  modal,
  countries,
  onClose,
  onPlatformChange,
  onCountryChange,
  onSubmit,
}) {
  if (!open) return null;

  const platformCountries = modal.platform ? countries[modal.platform] || [] : [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-surface-border">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h3 className="text-lg font-bold text-primary font-display mx-auto ">Add New Shop</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={modal.loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close add shop modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <p className="text-xs font-semibold text-primary-text mb-2">Platform</p>
            <div className="grid grid-cols-2 gap-3">
              {["Shopee", "TikTok"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPlatformChange(item)}
                  disabled={modal.loading}
                  className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                    modal.platform === item
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-surface-border text-slate-600 hover:border-primary/60"
                  } disabled:opacity-60`}
                >
                  {item}
                </button>
              ))}
            </div>
            {modal.errors?.platform && (
              <p className="mt-1.5 text-xs text-red-500">{modal.errors.platform}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-primary-text mb-2">Country</p>
            <div className="relative">
              <select
                value={modal.country}
                onChange={(e) => onCountryChange(e.target.value)}
                disabled={!modal.platform || modal.loading}
                className="w-full appearance-none rounded-lg border border-surface-border bg-white px-3 py-2.5 pr-9 text-sm text-slate-700 outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Select country</option>
                {platformCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
            {modal.errors?.country && (
              <p className="mt-1.5 text-xs text-red-500">{modal.errors.country}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-surface-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={modal.loading}
            className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={modal.loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-70"
          >
            {modal.loading && <Loader2 size={15} className="animate-spin" />}
            {modal.loading ? "Redirecting..." : "Authorize"}
          </button>
        </div>
      </div>
    </div>
  );
}
