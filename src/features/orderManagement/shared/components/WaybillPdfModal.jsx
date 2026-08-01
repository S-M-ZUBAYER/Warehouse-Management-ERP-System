import { Download, Printer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function WaybillPdfModal({ open, title = "Waybill PDF", pdfUrl = "", filename = "waybill.pdf", loading = false, onClose }) {
  const iframeRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  useEffect(() => {
    if (!open || !pdfUrl || loading) {
      setPreviewUrl("");
      setPreviewError("");
      setPreviewLoading(false);
      return undefined;
    }

    if (/^(blob:|data:)/i.test(pdfUrl)) {
      setPreviewUrl(pdfUrl);
      setPreviewError("");
      setPreviewLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let objectUrl = "";

    const loadPreview = async () => {
      setPreviewLoading(true);
      setPreviewError("");

      try {
        const token = localStorage.getItem("whmAccessToken");
        const response = await fetch(pdfUrl, {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!response.ok) throw new Error(`PDF preview failed (${response.status})`);

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (error) {
        if (error.name !== "AbortError") {
          setPreviewUrl("");
          setPreviewError("Preview blocked by the PDF server. Print and download still use the original file.");
        }
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [loading, open, pdfUrl]);

  if (!open) return null;

  const handlePrint = () => {
    const printableUrl = previewUrl || pdfUrl;
    if (!printableUrl) return;

    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      }
    } catch {
      // Cross-origin PDFs can block iframe printing. Fall back to a printable tab.
    }

    const printWindow = window.open(printableUrl, "_blank", "noopener,noreferrer");
    if (printWindow) {
      const printWhenReady = () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch {
          // Browser may block programmatic printing for external PDFs; the PDF tab remains open.
        }
      };
      setTimeout(printWhenReady, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4 py-6 font-body">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {loading ? "Preparing EasyParcel waybill PDF..." : filename}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_230px]">
          <div className="flex h-[68vh] min-h-[520px] items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-slate-50 shadow-sm">
            {loading || previewLoading ? (
              <div className="text-sm font-semibold text-slate-500">Loading waybill PDF...</div>
            ) : previewUrl ? (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                title="EasyParcel Waybill PDF Preview"
                className="h-full w-full"
                referrerPolicy="no-referrer"
              />
            ) : previewError ? (
              <div className="px-6 text-center text-sm font-semibold text-slate-500">
                {previewError}
              </div>
            ) : (
              <div className="px-6 text-center text-sm font-semibold text-slate-500">
                No EasyParcel PDF was returned for this manual order.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-surface-border p-4">
            <p className="text-sm font-bold text-slate-800">PDF Actions</p>
            <p className="mt-1 text-xs text-slate-500">Print or download the original EasyParcel waybill PDF.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={!pdfUrl || loading || previewLoading}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Printer size={15} />
                Print
              </button>
              <a
                href={pdfUrl || undefined}
                download={filename}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center justify-center gap-2 rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold transition-colors ${
                  pdfUrl && !loading
                    ? "text-slate-700 hover:bg-surface-card"
                    : "pointer-events-none text-slate-300"
                }`}
              >
                <Download size={15} />
                Download
              </a>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-surface-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-surface-border px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
