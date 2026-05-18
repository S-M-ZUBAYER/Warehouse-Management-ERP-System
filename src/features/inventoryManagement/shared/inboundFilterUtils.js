const SEARCH_FIELDS = {
  "Inbound No.": "inbound_id",
  "SKU Name": "sku_name",
};

const DATE_FIELDS = {
  "Created Time": "created_at",
  "Estimated arrival time": "estimated_arrival",
};

const startOfDay = (date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const endOfDay = (date) => {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
};

export const getInboundSearchField = (inboundType) =>
  SEARCH_FIELDS[inboundType] ?? SEARCH_FIELDS["Inbound No."];

export const getInboundDateField = (timeType) =>
  DATE_FIELDS[timeType] ?? DATE_FIELDS["Created Time"];

export const getDateRange = ({ dateFrom, dateTo }) => ({
  from: dateFrom ? startOfDay(new Date(dateFrom)) : null,
  to: dateTo ? endOfDay(new Date(dateTo)) : null,
});

export const formatInboundDateRange = ({ dateFrom, dateTo }) => {
  if (!dateFrom && !dateTo) return "All dates";

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  if (dateFrom && dateTo) {
    return `${formatter.format(new Date(dateFrom))} - ${formatter.format(new Date(dateTo))}`;
  }

  return dateFrom
    ? `From ${formatter.format(new Date(dateFrom))}`
    : `Until ${formatter.format(new Date(dateTo))}`;
};

const valueMatches = (value, query) =>
  String(value ?? "").toLowerCase().includes(query);

const lineMatches = (line, query, inboundType) => {
  const sku = line?.merchantSku ?? {};

  if (inboundType === "GTIN") {
    return valueMatches(sku.gtin ?? sku.GTIN ?? line?.gtin, query);
  }

  return (
    valueMatches(sku.sku_name, query) ||
    valueMatches(sku.sku_title, query) ||
    valueMatches(sku.sku_code, query) ||
    valueMatches(sku.name, query) ||
    valueMatches(sku.product_name, query) ||
    valueMatches(sku.productName, query) ||
    valueMatches(sku.title, query) ||
    valueMatches(line?.sku_name, query) ||
    valueMatches(line?.sku_title, query) ||
    valueMatches(line?.product_name, query) ||
    valueMatches(line?.product?.name, query)
  );
};

const getItemDate = (item, timeType) => {
  if (timeType === "Estimated arrival time") {
    return item.estimated_arrival ?? item.arrived_at ?? item.created_at;
  }

  return item.created_at ?? item.createdAt ?? item.arrived_at;
};

export const filterInboundItems = (
  items,
  { warehouseId, search, inboundType, timeType, dateFrom, dateTo },
) => {
  const query = search?.trim().toLowerCase();
  const { from, to } = getDateRange({ dateFrom, dateTo });

  return items.filter((item) => {
    if (warehouseId && String(item.warehouse?.id ?? item.warehouse_id) !== String(warehouseId)) {
      return false;
    }

    if (query) {
      const matchesSearchType = inboundType === "Inbound No."
        ? (
            valueMatches(item.inbound_id, query) ||
            valueMatches(item.tracking_number, query) ||
            valueMatches(item.supplier_reference, query)
          )
        : item.lines?.some((line) => lineMatches(line, query, inboundType));

      if (!matchesSearchType) return false;
    }

    if (from || to) {
      const itemDate = new Date(getItemDate(item, timeType));
      if (Number.isNaN(itemDate.getTime())) return false;
      if (from && itemDate < from) return false;
      if (to && itemDate > to) return false;
    }

    return true;
  });
};
