import { X } from "lucide-react";


const resolveAssetUrl = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:|blob:|data:)/i.test(raw)) return raw;
  const baseUrl = String(import.meta.env.VITE_AUTH_BASE_URL || window.location.origin || "").replace(/\/+$/, "");
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${baseUrl}${path}`;
};

const money = (amount, currency = "") => {
  const numeric = Number(amount || 0);
  return `${currency ? `${currency} ` : ""}${Number.isFinite(numeric) ? numeric.toFixed(2).replace(/\.00$/, "") : "0"}`.trim();
};

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-surface-border p-4">
      <h4 className="mb-3 text-sm font-bold text-slate-800 font-display">{title}</h4>
      <div className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-700">{value || "-"}</span>
    </div>
  );
}

export default function ManualOrderAftershipDetailModal({ open, order, onClose, onPrintWaybill }) {
  if (!open || !order) return null;
  const sender = order.sender || {};
  const buyer = order.buyer || {};
  const paymentCertificateUrl = resolveAssetUrl(order.paymentCertificateUrl);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-6 font-body">
      <div className="max-h-[92vh] w-full max-w-[1180px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">Manual Order Details</h3>
            <p className="mt-1 text-xs text-slate-500">{order.orderNo} · {order.status}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={17} /></button>
        </div>

        <div className="max-h-[76vh] overflow-y-auto p-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Sender / Pickup">
              <Row label="Name" value={sender.senderName || sender.name} />
              <Row label="Company" value={sender.company} />
              <Row label="Phone" value={sender.phone} />
              <Row label="Email" value={sender.email} />
              <Row label="Address" value={sender.address} />
              <Row label="City / State" value={[sender.city, sender.state].filter(Boolean).join(", ")} />
              <Row label="Postcode" value={sender.postcode} />
              <Row label="Country" value={sender.country} />
            </Section>
            <Section title="Receiver / Buyer">
              <Row label="Name" value={buyer.buyerName || buyer.name} />
              <Row label="Phone" value={buyer.phone} />
              <Row label="Email" value={buyer.email} />
              <Row label="Address" value={buyer.address} />
              <Row label="City / State" value={[buyer.city, buyer.state].filter(Boolean).join(", ")} />
              <Row label="Postcode" value={buyer.zipCode || buyer.postcode} />
              <Row label="Country" value={buyer.country} />
              <Row label="Unit" value={buyer.unit} />
            </Section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title="Payment / COD">
              <Row label="Payment Type" value={order.paymentType} />
              <Row label="Subtotal" value={money(order.subtotal, order.currency)} />
              <Row label="Shipping Fee" value={money(order.shippingFee, order.currency)} />
              <Row label="COD Amount" value={order.paymentType === "COD" ? money(order.codAmount || order.orderValue, order.currency) : "Not COD"} />
              <Row label="COD Status" value={order.codStatus} />
              <Row label="Order Value" value={money(order.orderValue, order.currency)} />
              <div className="col-span-2 flex items-center justify-between gap-3">
                <span className="text-slate-400">Payment Certificate</span>
                {paymentCertificateUrl ? (
                  <a
                    href={paymentCertificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[260px] truncate text-right font-semibold text-primary hover:underline"
                    title={order.paymentCertificateFilename || paymentCertificateUrl}
                  >
                    {order.paymentCertificateFilename || "Open certificate"}
                  </a>
                ) : (
                  <span className="text-right font-medium text-slate-700">-</span>
                )}
              </div>
            </Section>
            <Section title="AfterShip / Shipment">
              <Row label="Courier" value={order.logistics?.logisticsName} />
              <Row label="Service ID" value={order.logisticServiceId} />
              <Row label="Booking Status" value={order.bookingStatus} />
              <Row label="Tracking Number" value={order.awbNumber || order.trackingNo || order.afterShip?.trackingNumber} />
              <Row label="Label ID" value={order.afterShip?.labelId || order.providerShipmentNumber} />
              <Row label="Shipper Account" value={order.afterShip?.shipperAccountId} />
              <Row label="Raw Provider Status" value={order.rawProviderStatus} />
              <Row label="Tracking URL" value={order.trackingUrl || order.afterShip?.trackingUrl} />
              <Row label="Booking Error" value={order.bookingError} />
            </Section>
          </div>

          <Section title="Items">
            <div className="col-span-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-surface-border text-left text-slate-500">
                  <tr><th className="py-2">SKU</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {(order.items || []).map((item) => (
                    <tr key={item.id || item.sku}>
                      <td className="py-2 font-mono">{item.sku}</td>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.unitPrice, order.currency)}</td>
                      <td>{money(item.lineTotal, order.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Status History">
            <div className="col-span-2 space-y-2">
              {(order.statusHistory || []).length === 0 ? (
                <p className="text-xs text-slate-400">No status history yet.</p>
              ) : (
                order.statusHistory.map((history) => (
                  <div key={history.id} className="rounded-lg bg-surface/50 px-3 py-2 text-xs">
                    <p className="font-semibold text-slate-700">{history.oldStatus || "New"} → {history.newStatus}</p>
                    <p className="text-slate-400">{history.note || history.rawProviderStatus || ""}</p>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>

        <div className="flex justify-end gap-3 border-t border-surface-border px-6 py-4">
          {order.waybillPdfUrl && (
            <button onClick={() => onPrintWaybill?.(order)} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">Open Waybill</button>
          )}
          <button onClick={onClose} className="rounded-xl border border-surface-border px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-card">Close</button>
        </div>
      </div>
    </div>
  );
}
