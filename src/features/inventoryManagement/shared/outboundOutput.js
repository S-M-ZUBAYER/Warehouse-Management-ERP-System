const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const outboundOutputColumns = [
  { label: "Outbound ID", key: "outboundId" },
  { label: "Warehouse", key: "warehouse" },
  { label: "Supplier", key: "supplier" },
  { label: "Supplier Reference", key: "supplierReference" },
  { label: "Tracking No.", key: "trackingNumber" },
  { label: "Estimated Arrival", key: "estimatedArrival" },
  { label: "Received Date", key: "receivedDate" },
  { label: "Status", key: "status" },
  { label: "Total SKUs", key: "totalSkus" },
  { label: "SKU", key: "sku" },
  { label: "Product", key: "product" },
  { label: "Qty Expected", key: "qtyExpected" },
  { label: "Qty Received", key: "qtyReceived" },
  { label: "Unit Cost", key: "unitCost" },
  { label: "Currency", key: "currency" },
  { label: "Notes", key: "notes" },
];

export const buildOutboundOutputRows = (items = []) =>
  items.flatMap((item) => {
    const base = {
      outboundId: item.outbound_id ?? "",
      warehouse: item.warehouse?.name ?? "",
      supplier: item.supplier_name ?? "",
      supplierReference: item.supplier_reference ?? "",
      trackingNumber: item.tracking_number ?? "",
      estimatedArrival: formatDate(item.estimated_arrival),
      receivedDate: formatDate(item.arrived_at),
      status: item.status ?? "",
      totalSkus: item.lines?.length ?? 0,
      notes: item.notes ?? "",
    };

    if (!item.lines?.length) {
      return [{
        ...base,
        sku: "",
        product: "",
        qtyExpected: "",
        qtyReceived: "",
        unitCost: "",
        currency: "",
      }];
    }

    return item.lines.map((line) => ({
      ...base,
      sku: line.merchantSku?.sku_name ?? "",
      product: line.merchantSku?.sku_title ?? "",
      qtyExpected: line.qty_expected ?? "",
      qtyReceived: line.qty_received ?? "",
      unitCost: line.unit_cost ?? "",
      currency: line.currency ?? "",
    }));
  });
