import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, ChevronDown, Trash2 } from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";

// ─────────────────────────────────────────────────────────────────────────────
// AddManualOrderPage — Images 10, 11, 12
// Image 10: Filled form with 3 product rows
// Image 11: Add Gift mode — Buyer Information section has dashed blue border
// Image 12: After search — product search results showing Select/Image/SKU/Available
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_SEARCH_PRODUCTS = [
  {
    id: 1,
    sku: "WM-012",
    available: 15,
    image: "https://placehold.co/36x36/1a1a2e/fff?text=M",
  },
  {
    id: 2,
    sku: "KB-045",
    available: 20,
    image: "https://placehold.co/36x36/16213e/fff?text=K",
  },
  {
    id: 3,
    sku: "SSD-123",
    available: 25,
    image: "https://placehold.co/36x36/0f3460/fff?text=S",
  },
];

const ALL_PRODUCTS = [
  {
    id: 1,
    name: "Ergonomic wireless mouse with 3k...",
    sku: "WM-012",
    weight: 1800,
    unitPrice: 12,
    image: "https://placehold.co/36x36/1a1a2e/fff?text=M",
  },
  {
    id: 2,
    name: "Compact mechanical keyboard with...",
    sku: "KB-045",
    weight: 1800,
    unitPrice: 12,
    image: "https://placehold.co/36x36/16213e/fff?text=K",
  },
  {
    id: 3,
    name: "Portable external SSD 1TB",
    sku: "SSD-123",
    weight: 900,
    unitPrice: 12,
    image: "https://placehold.co/36x36/0f3460/fff?text=S",
  },
];

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  className = "",
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs text-slate-500 mb-1">
          {required && <span className="mr-0.5">*</span>}
          {label}
        </label>
      )}
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg bg-white
                   text-slate-700 placeholder-slate-400 outline-none
                   focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
      />
    </div>
  );
}

function SelectField({ label, placeholder, options = [], className = "" }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-xs text-slate-500 mb-1">{label}</label>
      )}
      <div className="relative">
        <select
          className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-surface-border
                           rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
        >
          <option>{placeholder}</option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
    </div>
  );
}

