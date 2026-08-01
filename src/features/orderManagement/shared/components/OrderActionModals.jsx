import { X } from "lucide-react";
import { useRef, useState } from "react";
import ConfirmActionModal from "../../../../components/shared/ConfirmActionModal";

const TIKTOK_PRINTING_LABEL_LIST = [
  { id: 1, lebel: "SHIPPING_LABEL", name: "Shipping Label" },
  { id: 2, lebel: "PACKING_SLIP", name: "Packing Label" },
];

const getInitialCheckedLabelItems = () => {
  if (typeof localStorage === "undefined") return [1];

  try {
    const parsed = JSON.parse(localStorage.getItem("tiktokPrintingLebel"));
    if (parsed === 3) return [1, 2];
    if (parsed === 2) return [2];
  } catch {
    // Fall back to the default shipping label below.
  }

  return [1];
};

export default function OrderActionModals({ list }) {
  const failedOrders = list.failedShopeePackOrders || [];
  const failedTikTokOrders = list.failedTikTokPackOrders || [];
  const failedPrintOrders = list.failedShopeePrintOrders || [];
  const failedTikTokPrintOrders = list.failedTikTokPrintOrders || [];
  const iframeRef = useRef(null);
  const [checkedLabelItems, setCheckedLabelItems] = useState(getInitialCheckedLabelItems);

  const handlePrintAll = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const handlePrintPdf = (pdfUrl) => {
    if (!pdfUrl || typeof document === "undefined") return;

    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.src = pdfUrl;
    frame.onload = () => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      window.setTimeout(() => frame.remove(), 1000);
    };
    document.body.appendChild(frame);
  };

  const handleTikTokLabelCheck = (id) => {
    const next = checkedLabelItems.includes(id)
      ? checkedLabelItems.filter((itemId) => itemId !== id)
      : [...checkedLabelItems, id];
    const checkedItems = next.length ? next : [1];
    let selectedTikTokPrintLabel = 1;

    if (checkedItems.includes(1) && checkedItems.includes(2)) {
      selectedTikTokPrintLabel = 3;
    } else if (checkedItems.includes(2)) {
      selectedTikTokPrintLabel = 2;
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("tiktokPrintingLebel", JSON.stringify(selectedTikTokPrintLabel));
    }

    setCheckedLabelItems(checkedItems);
  };

  const handleTikTokLabelChange = (id) => {
    handleTikTokLabelCheck(id);
    window.setTimeout(() => list.refreshTikTokAwbPdf?.(), 0);
  };

  const handleMultiTikTokLabelChange = (id, resultId) => {
    handleTikTokLabelCheck(id);
    window.setTimeout(() => list.refreshMultiPlatformTikTokAwbPdf?.(resultId), 0);
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
        open={list.multiPlatformConfirmOpen}
        title="Confirm Multi-Platform Action"
        message={list.multiPlatformConfirmMessage}
        confirmLabel="Confirm"
        loading={list.multiPlatformActionLoading}
        onCancel={list.cancelMultiPlatformAction}
        onConfirm={list.confirmMultiPlatformAction}
      />

      {list.multiPlatformAwbResults?.length > 0 && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Multi-Store AWB Results</h3>
                <p className="mt-1 text-xs text-slate-500">Print or open each platform-store AWB separately.</p>
              </div>
              <button
                type="button"
                onClick={list.closeMultiPlatformAwbResults}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {list.multiPlatformAwbResults.map((result) => (
                  <div key={result.id} className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {result.platform === "shopee" ? "Shopee AWB Printing" : "TikTok AWB Printing"}
                        </p>
                        <div className="mt-2 grid gap-1 text-xs text-slate-500">
                          <p><span className="font-semibold text-slate-700">Platform</span>: {result.platform === "shopee" ? "Shopee" : "TikTok"}</p>
                          <p><span className="font-semibold text-slate-700">Store</span>: {result.storeName || "-"}</p>
                          <p>
                            <span className="font-semibold text-slate-700">Selected</span>: {result.orderCount || 0}
                            <span className="mx-2 text-slate-300">|</span>
                            <span className="font-semibold text-slate-700">Ready</span>: {result.successCount || 0}
                            <span className="mx-2 text-slate-300">|</span>
                            <span className="font-semibold text-slate-700">Failed</span>: {result.failedOrders?.length || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => handlePrintPdf(result.pdfUrl)}
                          disabled={!result.pdfUrl || list.multiPlatformAwbRefreshId === result.id}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Print All Pages
                        </button>
                        {result.pdfUrl && (
                          <a
                            href={result.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-surface-card"
                          >
                            Open PDF
                          </a>
                        )}
                      </div>
                    </div>

                    {result.platform === "tiktok" && (
                      <div className="mt-4 rounded-xl border border-surface-border bg-[#004368]/[0.05] p-4">
                        <p className="text-sm font-bold text-slate-800">Label Waybill List</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {TIKTOK_PRINTING_LABEL_LIST.map((item) => (
                            <label
                              key={item.id}
                              className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5"
                            >
                              <input
                                type="checkbox"
                                checked={checkedLabelItems.includes(item.id)}
                                onChange={() => handleMultiTikTokLabelChange(item.id, result.id)}
                                disabled={list.multiPlatformAwbRefreshId === result.id}
                                className="h-4 w-4 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                              />
                              <span className="text-sm font-medium text-slate-700">{item.name}</span>
                            </label>
                          ))}
                        </div>
                        {list.multiPlatformAwbRefreshId === result.id && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">Refreshing AWB preview...</p>
                        )}
                      </div>
                    )}

                    {result.pdfUrl ? (
                      <div className="mt-4 h-64 overflow-hidden rounded-lg border border-surface-border bg-slate-50">
                        <iframe
                          src={result.pdfUrl}
                          title={`${result.platform} ${result.storeName || "store"} AWB Preview`}
                          className="h-full w-full"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                        No PDF generated
                      </div>
                    )}

                    {result.failedOrders?.length > 0 && (
                      <div className="mt-4 max-h-36 overflow-auto rounded-lg border border-red-100 bg-red-50 p-3">
                        <p className="text-xs font-bold text-red-700">Failed Orders</p>
                        <div className="mt-2 space-y-2">
                          {result.failedOrders.map((order) => (
                            <div key={order.orderId} className="rounded bg-white px-2 py-1.5">
                              <p className="text-xs font-semibold text-red-700">{order.orderId}</p>
                              <p className="text-xs text-red-600">{order.reason || "Unknown error"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-surface-border px-6 py-4">
              <button
                type="button"
                onClick={list.closeMultiPlatformAwbResults}
                className="rounded-xl border border-surface-border px-5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

      <ConfirmActionModal
        open={list.tikTokPackConfirmOpen}
        title="Order Accepted & Packages"
        message={`Are you sure you have completed packaging ${list.tikTokPackConfirmCount || 0} TikTok order(s)?`}
        confirmLabel="Confirm"
        loading={list.tikTokPackLoading}
        onCancel={list.cancelTikTokPack}
        onConfirm={list.confirmTikTokPack}
      />

      <ConfirmActionModal
        open={list.tikTokPrintConfirmOpen}
        title="TikTok AWB Print"
        message={list.tikTokPrintConfirmMessage}
        confirmLabel="Confirm"
        loading={list.tikTokAwbLoading}
        onCancel={list.cancelTikTokPrint}
        onConfirm={list.confirmTikTokPrint}
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

      {failedTikTokOrders.length > 0 && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Failed TikTok Orders</h3>
                <p className="mt-1 text-xs text-slate-500">These orders could not be accepted and packaged.</p>
              </div>
              <button
                type="button"
                onClick={list.closeFailedTikTokPackOrders}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={17} />
              </button>
            </div>

            <div className="max-h-80 overflow-auto px-6 py-4">
              <div className="space-y-3">
                {failedTikTokOrders.map((order) => (
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
                onClick={list.closeFailedTikTokPackOrders}
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

      {list.tikTokAwbModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">TikTok AWB Printing</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {list.tikTokAwbLoading ? "Preparing shipping document..." : "Preview the shipping document before printing."}
                </p>
              </div>
              <button
                type="button"
                onClick={list.closeTikTokAwbModal}
                disabled={list.tikTokAwbLoading}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-4 p-6 lg:grid-cols-[420px_1fr]">
              <div className="flex h-[570px] items-center justify-center overflow-hidden rounded-xl border border-surface-border bg-slate-50 shadow-sm">
                {list.tikTokAwbLoading ? (
                  <div className="text-sm font-semibold text-slate-500">Loading AWB PDF...</div>
                ) : list.tikTokAwbPdfUrl ? (
                  <iframe
                    ref={iframeRef}
                    src={list.tikTokAwbPdfUrl}
                    title="TikTok AWB Preview"
                    className="h-full w-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-sm font-semibold text-slate-500">No PDF Loaded</div>
                )}
              </div>

              <div className="flex flex-col">
                <div className="mb-4 rounded-xl border border-surface-border bg-[#004368]/[0.05] p-4">
                  <p className="text-sm font-bold text-slate-800">Label Waybill List</p>
                  <div className="mt-3 space-y-2">
                    {TIKTOK_PRINTING_LABEL_LIST.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-3 rounded px-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={checkedLabelItems.includes(item.id)}
                          onChange={() => handleTikTokLabelChange(item.id)}
                          className="h-4 w-4 cursor-pointer accent-primary"
                        />
                        <span className="text-sm font-medium text-slate-700">{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-surface-border p-4">
                  <p className="text-sm font-bold text-slate-800">Print Actions</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Use Print All Pages after the AWB preview loads.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handlePrintAll}
                      disabled={!list.tikTokAwbPdfUrl || list.tikTokAwbLoading}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Print All Pages
                    </button>
                    {list.tikTokAwbPdfUrl && (
                      <a
                        href={list.tikTokAwbPdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card"
                      >
                        Open PDF
                      </a>
                    )}
                  </div>
                </div>

                {failedTikTokPrintOrders.length > 0 && (
                  <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm font-bold text-red-700">Failed Orders</p>
                    <div className="mt-3 space-y-2">
                      {failedTikTokPrintOrders.map((order) => (
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
                onClick={list.closeTikTokAwbModal}
                disabled={list.tikTokAwbLoading}
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
