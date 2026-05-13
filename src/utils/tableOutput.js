import { toast } from "sonner";

const valueForKey = (row, key) => {
  if (!key) return "";
  const parts = String(key).split(".");
  let value = row;
  for (const p of parts) value = value?.[p];
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return value.name || value.store_name || value.sku_name || JSON.stringify(value);
  return String(value);
};

const normalizeColumns = (rows, columns) => {
  if (columns?.length) return columns;
  const first = rows[0] || {};
  return Object.keys(first)
    .filter((k) => !["image", "image_url", "avatar_url", "photo"].includes(k))
    .slice(0, 12)
    .map((key) => ({ key, label: key.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) }));
};

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export function requireSelectedRows(rows, itemName = "row") {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    toast.error(`Please select at least one ${itemName} first.`);
    return null;
  }
  return list;
}

export function exportRowsToCsv(rows, columns, filename = "export.csv", itemName = "row") {
  const selected = requireSelectedRows(rows, itemName);
  if (!selected) return;
  const cols = normalizeColumns(selected, columns);
  const csv = [
    cols.map((c) => csvEscape(c.label)).join(","),
    ...selected.map((row) => cols.map((c) => csvEscape(c.render ? c.render(row) : valueForKey(row, c.key))).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`${selected.length} ${itemName}(s) exported successfully.`);
}

export function printRows(rows, columns, title = "Selected Records", itemName = "row") {
  const selected = requireSelectedRows(rows, itemName);
  if (!selected) return;
  const cols = normalizeColumns(selected, columns);
  const htmlRows = selected.map((row) => `
    <tr>${cols.map((c) => `<td>${String(c.render ? c.render(row) : valueForKey(row, c.key)).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;padding:24px;color:#0f172a} h1{font-size:20px;margin-bottom:16px}
    table{border-collapse:collapse;width:100%;font-size:12px} th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;vertical-align:top} th{background:#f8fafc}
  </style></head><body><h1>${title}</h1><table><thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table></body></html>`;
  const win = window.open("", "_blank");
  if (!win) {
    toast.error("Popup blocked. Please allow popups to print.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
}