export default function AddManualOrderPage({ mode = "order", onBack }) {
  const isGift = mode === "gift";

  const [buyerForm, setBuyerForm] = useState({
    buyerName: "",
    phone: "",
    address: "",
    country: "",
    state: "",
    city: "",
    area: "",
    zipCode: "",
  });
  const [orderForm, setOrderForm] = useState({
    orderNumber: "",
    selectTime: "",
    selectDate: "",
    logistic: "",
    currency: "",
  });
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [addedProducts, setAddedProducts] = useState(
    isGift
      ? [{ ...ALL_PRODUCTS[0], qty: 1 }]
      : ALL_PRODUCTS.map((p) => ({ ...p, qty: p.id === 3 ? 1 : 2 })),
  );
  const [paymentType, setPaymentType] = useState("COD");
  const [discounts, setDiscounts] = useState("$0");
  const [shippingFee, setShippingFee] = useState("$0");

  const handleBuyerChange = (e) =>
    setBuyerForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSearch = () => {
    setSearchResults(MOCK_SEARCH_PRODUCTS);
  };

  const addProductFromSearch = (product) => {
    const full = ALL_PRODUCTS.find((p) => p.sku === product.sku);
    if (!full) return;
    if (addedProducts.find((p) => p.id === full.id)) return;
    setAddedProducts((p) => [...p, { ...full, qty: 1 }]);
    setSearchResults(null);
    setProductSearch("");
  };

  const removeProduct = (id) =>
    setAddedProducts((p) => p.filter((x) => x.id !== id));
  const updateQty = (id, val) =>
    setAddedProducts((p) =>
      p.map((x) =>
        x.id === id ? { ...x, qty: Math.max(1, Number(val) || 1) } : x,
      ),
    );

  // Payment calculations
  const orderIncome = addedProducts.reduce(
    (sum, p) => sum + p.unitPrice * p.qty,
    0,
  );
  const subtotal = orderIncome;

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Back to Manual Order" showBack onBack={onBack} />

      {/* ── Top fields row ── */}
      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="grid grid-cols-5 gap-3">
          <FormInput
            label="Order Number"
            placeholder="Order Number Here"
            name="orderNumber"
            value={orderForm.orderNumber}
            onChange={(e) =>
              setOrderForm((p) => ({ ...p, orderNumber: e.target.value }))
            }
          />
          <FormInput
            label="Select Time"
            placeholder="13:35"
            name="selectTime"
            value={orderForm.selectTime}
            onChange={(e) =>
              setOrderForm((p) => ({ ...p, selectTime: e.target.value }))
            }
          />
          <div>
            <label className="block text-xs text-slate-500 mb-1">
              Select Date
            </label>
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-sm border border-surface-border
                               rounded-lg bg-white text-slate-500 hover:border-primary/40 transition-colors"
            >
              <span>01 Oct 2025 - 31 Oct 2025</span>
              <Calendar size={13} className="text-slate-400" />
            </button>
          </div>
          <SelectField
            label="Select Logistic"
            placeholder="Logistic Company here"
          />
          <SelectField label="Select Currency" placeholder="Currency Type" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* ── LEFT: Buyer Info + Products ── */}
        <div className="col-span-2 space-y-4">
          {/* Buyer Information */}
          <div
            className="bg-white rounded-xl p-5"
            style={{
              border: isGift ? "1.5px dashed #004368" : "1px solid #E2E8F0",
            }}
          >
            <h3 className="text-sm font-bold text-slate-800 font-display mb-4">
              Buyer Information
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <FormInput
                label="Buyer Name"
                placeholder="Buyer name here"
                name="buyerName"
                value={buyerForm.buyerName}
                onChange={handleBuyerChange}
                className="col-span-1"
              />
              <FormInput
                label="Phone Number"
                placeholder="Phone Number Here"
                name="phone"
                value={buyerForm.phone}
                onChange={handleBuyerChange}
                className="col-span-1"
              />
              <FormInput
                label="Address"
                placeholder="Buyer name here"
                name="address"
                value={buyerForm.address}
                onChange={handleBuyerChange}
                className="col-span-1"
              />
            </div>
            <div className="grid grid-cols-5 gap-3">
              <SelectField
                label="Country"
                placeholder="Country Name here"
                className="col-span-1"
              />
              <SelectField
                label="State"
                placeholder="State name here"
                className="col-span-1"
              />
              <SelectField
                label="City"
                placeholder="City name here"
                className="col-span-1"
              />
              <SelectField
                label="Area"
                placeholder="Area name here"
                className="col-span-1"
              />
              <FormInput
                label="Zip Code"
                placeholder="Zip code here"
                name="zipCode"
                value={buyerForm.zipCode}
                onChange={handleBuyerChange}
              />
            </div>
          </div>

          {/* Product area */}
          <div className="bg-white rounded-xl border border-surface-border p-5">
            {/* Search bar */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg
                             text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
              >
                Search
              </button>
            </div>

            {/* Search results (image 12) */}
            {searchResults && (
              <div className="border border-surface-border rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface/50">
                      {[
                        "Select",
                        "Image",
                        "SKU",
                        "Available inventory",
                        "Total",
                        "Action",
                      ].map((h) => (
                        <th
                          key={h}
                          className="py-2.5 pl-4 text-left text-xs font-semibold text-slate-600"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {searchResults.map((p) => (
                      <tr key={p.id} className="hover:bg-surface/50">
                        <td className="py-2.5 pl-4">
                          <input
                            type="checkbox"
                            onChange={() => addProductFromSearch(p)}
                            className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 pl-4">
                          <img
                            src={p.image}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        </td>
                        <td className="py-2.5 pl-4 font-mono text-xs text-slate-700">
                          {p.sku}
                        </td>
                        <td className="py-2.5 pl-4 text-slate-600">
                          {p.available}
                        </td>
                        <td className="py-2.5 pl-4 text-slate-600">$0</td>
                        <td className="py-2.5 pl-4">
                          <button
                            onClick={() => addProductFromSearch(p)}
                            className="text-xs text-primary hover:underline font-semibold"
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Added products table */}
            {addedProducts.length > 0 && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border">
                    {[
                      "Image",
                      "Product Name",
                      "* Quantity",
                      "Unit Price",
                      "Weight",
                      "Total",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="py-2.5 text-left text-xs font-semibold text-slate-600 pr-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {addedProducts.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-surface/50 transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <img
                          src={p.image}
                          className="w-9 h-9 rounded-lg object-cover"
                        />
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-700">
                        {p.name}
                      </td>
                      <td className="py-3 pr-3">
                        <input
                          type="number"
                          min={1}
                          value={p.qty}
                          onChange={(e) => updateQty(p.id, e.target.value)}
                          className="w-14 px-2 py-1 text-xs border border-surface-border rounded-lg
                                     text-center text-slate-700 outline-none focus:border-primary"
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs text-slate-600">
                          $ {p.unitPrice}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-500">
                        {p.weight} gm
                      </td>
                      <td className="py-3 pr-3 text-xs font-semibold text-slate-800">
                        $ {p.unitPrice * p.qty}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Package Weight + Size */}
          <div className="bg-white rounded-xl border border-surface-border p-4">
            <div className="grid grid-cols-5 gap-3">
              <FormInput
                label="Package Weight"
                placeholder="Package weight here"
                name="weight"
                value=""
                onChange={() => {}}
              />
              <div className="col-span-4">
                <label className="block text-xs text-slate-500 mb-1">
                  Package Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="Length"
                    className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                  />
                  <input
                    placeholder="Width"
                    className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                  />
                  <input
                    placeholder="Height"
                    className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Payment Information ── */}
        <div className="bg-white rounded-xl border border-surface-border p-5 self-start">
          <h3 className="text-sm font-bold text-slate-800 font-display mb-4">
            Payment Information
          </h3>
          <div className="space-y-3">
            {[
              ["Order Income", `$ ${orderIncome}`],
              ["Subtotal", `$ ${subtotal}`],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-800">
                  {val}
                </span>
              </div>
            ))}

            {/* Editable fields */}
            {[
              ["Order Discounts (USD)", discounts, setDiscounts],
              ["Shipping Fee Paid by Buyer", shippingFee, setShippingFee],
            ].map(([label, val, setVal]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-xs text-slate-500 flex-1">{label}</span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-16 px-2 py-1 text-xs border border-surface-border rounded-lg text-right
                             text-slate-700 outline-none focus:border-primary"
                />
              </div>
            ))}

            <div className="border-t border-surface-border pt-3 space-y-2">
              {[
                ["Order Value", `$ ${orderIncome}`],
                ["Estimated Profit", `$ ${orderIncome}`],
                ["Estimated Profit Rate", "100%"],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-medium text-slate-800">
                    {val}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">
                  Received Amount
                </span>
                <span className="text-sm font-bold text-slate-800">
                  $ {orderIncome}
                </span>
              </div>
            </div>

            {/* Payment type */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">
                Select Payment Type
              </p>
              <div className="flex items-center gap-4">
                {["COD", "Prepaid"].map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div
                      onClick={() => setPaymentType(type)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer
                        ${paymentType === type ? "border-primary" : "border-slate-300"}`}
                    >
                      {paymentType === type && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-xs text-slate-700 select-none">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Upload certificate */}
            <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 mt-1 transition-colors">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12l4-4 4 4" />
              </svg>
              Upload Payment Certificate
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={onBack}
          className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl
                     text-slate-700 bg-white hover:bg-surface-card transition-colors"
        >
          Cancel
        </button>
        <button
          className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark
                           text-white rounded-xl transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
