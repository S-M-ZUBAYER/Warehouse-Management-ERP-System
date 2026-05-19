import { X } from "lucide-react";
import { useRef } from "react";
import ConfirmActionModal from "../../../../components/shared/ConfirmActionModal";

export default function OrderActionModals({ list }) {
  const failedOrders = list.failedShopeePackOrders || [];
  const failedPrintOrders = list.failedShopeePrintOrders || [];
  const iframeRef = useRef(null);

  const handlePrintAll = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  return (
    <>
      <ConfirmActionModal
        open={list.shopeeNoItemsModalOpen}
        title="No Items Selected"
        message="No Items Selected"
        confirmLabel="OK"
        cancelLabel="Close"
        onCancel={list.closeShopeeNoItemsModal}
        onConfirm={list.closeShopeeNoItemsModal}
      />

      <ConfirmActionModal
        open={list.shopeePackConfirmOpen}
        title="Order Accepted & Packages"
        message={`Are you sure you have completed packaging ${list.shopeePackConfirmCount || 0} order(s)?`}
        confirmLabel="Confirm"
        loading={list.shopeePackLoading}
        onCancel={list.cancelShopeePack}
        onConfirm={list.confirmShopeePack}
      />

      <ConfirmActionModal
        open={list.shopeePrintConfirmOpen}
        title="Shopee AWB Print"
        message={list.shopeePrintConfirmMessage}
        confirmLabel="Confirm"
        loading={list.shopeeAwbLoading}
        onCancel={list.cancelShopeePrint}
        onConfirm={list.confirmShopeePrint}
      />

      {failedOrders.length > 0 && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Failed Shopee Orders</h3>
                <p className="mt-1 text-xs text-slate-500">These orders could not be accepted and packaged.</p>
              </div>
              <button
                type="button"
                onClick={list.closeFailedShopeePackOrders}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>

            <div className="max-h-80 overflow-auto px-6 py-4">
              <div className="space-y-3">
                {failedOrders.map((order) => (
                  <div key={order.orderId} className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-sm font-semibold text-red-700">{order.orderId}</p>
                    <p className="mt-1 text-xs text-red-600">{order.reason || "Unknown error"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-surface-border px-6 py-4">
              <button
                type="button"
                onClick={list.closeFailedShopeePackOrders}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {list.shopeeAwbModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Shopee AWB Printing</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {list.shopeeAwbLoading ? "Preparing shipping document..." : "Preview the shipping document before printing."}
                </p>
              </div>
              <button
                type="button"
                onClick={list.closeShopeeAwbModal}
                disabled={list.shopeeAwbLoading}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-4 p-6 lg:grid-cols-[420px_1fr]">
              <div className="flex h-[570px] items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-slate-50 shadow-sm">
                {list.shopeeAwbLoading ? (
                  <div className="text-sm font-semibold text-slate-500">Loading AWB PDF...</div>
                ) : list.shopeeAwbPdfUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={list.shopeeAwbPdfUrl}
                    title="Shopee AWB Preview"
                    className="h-full w-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-500">No PDF Loaded</div>
                )}
              </div>

              <div className="flex flex-col">
                <div className="rounded-xl border border-surface-border p-4">
                  <p className="text-sm font-bold text-slate-800">Print Actions</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Use Print All Pages after the AWB preview loads.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handlePrintAll}
                      disabled={!list.shopeeAwbPdfUrl || list.shopeeAwbLoading}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Print All Pages
                    </button>
                    {list.shopeeAwbPdfUrl && (
                      <a
                        href={list.shopeeAwbPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card"
                      >
                        Open PDF
                      </a>
                    )}
                  </div>
                </div>

                {failedPrintOrders.length > 0 && (
                  <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-700">Failed Orders</p>
                    <div className="mt-3 space-y-2">
                      {failedPrintOrders.map((order) => (
                        <div key={order.orderId} className="rounded-lg bg-white px-3 py-2">
                          <p className="text-xs font-semibold text-red-700">{order.orderId}</p>
                          <p className="mt-1 text-xs text-red-600">{order.reason || "Unknown error"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-surface-border px-6 py-4">
              <button
                type="button"
                onClick={list.closeShopeeAwbModal}
                disabled={list.shopeeAwbLoading}
                className="rounded-xl border border-surface-border px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
