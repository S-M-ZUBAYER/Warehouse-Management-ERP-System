import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Search, X } from "lucide-react";
import Topbar from "../../../../../components/layout/Topbar";

// ─────────────────────────────────────────────────────────────────────────────
// OrderDetailPage — Image 2 + Image 3
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SKU_LIST = [
  {
    id: 1,
    name: "Ergonomic wireless mouse with 3k...",
    sku: "WM-012",
    onHand: 0,
    allocated: 0,
    available: 125,
    image: "https://placehold.co/36x36/1a1a2e/fff?text=M",
  },
  {
    id: 2,
    name: "Compact mechanical keyboard with...",
    sku: "KB-045",
    onHand: 0,
    allocated: 0,
    available: 200,
    image: "https://placehold.co/36x36/16213e/fff?text=K",
  },
  {
    id: 3,
    name: "Portable external SSD 1TB",
    sku: "SSD-123",
    onHand: 0,
    allocated: 0,
    available: 0,
    image: "https://placehold.co/36x36/0f3460/fff?text=S",
  },
  {
    id: 4,
    name: "Noise-cancelling over-ear headphones",
    sku: "HP-678",
    onHand: 0,
    allocated: 0,
    available: 75,
    image: "https://placehold.co/36x36/533483/fff?text=H",
  },
  {
    id: 5,
    name: "High-definition webcam 1080p",
    sku: "WC-234",
    onHand: 0,
    allocated: 0,
    available: 100,
    image: "https://placehold.co/36x36/2b2d42/fff?text=W",
  },
  {
    id: 6,
    name: "Smartphone holder with adjustable ..",
    sku: "SH-456",
    onHand: 0,
    allocated: 0,
    available: 300,
    image: "https://placehold.co/36x36/8d99ae/004368?text=S",
  },
];

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function Section({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-xl border border-surface-border p-5 ${className}`}
    >
      <h3 className="text-sm font-bold text-slate-800 font-display mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [mappingSearch, setMappingSearch] = useState("");
  const [selectedSku, setSelectedSku] = useState(null);

  const filteredSkus = MOCK_SKU_LIST.filter((s) => {
    if (!mappingSearch.trim()) return true;
    const q = mappingSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 font-body">
      <Topbar
        PageTitle="Back to Order List"
        showBack
        onBack={() => navigate(-1)}
      />

      <div className="grid grid-cols-3 gap-4">
        {/* ── LEFT COLUMN (col-span-2) ── */}
        <div className="col-span-2 space-y-4">
          {/* Order Information */}
          <Section title="Order Information">
            <div className="grid grid-cols-6 gap-4">
              <InfoRow label="Warehouse Package No." value="WM-012" />
              <InfoRow label="Order Number" value="2602182XBW0RJX" />
              <InfoRow label="Order Status" value="New Order" />
              <InfoRow label="Order Time" value="01 March 2026  16:20" />
              <InfoRow label="Store Name" value="Store name" />
              <InfoRow label="Platform Name" value="Shopee" />
            </div>
          </Section>

          {/* Logistic Information */}
          <Section title="Logistic Information">
            <button className="float-right text-slate-400 hover:text-slate-600 transition-colors">
              <Pencil size={15} />
            </button>
            <div className="grid grid-cols-3 gap-4 clear-both">
              <InfoRow label="Buyer designated logistic" value="SPX Standard" />
              <InfoRow label="Logistics Name" value="Shopee-ID-SPX Standard" />
              <InfoRow label="Tracking No." value="Automatic" />
            </div>
          </Section>

          {/* Items + Merchant Mapping */}
          <div className="grid grid-cols-2 gap-4">
            {/* Items */}
            <div className="bg-white rounded-xl border border-surface-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 font-display">
                  Items
                </h3>
                <span className="text-xs text-slate-400">Subtotal</span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src="https://placehold.co/48x48/1a1a2e/fff?text=M"
                  alt="item"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-700">
                    SKU-WM-012
                  </p>
                  <p className="text-xs text-slate-500">Wireless mouse...</p>
                  <p className="text-xs text-slate-400">USD12 × 2</p>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  $ 24
                </span>
              </div>
            </div>

            {/* Merchant Mapping */}
            <div className="bg-white rounded-xl border border-surface-border p-5">
              <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-slate-500 mb-3">
                <span className="col-span-1">Merchant Mapping</span>
                <span>To Allocate /Deduct</span>
                <span>Allocate /Deduct</span>
                <span>Action</span>
              </div>
              <div className="grid grid-cols-4 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <img
                    src="https://placehold.co/32x32/1a1a2e/fff?text=M"
                    alt="sku"
                    className="w-8 h-8 rounded-lg"
                  />
                  <div>
                    <p className="text-xs font-medium text-slate-700">
                      SKU-WM-012
                    </p>
                    <p className="text-xs text-slate-400">
                      Available Inventory: 102
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-8 h-7 border border-surface-border rounded text-xs flex items-center justify-center text-slate-700">
                    2
                  </span>
                </div>
                <span className="text-sm text-slate-700 text-center">2</span>
                <button
                  onClick={() => setShowMappingModal(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Order Log */}
          <div
            className="bg-white rounded-xl p-5"
            style={{ border: "1.5px dashed #004368" }}
          >
            <h3 className="text-sm font-bold text-slate-800 font-display mb-5">
              Order Log
            </h3>
            <div className="flex items-center gap-3">
              {/* Timeline */}
              <div className="flex items-center gap-0">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div className="text-xs text-slate-500 mt-2">Unpaid</div>
                </div>
                <div className="w-16 h-px bg-primary mx-1" />
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div className="text-xs text-slate-500 mt-2">New Order</div>
                </div>
                <div className="w-16 h-px bg-surface-border mx-1" />
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full border-2 border-surface-border bg-white" />
                </div>
              </div>
            </div>
            <div className="mt-2 ml-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                The new orders, the platform status is - Shopee - signed / ready
                to ship
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4">
          {/* Payment Information */}
          <div className="bg-white rounded-xl border border-surface-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">
                Payment Information
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Prepaid
              </span>
            </div>
            <div className="space-y-3">
              {[
                ["Payment Date and Time", "01 March 2026  16:20"],
                ["Subtotal", "$0"],
                ["Shipping Fee paid by Buyer", "$0"],
                ["Total Discount", "$0"],
                ["Order Value", "$0"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-xl border border-surface-border p-5">
            <h3 className="text-sm font-bold text-slate-800 font-display mb-4">
              Customer Information
            </h3>
            <div className="space-y-3">
              {[
                ["User Name", "Customer User Name"],
                ["Recipient Name", "C*****e"],
                ["Phone", "**********12"],
                ["Address", "Address here"],
                ["City / Town", "City Name"],
                ["State", "State Name"],
                ["Post Code", "142500"],
                ["Country / Region", "ID"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-medium text-slate-800">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="bg-white rounded-xl border border-surface-border p-5">
            <h3 className="text-sm font-bold text-slate-800 font-display mb-3">
              Note
            </h3>
            <p className="text-xs text-slate-400">Note Here</p>
          </div>
        </div>
      </div>

      {/* ── Change SKU Mapping Modal (Image 3) ── */}
      {showMappingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(200,210,220,0.55)",
            backdropFilter: "blur(3px)",
          }}
          onClick={(e) =>
            e.target === e.currentTarget && setShowMappingModal(false)
          }
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full font-body overflow-hidden"
            style={{ maxWidth: "860px", animation: "popIn 0.18s ease both" }}
          >
            {/* Modal header */}
            <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800 font-display">
                  Change Mapping _ Warehouse Package No: WM-012
                </h2>
              </div>
              <button
                onClick={() => setShowMappingModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current item */}
            <div className="px-8 py-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <img
                  src="https://placehold.co/52x52/1a1a2e/fff?text=M"
                  alt="item"
                  className="w-13 h-13 rounded-xl object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Ergonomic wireless mouse with 3k...
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    SKU-WM-012
                  </p>
                </div>
              </div>
            </div>

            {/* Search bar */}
            <div className="px-8 py-4 border-b border-surface-border flex items-center gap-3">
              <select className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-600 outline-none">
                <option>SKU Name</option>
                <option>SKU Code</option>
              </select>
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search"
                  value={mappingSearch}
                  onChange={(e) => setMappingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg
                             text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                />
              </div>
              <button className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
                Search
              </button>
            </div>

            {/* SKU table */}
            <div className="px-8 py-4">
              <h3 className="text-sm font-bold text-slate-800 font-display mb-3">
                Select Merchant SKU
              </h3>
              <div className="overflow-auto" style={{ maxHeight: "280px" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border">
                      {[
                        "Select",
                        "Image",
                        "Product Name",
                        "SKU",
                        "On Hand",
                        "Allocated",
                        "Available",
                      ].map((h) => (
                        <th
                          key={h}
                          className="py-2.5 text-left text-xs font-semibold text-slate-600 pr-4"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {filteredSkus.map((sku) => (
                      <tr
                        key={sku.id}
                        className="hover:bg-surface/50 transition-colors"
                      >
                        <td className="py-2.5 pr-4">
                          <input
                            type="checkbox"
                            checked={selectedSku === sku.id}
                            onChange={() => setSelectedSku(sku.id)}
                            className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 pr-4">
                          <img
                            src={sku.image}
                            alt={sku.name}
                            className="w-8 h-8 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.src =
                                "https://placehold.co/32x32/E6ECF0/004368?text=?";
                            }}
                          />
                        </td>
                        <td className="py-2.5 pr-4 text-slate-700">
                          {sku.name}
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-slate-600">
                          {sku.sku}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {sku.onHand}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {sku.allocated}
                        </td>
                        <td className="py-2.5 pr-4 text-slate-600">
                          {sku.available} units
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-8 py-5 border-t border-surface-border">
              <button
                onClick={() => setShowMappingModal(false)}
                className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl
                           text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowMappingModal(false)}
                className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark
                           text-white rounded-xl transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
          <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.97) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>
      )}
    </div>
  );
}
