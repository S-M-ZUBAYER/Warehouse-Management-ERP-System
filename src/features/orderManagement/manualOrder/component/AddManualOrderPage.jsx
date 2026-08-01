import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Calendar, ChevronDown, Trash2, UploadCloud } from "lucide-react";
import Topbar from "../../../../components/layout/Topbar";
import {
  createManualOrder,
  fetchEasyParcelRates,
  fetchManualOrderDropdowns,
  normalizeManualOrder,
  searchWarehouseProducts,
} from "../../shared/utils/orderApi";
import { filterWarehousesByPermission } from "../../../../utils/permissions";

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
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
        type={type}
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

function SelectField({
  label,
  placeholder,
  options = [],
  value = "",
  onChange,
  name,
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
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full appearance-none pl-3 pr-7 py-2 text-sm border border-surface-border
                           rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => {
            const optionValue = option.value ?? option.code ?? option.id ?? option;
            const optionLabel = option.label ?? option.name ?? option.code ?? option;
            return (
              <option key={String(optionValue)} value={String(optionValue)}>
                {optionLabel}
              </option>
            );
          })}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>
    </div>
  );
}

const clampQuantity = (value, available) => {
  const max = Math.max(0, Number(available) || 0);
  const next = Math.max(1, Number(value) || 1);
  return max > 0 ? Math.min(next, max) : 0;
};

const normalizeQuantityForSave = (value, available) => {
  if (value === "") return 0;
  return clampQuantity(value, available);
};

const parseCurrencyNumber = (value) => Number(String(value || "0").replace(/[^0-9.-]/g, "")) || 0;

const padDatePart = (value) => String(value).padStart(2, "0");

const todayInputValue = (date = new Date()) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;

