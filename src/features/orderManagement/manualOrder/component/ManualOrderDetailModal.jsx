import { X } from "lucide-react";
import { translateStaticText } from "../../../../i18nDomTranslator";

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

const normalizeLabel = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());

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

export default function ManualOrderDetailModal({ open, order, onClose, onPrintWaybill, onUpdateManualDelivery }) {
  if (!open || !order) return null;
  const tr = (text) => translateStaticText(text);
  const statusText = (value) => {
    const raw = String(value || "").toUpperCase();
    if (!raw) return "-";
    if (raw === "MANUAL_DELIVERY") return tr("Self-arranged Delivery");
    if (raw === "PREPAID") return tr("Prepaid");
    if (raw === "SAVED_ONLY") return tr("Saved Only");
    if (raw === "BOOKED") return tr("Booked");
    if (raw === "BOOKING_PENDING") return tr("Booking Pending");
    if (raw === "BOOKING_FAILED") return tr("Booking Failed");
    return tr(normalizeLabel(value));
  };

  const sender = order.sender || {};
  const buyer = order.buyer || {};
  const paymentCertificateUrl = resolveAssetUrl(order.paymentCertificateUrl);
  const manualDelivery = order.manualDelivery || String(order.bookingStatus || "").toUpperCase() === "MANUAL_DELIVERY";
  const manualDeliveryInfo = order.manualDeliveryInfo || {};
  const orderStatus = statusText(order.statusCode || order.status);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4 py-6 font-body">
      <div className="max-h-[92vh] w-full max-w-[1180px] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-surface-border px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">{tr("Manual Order Details")}</h3>
            <p className="mt-1 text-xs text-slate-500">{order.orderNo} - {orderStatus}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={17} />
          </button>
        </div>

        <div className="max-h-[76vh] overflow-y-auto p-6 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Section title={tr("Sender / Pickup")}>
              <Row label={tr("Name")} value={sender.senderName || sender.name} />
              <Row label={tr("Company")} value={sender.company} />
              <Row label={tr("Phone")} value={sender.phone} />
              <Row label={tr("Email")} value={sender.email} />
              <Row label={tr("Address")} value={sender.address} />
              <Row label={tr("City / State")} value={[sender.city, sender.state].filter(Boolean).join(", ")} />
              <Row label={tr("Postcode")} value={sender.postcode} />
              <Row label={tr("Country")} value={sender.country} />
            </Section>
            <Section title={tr("Receiver / Buyer")}>
              <Row label={tr("Name")} value={buyer.buyerName || buyer.name} />
              <Row label={tr("Phone")} value={buyer.phone} />
              <Row label={tr("Email")} value={buyer.email} />
              <Row label={tr("Address")} value={buyer.address} />
              <Row label={tr("City / State")} value={[buyer.city, buyer.state].filter(Boolean).join(", ")} />
              <Row label={tr("Postcode")} value={buyer.zipCode || buyer.postcode} />
              <Row label={tr("Country")} value={buyer.country} />
              <Row label={tr("Unit")} value={buyer.unit} />
            </Section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Section title={tr("Payment")}>
              <Row label={tr("Payment Type")} value={statusText(order.paymentType)} />
              <Row label={tr("Subtotal")} value={money(order.subtotal, order.currency)} />
              <Row label={tr("Shipping Fee")} value={money(order.shippingFee, order.currency)} />
              <Row label={tr("Order Value")} value={money(order.orderValue, order.currency)} />
              <div className="col-span-2 flex items-center justify-between gap-3">
                <span className="text-slate-400">{tr("Payment Certificate")}</span>
                {paymentCertificateUrl ? (
                  <a
                    href={paymentCertificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="max-w-[260px] truncate text-right font-semibold text-primary hover:underline"
                    title={order.paymentCertificateFilename || paymentCertificateUrl}
                  >
                    {order.paymentCertificateFilename || tr("Open certificate")}
                  </a>
                ) : (
                  <span className="text-right font-medium text-slate-700">-</span>
                )}
              </div>
            </Section>
            <Section title={tr("Shipment / Delivery")}>
              <Row label={tr("Courier")} value={order.logistics?.logisticsName} />
              <Row label={tr("Service ID")} value={order.logisticServiceId} />
              <Row label={tr("Booking Status")} value={statusText(order.bookingStatus)} />
              <Row label={tr("Delivery Type")} value={manualDelivery ? tr("Self-arranged delivery") : tr("Courier booking")} />
              <Row label={tr("AWB")} value={order.awbNumber || order.trackingNo} />
              <Row label={tr("Provider Order")} value={order.providerOrderNumber} />
              <Row label={tr("Provider Shipment")} value={order.providerShipmentNumber} />
              <Row label={tr("Raw Provider Status")} value={statusText(order.rawProviderStatus)} />
              <Row label={tr("Tracking URL")} value={order.trackingUrl} />
              <Row label={tr("Booking Error")} value={order.bookingError} />
              {manualDelivery && <Row label={tr("Manual Note")} value={manualDeliveryInfo.note} />}
            </Section>
          </div>

          <Section title={tr("Items")}>
            <div className="col-span-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-surface-border text-left text-slate-500">
                  <tr>
                    <th className="py-2">{tr("SKU")}</th>
                    <th>{tr("Product")}</th>
                    <th>{tr("Qty")}</th>
                    <th>{tr("Unit Price")}</th>
                    <th>{tr("Total")}</th>
                  </tr>
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

          <Section title={tr("Status History")}>
            <div className="col-span-2 space-y-2">
              {(order.statusHistory || []).length === 0 ? (
                <p className="text-xs text-slate-400">{tr("No status history yet.")}</p>
              ) : (
                order.statusHistory.map((history) => (
                  <div key={history.id} className="rounded-lg bg-surface/50 px-3 py-2 text-xs">
                    <p className="font-semibold text-slate-700">{statusText(history.oldStatus || "New")} -&gt; {statusText(history.newStatus)}</p>
                    <p className="text-slate-400">{history.note || history.rawProviderStatus || ""}</p>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>

        <div className="flex justify-end gap-3 border-t border-surface-border px-6 py-4">
          {manualDelivery && (
            <button onClick={() => onUpdateManualDelivery?.(order)} className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100">
              {tr("Update Delivery")}
            </button>
          )}
          {order.waybillPdfUrl && (
            <button onClick={() => onPrintWaybill?.(order)} className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark">
              {tr("Open Waybill")}
            </button>
          )}
          <button onClick={onClose} className="rounded-xl border border-surface-border px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-card">
            {tr("Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
