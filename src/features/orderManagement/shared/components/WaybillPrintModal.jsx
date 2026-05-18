import { Download, Printer, X } from "lucide-react";

const valueOrDash = (value) => (value === null || value === undefined || value === "" ? "-" : value);

const htmlEscape = (value) =>
  String(valueOrDash(value))
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const getOrderItems = (order) => {
  const items = Array.isArray(order?.items) && order.items.length > 0 ? order.items : [];
  if (items.length > 0) return items;

  return [
    {
      id: order?.id,
      sku: order?.sku,
      name: order?.sku,
      quantity: 1,
      image: order?.image,
    },
  ];
};

const buildWaybillHtml = (orders = []) => {
  const cards = orders
    .map((order, index) => {
      const items = getOrderItems(order)
        .map(
          (item) => `
            <tr>
              <td>${htmlEscape(item.sku || item.modelName || item.name)}</td>
              <td>${htmlEscape(item.name || item.modelName || item.sku)}</td>
              <td style="text-align:center;">${htmlEscape(item.quantity || 1)}</td>
            </tr>`
        )
        .join("");

      return `
        <section class="waybill">
          <div class="waybill-header">
            <div>
              <div class="brand">Grozziie Warehouse</div>
              <div class="muted">Waybill ${index + 1}</div>
            </div>
            <div class="platform">${htmlEscape(order.platformLabel || order.platform)}</div>
          </div>

          <div class="barcode">${htmlEscape(order.trackingNo || order.orderNo)}</div>

          <div class="grid">
            <div>
              <p class="label">Warehouse Package No.</p>
              <p class="value">${htmlEscape(order.pkgNo)}</p>
            </div>
            <div>
              <p class="label">Order Number</p>
              <p class="value">${htmlEscape(order.orderNo)}</p>
            </div>
            <div>
              <p class="label">Tracking Number</p>
              <p class="value">${htmlEscape(order.trackingNo)}</p>
            </div>
            <div>
              <p class="label">Store Name</p>
              <p class="value">${htmlEscape(order.storeName)}</p>
            </div>
            <div>
              <p class="label">Logistic</p>
              <p class="value">${htmlEscape(order.logistics?.logisticsName || order.logistics?.buyerLogistic)}</p>
            </div>
            <div>
              <p class="label">Order Status</p>
              <p class="value">${htmlEscape(order.status)}</p>
            </div>
          </div>

          <div class="recipient">
            <p class="label">Recipient</p>
            <p class="value">${htmlEscape(order.customer?.recipientName || order.customer?.userName)}</p>
            <p>${htmlEscape(order.customer?.phone)}</p>
            <p>${htmlEscape(order.customer?.address)}</p>
          </div>

          <table>
            <thead>
              <tr><th>SKU</th><th>Item</th><th>Qty</th></tr>
            </thead>
            <tbody>${items}</tbody>
          </table>
        </section>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Waybill Print</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; color: #111827; font-family: Arial, sans-serif; background: #f3f4f6; }
    .waybill { width: 420px; min-height: 560px; margin: 0 auto 24px; padding: 20px; border: 1px solid #d1d5db; border-radius: 14px; background: #fff; page-break-after: always; }
    .waybill-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
    .brand { font-size: 18px; font-weight: 700; }
    .platform { border: 1px solid #d1d5db; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 700; }
    .muted, .label { color: #6b7280; font-size: 11px; }
    .label { margin: 0 0 3px; }
    .value { margin: 0; font-weight: 700; font-size: 13px; }
    .barcode { margin: 18px 0; padding: 14px; border: 2px dashed #111827; text-align: center; font-family: monospace; font-size: 18px; font-weight: 700; letter-spacing: 1px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .recipient { margin-top: 16px; padding: 12px; border-radius: 12px; background: #f9fafb; font-size: 12px; line-height: 1.5; }
    .recipient p { margin: 0 0 4px; }
    table { width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    th { background: #f9fafb; font-weight: 700; }
    @media print {
      body { padding: 0; background: #fff; }
      .waybill { border-radius: 0; margin: 0 auto; border: 0; width: 100%; min-height: auto; }
    }
  </style>
</head>
<body>${cards}</body>
</html>`;
};

const openPrintWindow = (orders) => {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  printWindow.document.open();
  printWindow.document.write(buildWaybillHtml(orders));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 350);
};

const downloadWaybill = (orders) => {
  const html = buildWaybillHtml(orders);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `waybill-${timestamp}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function WaybillPrintModal({ open, orders = [], onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 font-body">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 font-display">Waybill Preview</h3>
            <p className="text-xs text-slate-500">{orders.length} selected order{orders.length > 1 ? "s" : ""}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-surface-card hover:text-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 overflow-y-auto bg-slate-100 p-5 md:grid-cols-2">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-surface-border bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3 border-b border-surface-border pb-3">
                <div>
                  <p className="text-base font-bold text-slate-800">Grozziie Warehouse</p>
                  <p className="text-xs text-slate-500">{valueOrDash(order.platformLabel || order.platform)}</p>
                </div>
                <span className="rounded-full border border-surface-border px-3 py-1 text-xs font-semibold text-slate-700">
                  {valueOrDash(order.status)}
                </span>
              </div>

              <div className="mb-4 rounded-lg border-2 border-dashed border-slate-800 px-3 py-4 text-center font-mono text-base font-bold tracking-wide text-slate-900">
                {valueOrDash(order.trackingNo || order.orderNo)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <Info label="Package No." value={order.pkgNo} />
                <Info label="Order Number" value={order.orderNo} />
                <Info label="Tracking Number" value={order.trackingNo} />
                <Info label="Store Name" value={order.storeName} />
                <Info label="Logistic" value={order.logistics?.logisticsName || order.logistics?.buyerLogistic} />
                <Info label="Create Time" value={order.createdAt} />
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                <p className="mb-1 font-semibold text-slate-800">Recipient</p>
                <p>{valueOrDash(order.customer?.recipientName || order.customer?.userName)}</p>
                <p>{valueOrDash(order.customer?.phone)}</p>
                <p>{valueOrDash(order.customer?.address)}</p>
              </div>

              <div className="mt-4 space-y-2">
                {getOrderItems(order).map((item, index) => (
                  <div key={item.id || index} className="flex items-center gap-3 rounded-lg border border-surface-border p-2">
                    <img
                      src={item.image || order.image}
                      alt={item.sku || order.sku}
                      className="h-10 w-10 rounded-lg object-cover"
                      onError={(event) => {
                        event.currentTarget.src = "https://placehold.co/40x40/E6ECF0/004368?text=?";
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{valueOrDash(item.sku || order.sku)}</p>
                      <p className="truncate text-[11px] text-slate-500">{valueOrDash(item.name || item.modelName)}</p>
                    </div>
                    <p className="text-xs font-bold text-slate-700">x{valueOrDash(item.quantity || 1)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-surface-border px-5 py-4">
          <button
            type="button"
            onClick={() => downloadWaybill(orders)}
            className="flex items-center gap-2 rounded-lg border border-surface-border bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-surface-card"
          >
            <Download size={15} />
            Download
          </button>
          <button
            type="button"
            onClick={() => openPrintWindow(orders)}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            <Printer size={15} />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-slate-500">{label}</p>
      <p className="font-semibold text-slate-800">{valueOrDash(value)}</p>
    </div>
  );
}

export { buildWaybillHtml };