const currentTimeInputValue = (date = new Date()) =>
  `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;

const compactDateTimeValue = (date = new Date()) =>
  [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
    padDatePart(date.getHours()),
    padDatePart(date.getMinutes()),
    padDatePart(date.getSeconds()),
  ].join("");

const randomDigits = (length) => String(Math.floor(Math.random() * (10 ** length))).padStart(length, "0");

const readJsonStorage = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "") || fallback;
  } catch {
    return fallback;
  }
};

const getCurrentCompanyId = () => {
  const storedUser = readJsonStorage("warehouseUser", {});
  const authUser = readJsonStorage("auth-storage", {});
  return (
    storedUser?.companyId ||
    storedUser?.company_id ||
    storedUser?.company?.id ||
    authUser?.state?.user?.companyId ||
    authUser?.state?.user?.company_id ||
    authUser?.state?.user?.company?.id ||
    storedUser?.id ||
    authUser?.state?.user?.id ||
    "0"
  );
};

const generateOrderNumber = (warehouseId) => {
  const companyId = String(getCurrentCompanyId() || "0").replace(/\D/g, "") || "0";
  const normalizedWarehouseId = String(warehouseId || "0").replace(/\D/g, "") || "0";
  return `${randomDigits(4)}${normalizedWarehouseId}${randomDigits(2)}${companyId}${compactDateTimeValue()}`;
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read payment certificate file"));
    reader.readAsDataURL(file);
  });


const normalizeCountryCode = (value, fallback = "MY") => {
  const raw = String(value || fallback).trim().toUpperCase();
  if (!raw) return fallback;
  if (["MALAYSIA", "MYS"].includes(raw)) return "MY";
  if (["SINGAPORE", "SGP"].includes(raw)) return "SG";
  if (["THAILAND", "THAI", "THA"].includes(raw)) return "TH";
  if (["INDONESIA", "IDN"].includes(raw)) return "ID";
  return raw.slice(0, 2);
};

const countryOptions = [
  { value: "MY", label: "Malaysia" },
  { value: "SG", label: "Singapore" },
  { value: "TH", label: "Thailand" },
  { value: "ID", label: "Indonesia" },
];

const formatRateMoney = (rate) => {
  const price = Number(rate?.price || rate?.shipmentPrice || 0);
  const currency = rate?.currency || "";
  return price > 0 ? `${currency} ${price.toFixed(2)}`.trim() : "Price unavailable";
};

export default function AddManualOrderPage({ mode = "order", onBack, onCreated }) {
  const isGift = mode === "gift";

  const [buyerForm, setBuyerForm] = useState({
    buyerName: "",
    phone: "",
    email: "",
    address: "",
    country: "MY",
    state: "",
    city: "",
    area: "",
    zipCode: "",
    unit: "",
  });
  const [senderForm, setSenderForm] = useState({
    senderName: "",
    company: "",
    phone: "",
    address: "",
    country: "MY",
    state: "",
    city: "",
    postcode: "",
    unit: "",
  });
  const [orderForm, setOrderForm] = useState({
    warehouseId: "",
    orderNumber: "",
    selectTime: currentTimeInputValue(),
    selectDate: todayInputValue(),
    logistic: "",
    currency: "USD",
  });
  const [orderNumberEdited, setOrderNumberEdited] = useState(false);
  const [packageForm, setPackageForm] = useState({
    weight: "0.5",
    length: "",
    width: "",
    height: "",
  });
  const [easyParcelContent, setEasyParcelContent] = useState("Product");
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [addedProducts, setAddedProducts] = useState([]);
  const [paymentType, setPaymentType] = useState("COD");
  const [codAmount, setCodAmount] = useState("");
  const [discounts, setDiscounts] = useState("$0");
  const [shippingFee, setShippingFee] = useState("$0");
  const [paymentCertificate, setPaymentCertificate] = useState(null);

  const dropdownsQuery = useQuery({
    queryKey: ["manual-order-dropdowns"],
    queryFn: fetchManualOrderDropdowns,
    staleTime: 1000 * 60 * 5,
  });

  const warehouses = filterWarehousesByPermission(dropdownsQuery.data?.warehouses || []);
  const currencies = dropdownsQuery.data?.currencies || [];

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        value: warehouse.id,
        label: `${warehouse.name || warehouse.code || `Warehouse ${warehouse.id}`}${warehouse.code ? ` (${warehouse.code})` : ""}`,
      })),
    [warehouses]
  );

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => String(warehouse.id) === String(orderForm.warehouseId)),
    [warehouses, orderForm.warehouseId]
  );

  const currencyOptions = useMemo(
    () => currencies.map((currency) => ({ value: currency.code, label: `${currency.code} - ${currency.name}` })),
    [currencies]
  );

  useEffect(() => {
    const defaultWarehouse = warehouses.find((warehouse) => warehouse.is_default) || warehouses[0];
    if (!orderForm.warehouseId && defaultWarehouse?.id) {
      setOrderForm((prev) => ({ ...prev, warehouseId: String(defaultWarehouse.id) }));
    }
  }, [orderForm.warehouseId, warehouses]);

  useEffect(() => {
    if (!orderForm.warehouseId || orderNumberEdited) return;
    setOrderForm((prev) => ({
      ...prev,
      orderNumber: prev.orderNumber || generateOrderNumber(prev.warehouseId),
    }));
  }, [orderForm.warehouseId, orderNumberEdited]);

  useEffect(() => {
    if (!selectedWarehouse) return;
    const warehouseCountry = normalizeCountryCode(selectedWarehouse.country, "MY");
    setSenderForm((prev) => ({
      ...prev,
      senderName: selectedWarehouse.manager_name || selectedWarehouse.managerName || selectedWarehouse.name || "",
      company: selectedWarehouse.name || selectedWarehouse.code || "",
      phone: selectedWarehouse.phone || selectedWarehouse.phone_number || selectedWarehouse.contact_phone || "",
      address: selectedWarehouse.location || selectedWarehouse.address || selectedWarehouse.full_address || selectedWarehouse.fullAddress || "",
      country: countryOptions.some((country) => country.value === warehouseCountry) ? warehouseCountry : prev.country || "MY",
      state: selectedWarehouse.state || selectedWarehouse.province || "",
      city: selectedWarehouse.city || "",
      postcode: selectedWarehouse.postcode || selectedWarehouse.zipCode || selectedWarehouse.zip_code || selectedWarehouse.postalCode || selectedWarehouse.postal_code || "",
    }));
  }, [selectedWarehouse]);

  useEffect(() => {
    if (addedProducts.length && easyParcelContent === "Product") {
      const firstNames = addedProducts.map((product) => product.name || product.sku).filter(Boolean).slice(0, 2);
      if (firstNames.length) setEasyParcelContent(firstNames.join(", ").slice(0, 35));
    }
  }, [addedProducts, easyParcelContent]);

  const totalPackageWeight = useMemo(() => {
    const typedWeight = Number(packageForm.weight);
    if (Number.isFinite(typedWeight) && typedWeight > 0) return typedWeight;
    const itemWeight = addedProducts.reduce((sum, product) => sum + (Number(product.weight) || 0) * (Number(product.qty) || 0), 0);
    return Math.max(0.1, itemWeight / 1000 || 0.5);
  }, [addedProducts, packageForm.weight]);

  const orderIncome = addedProducts.reduce(
    (sum, product) => sum + (Number(product.unitPrice) || 0) * (Number(product.qty) || 0),
    0
  );
  const subtotal = orderIncome;
  const orderValue = orderIncome - parseCurrencyNumber(discounts) + parseCurrencyNumber(shippingFee);
  const estimatedProfitRate = orderIncome > 0 ? "100%" : "0%";
  const effectiveCodAmount = paymentType === "COD" ? parseCurrencyNumber(codAmount || orderValue || subtotal) : 0;

  useEffect(() => {
    if (paymentType === "COD" && !codAmount && orderValue > 0) {
      setCodAmount(String(orderValue));
    }
  }, [codAmount, orderValue, paymentType]);


  const easyParcelQuery = useQuery({
    queryKey: [
      "manual-order-easyparcel-rates",
      orderForm.warehouseId,
      senderForm.country,
      senderForm.state,
      senderForm.postcode,
      buyerForm.country,
      buyerForm.state,
      buyerForm.zipCode,
      totalPackageWeight,
      packageForm.length,
      packageForm.width,
      packageForm.height,
      orderForm.selectDate,
      orderValue,
    ],
    queryFn: () =>
      fetchEasyParcelRates({
        warehouseId: orderForm.warehouseId,
        senderName: senderForm.senderName,
        senderCompany: senderForm.company,
        senderPhone: senderForm.phone,
        senderAddress: senderForm.address,
        senderCity: senderForm.city,
        senderState: senderForm.state,
        senderPostcode: senderForm.postcode,
        senderCountry: senderForm.country,
        senderUnit: senderForm.unit,
        buyerName: buyerForm.buyerName,
        phone: buyerForm.phone,
        email: buyerForm.email,
        address: buyerForm.address,
        city: buyerForm.city,
        state: buyerForm.state,
        zipCode: buyerForm.zipCode,
        country: buyerForm.country,
        unit: buyerForm.unit,
        weight: totalPackageWeight,
        length: packageForm.length,
        width: packageForm.width,
        height: packageForm.height,
        collectDate: orderForm.selectDate,
        parcelValue: Math.max(1, orderValue || subtotal || 1),
      }),
    enabled: Boolean(orderForm.warehouseId && senderForm.postcode && buyerForm.zipCode && senderForm.country && buyerForm.country),
    staleTime: 1000 * 60,
  });

  const easyParcelServices = easyParcelQuery.data?.services || [];
  const selectableEasyParcelServices = paymentType === "COD"
    ? easyParcelServices.filter((service) => service.codAvailable)
    : easyParcelServices;
  const logisticOptions = selectableEasyParcelServices.map((service) => ({
    value: service.serviceId || service.id,
    label: `${service.company}${service.serviceName ? ` - ${service.serviceName}` : ""} (${formatRateMoney(service)})${paymentType === "COD" ? " - COD" : ""}`,
  }));
  const selectedLogistic = easyParcelServices.find(
    (service) => String(service.serviceId || service.id) === String(orderForm.logistic)
  );

  useEffect(() => {
    if (paymentType === "COD" && selectedLogistic && !selectedLogistic.codAvailable) {
      setOrderForm((prev) => ({ ...prev, logistic: "" }));
    }
  }, [paymentType, selectedLogistic]);

  useEffect(() => {
    if (!selectedLogistic) return;
    const ratePrice = Number(selectedLogistic.price || selectedLogistic.shipmentPrice || 0);
    if (ratePrice > 0) setShippingFee(`${selectedLogistic.currency || orderForm.currency || ""} ${ratePrice.toFixed(2)}`.trim());
  }, [selectedLogistic, orderForm.currency]);

  const handleBuyerChange = (e) => {
    const { name, value } = e.target;
    setBuyerForm((prev) => ({ ...prev, [name]: value }));
    if (["country", "state", "zipCode"].includes(name)) {
      setOrderForm((prev) => ({ ...prev, logistic: "" }));
    }
  };

  const handleSenderChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "country" ? normalizeCountryCode(value, "MY") : value;
    setSenderForm((prev) => ({ ...prev, [name]: nextValue }));
    if (name === "country") {
      setBuyerForm((prev) => ({ ...prev, country: nextValue }));
    }
    if (["country", "state", "postcode"].includes(name)) {
      setOrderForm((prev) => ({ ...prev, logistic: "" }));
    }
  };

  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    if (name === "orderNumber") setOrderNumberEdited(true);
    setOrderForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "warehouseId" && !orderNumberEdited ? { orderNumber: generateOrderNumber(value) } : {}),
      ...(name === "warehouseId" ? { logistic: "" } : {}),
    }));
    if (name === "warehouseId") {
      setSearchResults(null);
      setProductSearch("");
      setAddedProducts([]);
    }
  };

  const handlePackageChange = (e) =>
    setPackageForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePaymentCertificateChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Upload a PDF or image payment certificate.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Payment certificate file size must be 3MB or less.");
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setPaymentCertificate({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
      });
    } catch (err) {
      toast.error(err?.message || "Failed to read payment certificate file");
    }
  };

  const saveMutation = useMutation({
    mutationFn: createManualOrder,
    onSuccess: (data) => {
      const easyParcel = data?.easyParcel || data?.order?.easyParcel;
      if (data?.easyParcelError) {
        toast.error(data?.message || data.easyParcelError);
      } else {
        toast.success(data?.message || `${isGift ? "Gift" : "Manual"} order saved`);
      }
      if (easyParcel?.awb) toast.success(`EasyParcel AWB generated: ${easyParcel.awb}`);
      const normalizedOrder = normalizeManualOrder({
        ...(data?.order || {}),
        easyParcel,
        pdfUrl: data?.pdfUrl || data?.waybillPdfUrl || data?.awbLink,
        pdfFilename: data?.pdfFilename || data?.fileName || data?.filename,
      });
      onCreated?.(normalizedOrder);
      onBack?.();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to save manual order");
    },
  });

  const handleSearch = async () => {
    if (!orderForm.warehouseId) {
      toast.error("Please select warehouse first");
      return;
    }

    setProductSearchLoading(true);
    try {
      const results = await searchWarehouseProducts({
        search: productSearch,
        warehouseId: orderForm.warehouseId,
      });
      setSearchResults(results);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to search products");
      setSearchResults([]);
    } finally {
      setProductSearchLoading(false);
    }
  };

  const addProductFromSearch = (product) => {
    if (addedProducts.find((p) => String(p.id) === String(product.id))) return;
    const availableForPlatform = Number(product.availableForPlatform ?? product.available ?? 0);
    if (availableForPlatform <= 0) {
      toast.error("This SKU has no available inventory");
      return;
    }
    setAddedProducts((prev) => [
      ...prev,
      {
        ...product,
        qty: 1,
        unitPrice: isGift ? 0 : Number(product.unitPrice) || Number(product.price) || 0,
        availableForPlatform,
      },
    ]);
    setSearchResults(null);
    setProductSearch("");
  };

  const removeProduct = (id) =>
    setAddedProducts((prev) => prev.filter((item) => item.id !== id));

  const updateQty = (id, val) =>
    setAddedProducts((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qty: val === "" ? "" : clampQuantity(val, item.availableForPlatform ?? item.available) }
          : item
      )
    );

  const validateEasyParcelBeforeBooking = () => {
    const missing = [];
    const senderCountry = normalizeCountryCode(senderForm.country);
    const receiverCountry = normalizeCountryCode(buyerForm.country);
    if (!selectedLogistic) missing.push("EasyParcel courier service");
    if (!senderForm.senderName.trim()) missing.push("sender name");
    if (!senderForm.phone.trim()) missing.push("sender phone");
    if (!senderForm.address.trim()) missing.push("sender address");
    if (!senderForm.country.trim()) missing.push("sender country");
    if (!senderForm.postcode.trim()) missing.push("sender postcode");
    if (senderCountry === "MY" && !senderForm.state.trim()) missing.push("sender state");
    if (!buyerForm.buyerName.trim()) missing.push("receiver name");
    if (!buyerForm.phone.trim()) missing.push("receiver phone");
    if (!buyerForm.address.trim()) missing.push("receiver address");
    if (!buyerForm.country.trim()) missing.push("receiver country");
    if (!buyerForm.zipCode.trim()) missing.push("receiver postcode");
    if (receiverCountry === "MY" && !buyerForm.state.trim()) missing.push("receiver state");

    if (!["MY", "SG", "TH", "ID"].includes(senderCountry) || !["MY", "SG", "TH", "ID"].includes(receiverCountry)) {
      toast.error("EasyParcel manual booking is enabled only for Malaysia, Singapore, Thailand and Indonesia.");
      return false;
    }
    if (senderCountry !== receiverCountry) {
      toast.error("EasyParcel manual booking supports domestic shipment only. Sender and receiver country must be the same.");
      return false;
    }
    if (paymentType === "COD" && selectedLogistic && !selectedLogistic.codAvailable) {
      toast.error("Selected EasyParcel courier does not support COD. Select a COD-supported courier or change payment type to Prepaid.");
      return false;
    }
    if (paymentType === "COD" && effectiveCodAmount <= 0) {
      toast.error("COD amount must be greater than 0.");
      return false;
    }

    if (missing.length) {
      toast.error(`Missing EasyParcel information: ${missing.join(", ")}`);
      return false;
    }
    return true;
  };

  const buildManualOrderPayload = ({ bookNow = false } = {}) => ({
    type: isGift ? "gift" : "manual_order",
    warehouseId: Number(orderForm.warehouseId),
    orderNumber: orderForm.orderNumber,
    orderTime: `${orderForm.selectDate || ""} ${orderForm.selectTime || ""}`.trim(),
    logisticServiceId: orderForm.logistic,
    logisticCompany: selectedLogistic?.company || selectedLogistic?.serviceName || "",
    logisticRaw: selectedLogistic || null,
    currency: orderForm.currency || "USD",
    buyer: buyerForm,
    items: addedProducts.map((product) => {
      const isCombine = product.skuType === "combine" || product.combineSkuId;
      return {
        ...(isCombine
          ? { combineSkuId: product.combineSkuId || String(product.id).replace(/^combine:/, "") }
          : { merchantSkuId: product.merchantSkuId || String(product.id).replace(/^merchant:/, "") }),
        sku: product.sku,
        productName: product.name,
        quantity: normalizeQuantityForSave(product.qty, product.availableForPlatform ?? product.available),
        unitPrice: product.unitPrice,
        weight: product.weight,
        image: product.image,
      };
    }),
    package: {
      weight: totalPackageWeight,
      length: packageForm.length,
      width: packageForm.width,
      height: packageForm.height,
    },
    payment: {
      paymentType,
      orderIncome,
      subtotal,
      discounts: parseCurrencyNumber(discounts),
      shippingFee: parseCurrencyNumber(shippingFee),
      orderValue,
      codAmount: effectiveCodAmount,
      paymentCertificate: paymentCertificate
        ? { name: paymentCertificate.name, type: paymentCertificate.type, size: paymentCertificate.size }
        : null,
    },
    paymentCertificate,
    easyParcel: {
      bookNow,
      sender: senderForm,
      receiverEmail: buyerForm.email,
      selectedRate: selectedLogistic || null,
      collectDate: orderForm.selectDate,
      content: easyParcelContent,
      parcelValue: Math.max(1, paymentType === "COD" ? effectiveCodAmount : (orderValue || subtotal || 1)),
    },
  });

  const handleSave = ({ bookNow = false } = {}) => {
    if (!orderForm.warehouseId) {
      toast.error("Warehouse is required");
      return;
    }
    if (!orderForm.orderNumber.trim()) {
      toast.error("Order number is required");
      return;
    }
    if (addedProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }
    if (addedProducts.some((product) => normalizeQuantityForSave(product.qty, product.availableForPlatform ?? product.available) <= 0)) {
      toast.error("Product quantity must be at least 1");
      return;
    }
    if (bookNow && !validateEasyParcelBeforeBooking()) return;

    saveMutation.mutate(buildManualOrderPayload({ bookNow }));
  };

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Back to Manual Order" showBack onBack={onBack} />

      <div className="bg-white rounded-xl border border-surface-border p-4">
        <div className="grid grid-cols-6 gap-3">
          <SelectField
            label="Select Warehouse"
            name="warehouseId"
            placeholder={dropdownsQuery.isLoading ? "Loading warehouses..." : "Warehouse here"}
            options={warehouseOptions}
            value={orderForm.warehouseId}
            onChange={handleOrderChange}
            required
          />
          <FormInput
            label="Order Number"
            placeholder="Auto generated order number"
            name="orderNumber"
            value={orderForm.orderNumber}
            onChange={handleOrderChange}
            required
          />
          <FormInput
            label="Select Time"
            placeholder="13:35"
            name="selectTime"
            value={orderForm.selectTime}
            onChange={handleOrderChange}
            type="time"
          />
          <div>
            <label className="block text-xs text-slate-500 mb-1">Select Date</label>
            <div className="relative">
              <input
                type="date"
                name="selectDate"
                value={orderForm.selectDate}
                onChange={handleOrderChange}
                className="w-full px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 outline-none focus:border-primary"
              />
              <Calendar size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <SelectField
            label="Select Currency"
            name="currency"
            placeholder="Currency Type"
            options={currencyOptions}
            value={orderForm.currency}
            onChange={handleOrderChange}
          />
        </div>
        {easyParcelQuery.data?.message && (
          <p className="mt-2 text-xs text-amber-600">{easyParcelQuery.data.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-surface-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 font-display">Sender / Warehouse Information</h3>
              <span className="text-[11px] text-slate-400">Used only for EasyParcel rates and booking</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <FormInput label="Sender Name" placeholder="Warehouse contact name" name="senderName" value={senderForm.senderName} onChange={handleSenderChange} />
              <FormInput label="Company" placeholder="Company / warehouse name" name="company" value={senderForm.company} onChange={handleSenderChange} />
              <FormInput label="Phone Number" placeholder="Sender phone" name="phone" value={senderForm.phone} onChange={handleSenderChange} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <FormInput className="col-span-2" label="Address" placeholder="Full address" name="address" value={senderForm.address} onChange={handleSenderChange} />
              <SelectField label="Origin Country" name="country" placeholder="Country" options={countryOptions} value={senderForm.country} onChange={handleSenderChange} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <FormInput label="State" placeholder="MY-14 / Kuala Lumpur (SG optional)" name="state" value={senderForm.state} onChange={handleSenderChange} />
              <FormInput label="City" placeholder="City" name="city" value={senderForm.city} onChange={handleSenderChange} />
              <FormInput label="Postcode" placeholder="Postcode" name="postcode" value={senderForm.postcode} onChange={handleSenderChange} />
            </div>
          </div>

          <div
            className="bg-white rounded-xl p-5"
            style={{ border: isGift ? "1.5px dashed #004368" : "1px solid #E2E8F0" }}
          >
            <h3 className="text-sm font-bold text-slate-800 font-display mb-4">Buyer / Receiver Information</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <FormInput label="Buyer Name" placeholder="Buyer name here" name="buyerName" value={buyerForm.buyerName} onChange={handleBuyerChange} />
              <FormInput label="Phone Number" placeholder="Phone Number Here" name="phone" value={buyerForm.phone} onChange={handleBuyerChange} />
              <FormInput label="Email" placeholder="Email for label/notification" name="email" value={buyerForm.email} onChange={handleBuyerChange} />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <FormInput className="col-span-2" label="Address" placeholder="Buyer address here" name="address" value={buyerForm.address} onChange={handleBuyerChange} />
              <SelectField label="Destination Country" name="country" placeholder="Country" options={countryOptions} value={buyerForm.country} onChange={handleBuyerChange} />
            </div>
            <div className="grid grid-cols-5 gap-3">
              <FormInput label="State" placeholder="MY-14 / Kuala Lumpur (SG optional)" name="state" value={buyerForm.state} onChange={handleBuyerChange} />
              <FormInput label="City" placeholder="City name here" name="city" value={buyerForm.city} onChange={handleBuyerChange} />
              <FormInput label="Area" placeholder="Area name here" name="area" value={buyerForm.area} onChange={handleBuyerChange} />
              <FormInput label="Zip Code" placeholder="Zip code here" name="zipCode" value={buyerForm.zipCode} onChange={handleBuyerChange} />
              <FormInput label="Unit" placeholder="Unit / floor / building" name="unit" value={buyerForm.unit} onChange={handleBuyerChange} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-surface-border p-5 min-h-[360px]">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Merchant / Combine SKU from selected warehouse"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg
                             text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={productSearchLoading || !orderForm.warehouseId}
                className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {productSearchLoading ? "Searching..." : "Search"}
              </button>

              {searchResults && (
                <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-full max-h-80 overflow-y-auto overflow-x-hidden rounded-lg border border-surface-border bg-white shadow-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-bold [&_th]:text-slate-800">
                        <th className="w-10 pl-4">Select</th>
                        <th className="pl-4">Image</th>
                        <th className="pl-4">SKU</th>
                        <th className="pl-4">Available Inventory</th>
                        <th className="pl-4">Available For Platform</th>
                        <th className="pl-4">Lock Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border">
                      {searchResults.length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-xs text-slate-400">No SKU found</td></tr>
                      ) : (
                        searchResults.map((product) => {
                          const availableForPlatform = Number(product.availableForPlatform ?? product.available ?? 0);
                          return (
                            <tr key={product.id} className="hover:bg-surface/50 cursor-pointer" onClick={() => addProductFromSearch(product)}>
                              <td className="py-2.5 pl-4">
                                <input
                                  type="radio"
                                  checked={Boolean(addedProducts.find((p) => String(p.id) === String(product.id)))}
                                  readOnly
                                  disabled={availableForPlatform <= 0}
                                  className="w-4 h-4 border-slate-300 accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                />
                              </td>
                              <td className="py-2.5 pl-4">
                                <img src={product.image} alt={product.sku} className="w-8 h-8 rounded object-cover" />
                              </td>
                              <td className="py-2.5 pl-4 font-mono text-xs text-slate-700">{product.sku}</td>
                              <td className="py-2.5 pl-4 text-slate-700">{Number(product.totalAvailable ?? product.onHand ?? 0).toLocaleString()}</td>
                              <td className="py-2.5 pl-4 text-slate-700">{availableForPlatform.toLocaleString()}</td>
                              <td className="py-2.5 pl-4 text-slate-700">{Number(product.lockQuantity ?? product.allocated ?? 0).toLocaleString()}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {addedProducts.length === 0 ? (
              <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-surface-border text-xs text-slate-400">
                Select a warehouse and search Merchant / Combine SKU to add products.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
                  <tr className="border-b border-surface-border">
                    {["Image", "Product Name", "* Quantity", "Available For Platform", "Unit Price", "Weight", "Total", "Action"].map((h) => (
                      <th key={h} className="py-2.5 text-left text-xs font-semibold text-slate-600 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {addedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 pr-3"><img src={product.image} alt={product.sku} className="w-9 h-9 rounded-lg object-cover" /></td>
                      <td className="py-3 pr-3 text-xs text-slate-700"><span className="block max-w-44 truncate">{product.name}</span></td>
                      <td className="py-3 pr-3">
                        <input
                          type="number"
                          min={1}
                          max={Math.max(1, Number(product.availableForPlatform ?? product.available) || 1)}
                          value={product.qty}
                          onChange={(e) => updateQty(product.id, e.target.value)}
                          title={`Available for platform: ${Number(product.availableForPlatform ?? product.available ?? 0).toLocaleString()}`}
                          className="w-14 px-2 py-1 text-xs border border-surface-border rounded-lg text-center text-slate-700 outline-none focus:border-primary"
                        />
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-500">{Number(product.availableForPlatform ?? product.available ?? 0).toLocaleString()}</td>
                      <td className="py-3 pr-3"><span className="text-xs text-slate-600">$ {Number(product.unitPrice || 0).toFixed(isGift ? 1 : 0)}</span></td>
                      <td className="py-3 pr-3 text-xs text-slate-500">{Number(product.weight || 0).toLocaleString()} gm</td>
                      <td className="py-3 pr-3 text-xs font-semibold text-slate-800">$ {Number(product.unitPrice || 0) * Number(product.qty || 0)}</td>
                      <td className="py-3">
                        <button onClick={() => removeProduct(product.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-white rounded-xl border border-surface-border p-4">
            <div className="grid grid-cols-5 gap-3">
              <FormInput label="Package Weight" placeholder="Package weight kg" name="weight" value={packageForm.weight} onChange={handlePackageChange} />
              <div className="col-span-4">
                <label className="block text-xs text-slate-500 mb-1">Package Size</label>
                <div className="grid grid-cols-3 gap-2">
                  <input name="length" value={packageForm.length} onChange={handlePackageChange} placeholder="Length" className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary" />
                  <input name="width" value={packageForm.width} onChange={handlePackageChange} placeholder="Width" className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary" />
                  <input name="height" value={packageForm.height} onChange={handlePackageChange} placeholder="Height" className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-white text-slate-700 placeholder-slate-400 outline-none focus:border-primary" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <FormInput className="col-span-3" label="EasyParcel Content" placeholder="Product description for MY/SG/TH/ID domestic shipment" name="easyParcelContent" value={easyParcelContent} onChange={(e) => setEasyParcelContent(e.target.value)} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-surface-border p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-display">EasyParcel Courier Rates</h3>
                <p className="text-xs text-slate-400 mt-1">Fill sender, receiver and package information to show available courier companies and prices.</p>
              </div>
              <button
                onClick={() => easyParcelQuery.refetch()}
                disabled={!orderForm.warehouseId || !senderForm.postcode || !buyerForm.zipCode || easyParcelQuery.isFetching}
                className="px-4 py-2 text-xs font-semibold border border-surface-border rounded-lg text-slate-600 hover:bg-surface-card disabled:opacity-60 whitespace-nowrap"
              >
                {easyParcelQuery.isFetching ? "Checking..." : "Check Rates"}
              </button>
            </div>

            {easyParcelServices.length === 0 ? (
              <div className="rounded-lg border border-dashed border-surface-border p-4 text-xs text-slate-400">
                {easyParcelQuery.data?.message || "No courier rates loaded yet."}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {easyParcelServices.map((service) => {
                  const serviceKey = service.serviceId || service.id;
                  const active = String(orderForm.logistic) === String(serviceKey);
                  const disabledForCod = paymentType === "COD" && !service.codAvailable;
                  return (
                    <button
                      key={String(serviceKey)}
                      type="button"
                      disabled={disabledForCod}
                      onClick={() => setOrderForm((prev) => ({ ...prev, logistic: String(serviceKey) }))}
                      className={`text-left rounded-xl border p-4 transition-all disabled:cursor-not-allowed disabled:opacity-60 ${active ? "border-primary bg-primary/5" : "border-surface-border bg-white hover:border-primary/50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{service.company}</p>
                          <p className="text-xs text-slate-500 mt-1">{service.serviceName || service.serviceDetail || "Courier service"}</p>
                          {service.delivery && <p className="text-[11px] text-slate-400 mt-1">Delivery: {service.delivery}</p>}
                          <p className={`text-[11px] mt-1 ${service.codAvailable ? "text-emerald-600" : "text-slate-400"}`}>
                            {service.codAvailable ? "COD available" : "COD not available"}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-primary whitespace-nowrap">{formatRateMoney(service)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="mt-4 text-xs text-slate-500">
              Save + Submit EasyParcel will create the MY/SG/TH/ID domestic shipment through the current EasyParcel Open API connection.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-border p-5 self-start">
          <h3 className="text-sm font-bold text-slate-800 font-display mb-4">Payment Information</h3>
          <div className="space-y-3">
            {[
              ["Order Income", `$ ${orderIncome}`],
              ["Subtotal", `$ ${subtotal}`],
            ].map(([label, val]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{label}</span>
                <span className="text-sm font-semibold text-slate-800">{val}</span>
              </div>
            ))}

            {[
              ["Order Discounts (USD)", discounts, setDiscounts],
              ["Shipping Fee Paid by Buyer", shippingFee, setShippingFee],
            ].map(([label, val, setVal]) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 flex-1">{label}</span>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  className="w-24 px-2 py-1 text-xs border border-surface-border rounded-lg text-right text-slate-700 outline-none focus:border-primary"
                />
              </div>
            ))}

            {paymentType === "COD" && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 px-3 py-2">
                <span className="text-xs font-semibold text-amber-700 flex-1">COD Amount</span>
                <input
                  type="text"
                  value={codAmount}
                  onChange={(e) => setCodAmount(e.target.value)}
                  placeholder={String(orderValue || subtotal || 0)}
                  className="w-24 px-2 py-1 text-xs border border-amber-200 rounded-lg text-right text-slate-700 outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="border-t border-surface-border pt-3 space-y-2">
              {[
                ["Order Value", `$ ${orderValue}`],
                ["Selected Courier", selectedLogistic ? `${selectedLogistic.company} - ${formatRateMoney(selectedLogistic)}` : "Not selected"],
                ["COD Amount", paymentType === "COD" ? `$ ${effectiveCodAmount}` : "Not COD"],
                ["Estimated Profit", `$ ${orderIncome}`],
                ["Estimated Profit Rate", estimatedProfitRate],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className="text-xs font-medium text-slate-800 text-right">{val}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">Received Amount</span>
                <span className="text-sm font-bold text-slate-800">$ {orderIncome}</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Select Payment Type</p>
              <div className="flex items-center gap-4">
                {["COD", "Prepaid"].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <div
                      onClick={() => setPaymentType(type)}
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${paymentType === type ? "border-primary" : "border-slate-300"}`}
                    >
                      {paymentType === type && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-xs text-slate-700 select-none">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <input
                id="manual-payment-certificate"
                type="file"
                accept="image/*,application/pdf"
                onChange={handlePaymentCertificateChange}
                className="hidden"
              />
              <label
                htmlFor="manual-payment-certificate"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-surface-border py-2 text-xs text-slate-500 hover:text-slate-700 mt-1 transition-colors"
              >
                <UploadCloud size={15} className="text-primary" />
                {paymentCertificate ? "Change Payment Certificate" : "Upload Payment Certificate"}
              </label>
              {paymentCertificate && (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="min-w-0 flex-1 truncate" title={paymentCertificate.name}>
                    {paymentCertificate.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPaymentCertificate(null)}
                    className="font-semibold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={onBack}
          className="px-7 py-2.5 text-sm font-semibold border border-surface-border rounded-xl whitespace-nowrap
                     text-slate-700 bg-white hover:bg-surface-card transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => handleSave({ bookNow: false })}
          disabled={saveMutation.isPending}
          className="px-7 py-2.5 text-sm font-semibold border border-primary text-primary rounded-xl hover:bg-primary/5 transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {saveMutation.isPending ? "Saving..." : "Save Only"}
        </button>
        <button
          onClick={() => handleSave({ bookNow: true })}
          disabled={saveMutation.isPending}
          className="px-7 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark whitespace-nowrap
                           text-white rounded-xl transition-colors disabled:opacity-60"
        >
          {saveMutation.isPending ? "Processing..." : "Save + Submit EasyParcel"}
        </button>
      </div>
    </div>
  );
}
