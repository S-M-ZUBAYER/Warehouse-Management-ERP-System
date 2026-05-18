import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Pencil, Search, X } from "lucide-react";
import Topbar from "../../../../../components/layout/Topbar";
import { useOrderDetail } from "../../../shared/hooks/useOrderDetail";

function parseOrderRouteParam(param = "") {
  const decoded = decodeURIComponent(param);
  const [platform, ...rest] = decoded.split(":");
  return {
    platform,
    orderId: rest.join(":"),
    fullId: decoded,
  };
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-words">{value || "-"}</p>
    </div>
  );
}

function Section({ title, children, className = "", rightSlot = null }) {
  return (
    <div className={`bg-white rounded-xl border border-surface-border p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 font-display">{title}</h3>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}

function RightInfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold text-slate-800 text-right break-words">{value || "-"}</span>
    </div>
  );
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { platform, orderId } = parseOrderRouteParam(params.id || params.orderId || "");

  const {
    order,
    isLoading,
    isFetching,
    isError,
    error,
    showMappingModal,
    setShowMappingModal,
    mappingSearch,
    setMappingSearch,
    mappingSearchType,
    setMappingSearchType,
    handleMappingSearch,
    merchantSkus,
    merchantSkusLoading,
    selectedSkuId,
    setSelectedSkuId,
    mappingTargetItem,
    openMappingModal,
    confirmMapping,
    mappingSaving,
  } = useOrderDetail({ platform, orderId, initialOrder: location.state?.order });

  const items = order?.items || [];
  const firstItem = items[0];
  const totalQty = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [items]
  );

  if (isLoading && !order) {
    return (
      <div className="space-y-4 font-body">
        <Topbar PageTitle="Back to Order List" showBack onBack={() => navigate(-1)} />
        <div className="bg-white rounded-xl border border-surface-border p-8 text-sm text-slate-500">
          Loading order details...
        </div>
      </div>
    );
  }

  if ((isError && !order) || !order) {
    return (
      <div className="space-y-4 font-body">
        <Topbar PageTitle="Back to Order List" showBack onBack={() => navigate(-1)} />
        <div className="bg-white rounded-xl border border-surface-border p-8 text-sm text-red-500">
          {error?.message || "Order details not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Back to Order List" showBack onBack={() => navigate(-1)} />

      {isFetching && (
        <div className="rounded-lg bg-blue-50 px-4 py-2 text-xs text-primary">Refreshing order details...</div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Section title="Order Information">
            <div className="grid grid-cols-6 gap-4">
              <InfoRow label="Warehouse Package No." value={order.pkgNo} />
              <InfoRow label="Order Number" value={order.orderNo} />
              <InfoRow label="Order Status" value={order.status} />
              <InfoRow label="Order Time" value={order.orderTime || order.createdAt} />
              <InfoRow label="Store Name" value={order.storeName} />
              <InfoRow label="Platform Name" value={order.platformLabel} />
            </div>
          </Section>

          <Section
            title="Logistic Information"
            rightSlot={
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <Pencil size={15} />
              </button>
            }
          >
            <div className="grid grid-cols-3 gap-4">
              <InfoRow label="Buyer designated logistic" value={order.logistics?.buyerLogistic} />
              <InfoRow label="Logistics Name" value={order.logistics?.logisticsName} />
              <InfoRow label="Tracking No." value={order.logistics?.trackingNo || order.trackingNo} />
            </div>
          </Section>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-surface-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 font-display">Items</h3>
                <span className="text-xs text-slate-400">Subtotal</span>
              </div>
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400">No item data</p>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.image} alt={item.sku} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">SKU-{item.sku}</p>
                        <p className="text-xs text-slate-500 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          {item.currency || "USD"}{item.unitPrice || 0} × {item.quantity || 1}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                        $ {item.subtotal || 0}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-surface-border p-5">
              <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-500 mb-3">
                <span className="col-span-1">Merchant Mapping</span>
                <span>To Allocate /Deduct</span>
                <span>Allocate /Deduct</span>
                <span>Action</span>
              </div>
              <div className="space-y-3">
                {(items.length ? items : [firstItem]).filter(Boolean).map((item) => (
                  <div key={item.id} className="grid grid-cols-4 gap-2 items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <img src={item.image} alt={item.sku} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">SKU-{item.sku}</p>
                        <p className="text-xs text-slate-400 truncate">Available Inventory: {item.available ?? "--"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-8 h-7 border border-surface-border rounded text-xs flex items-center justify-center text-slate-700">
                        {item.quantity || 1}
                      </span>
                    </div>
                    <span className="text-sm text-slate-700 text-center">{item.quantity || 1}</span>
                    <button
                      onClick={() => openMappingModal(item)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5" style={{ border: "1.5px dashed #004368" }}>
            <h3 className="text-sm font-bold text-slate-800 font-display mb-5">Order Log</h3>
            <div className="flex items-center gap-0">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="text-xs text-slate-500 mt-2">Unpaid</div>
              </div>
              <div className="w-16 h-px bg-primary mx-1" />
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="text-xs text-slate-500 mt-2">{order.status}</div>
              </div>
              <div className="w-16 h-px bg-surface-border mx-1" />
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full border-2 border-surface-border bg-white" />
              </div>
            </div>
            <div className="mt-2 ml-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                The platform status is - {order.platformLabel} - {order.rawStatus || order.status}. Total item quantity: {totalQty || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-surface-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">Payment Information</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {order.payment?.type || "Prepaid"}
              </span>
            </div>
            <div className="space-y-3">
              <RightInfoRow label="Payment Date and Time" value={order.payment?.paidAt} />
              <RightInfoRow label="Subtotal" value={order.payment?.subtotal} />
              <RightInfoRow label="Shipping Fee paid by Buyer" value={order.payment?.shippingFee} />
              <RightInfoRow label="Total Discount" value={order.payment?.discount} />
              <RightInfoRow label="Order Value" value={order.payment?.orderValue || order.price} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-surface-border p-5">
            <h3 className="text-sm font-bold text-slate-800 font-display mb-4">Customer Information</h3>
            <div className="space-y-3">
              <RightInfoRow label="User Name" value={order.customer?.userName} />
              <RightInfoRow label="Recipient Name" value={order.customer?.recipientName} />
              <RightInfoRow label="Phone" value={order.customer?.phone} />
              <RightInfoRow label="Address" value={order.customer?.address} />
              <RightInfoRow label="City / Town" value={order.customer?.city} />
              <RightInfoRow label="State" value={order.customer?.state} />
              <RightInfoRow label="Post Code" value={order.customer?.postCode} />
              <RightInfoRow label="Country / Region" value={order.customer?.country} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-surface-border p-5">
            <h3 className="text-sm font-bold text-slate-800 font-display mb-3">Note</h3>
            <p className="text-xs text-slate-400">{order.note || "Note Here"}</p>
          </div>
        </div>
      </div>

      {showMappingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(200,210,220,0.55)", backdropFilter: "blur(3px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowMappingModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden" style={{ maxWidth: "860px", animation: "popIn 0.18s ease both" }}>
            <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 font-display">
                Change Mapping _ Warehouse Package No: {order.pkgNo}
              </h2>
              <button onClick={() => setShowMappingModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-8 py-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <img src={mappingTargetItem?.image || firstItem?.image} alt="item" className="w-13 h-13 rounded-xl object-cover" />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{mappingTargetItem?.name || firstItem?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{mappingTargetItem?.sku || firstItem?.sku}</p>
                </div>
              </div>
            </div>

            <div className="px-8 py-4 border-b border-surface-border flex items-center gap-3">
              <select
                value={mappingSearchType}
                onChange={(e) => setMappingSearchType(e.target.value)}
                className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none"
              >
                <option value="sku_name">SKU Name</option>
                <option value="product_name">Product Name</option>
              </select>
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={mappingSearch}
                  onChange={(e) => setMappingSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleMappingSearch()}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                />
              </div>
              <button onClick={handleMappingSearch} className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
                Search
              </button>
            </div>

            <div className="px-8 py-4">
              <h3 className="text-sm font-bold text-slate-800 font-display mb-3">Select Merchant SKU</h3>
              <div className="overflow-auto" style={{ maxHeight: "280px" }}>
                <table className="w-full text-sm">
                  <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                    <tr className="border-b border-surface-border">
                      {["Select", "Image", "Product Name", "SKU", "On Hand", "Allocated", "Available"].map((h) => (
                        <th key={h} className="py-2.5 text-left text-xs font-semibold text-slate-600 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {merchantSkusLoading ? (
                      <tr><td colSpan={7} className="py-8 text-center text-xs text-slate-400">Loading merchant SKUs...</td></tr>
                    ) : merchantSkus.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center text-xs text-slate-400">No merchant SKU found</td></tr>
                    ) : (
                      merchantSkus.map((sku) => (
                        <tr key={sku.id} className="hover:bg-surface/50 transition-colors">
                          <td className="py-2.5 pr-4">
                            <input
                              type="checkbox"
                              checked={String(selectedSkuId) === String(sku.id)}
                              onChange={() => setSelectedSkuId(sku.id)}
                              className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 pr-4"><img src={sku.image} alt={sku.name} className="w-8 h-8 rounded-lg object-cover" /></td>
                          <td className="py-2.5 pr-4 text-slate-700">{sku.name}</td>
                          <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">{sku.sku}</td>
                          <td className="py-2.5 pr-4 text-slate-600">{sku.onHand}</td>
                          <td className="py-2.5 pr-4 text-slate-600">{sku.allocated}</td>
                          <td className="py-2.5 pr-4 text-slate-600">{sku.available} units</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-8 py-5 border-t border-surface-border">
              <button onClick={() => setShowMappingModal(false)} className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors">
                Cancel
              </button>
              <button
                onClick={confirmMapping}
                disabled={mappingSaving}
                className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60"
              >
                {mappingSaving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
          <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}
