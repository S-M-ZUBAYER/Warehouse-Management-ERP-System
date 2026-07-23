import { toast } from "sonner";
import { translateStaticText } from "../i18nDomTranslator";

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


const translateColumnLabel = (value) => translateStaticText(String(value ?? ""));

const translateColumns = (columns) =>
  columns.map((column) => ({
    ...column,
    label: translateColumnLabel(column.label),
  }));

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const xmlEscape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const toDosTime = (date) =>
  ((date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)) & 0xffff;

const toDosDate = (date) =>
  (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;

const pushUint16 = (arr, value) => {
  arr.push(value & 0xff, (value >>> 8) & 0xff);
};

const pushUint32 = (arr, value) => {
  arr.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
};

const makeZip = (files) => {
  const encoder = new TextEncoder();
  const now = new Date();
  const fileRecords = [];
  const chunks = [];
  let offset = 0;

  files.forEach(({ name, content }) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = [];
    pushUint32(local, 0x04034b50);
    pushUint16(local, 20);
    pushUint16(local, 0);
    pushUint16(local, 0);
    pushUint16(local, toDosTime(now));
    pushUint16(local, toDosDate(now));
    pushUint32(local, crc);
    pushUint32(local, data.length);
    pushUint32(local, data.length);
    pushUint16(local, nameBytes.length);
    pushUint16(local, 0);
    chunks.push(new Uint8Array(local), nameBytes, data);
    fileRecords.push({ nameBytes, crc, size: data.length, offset });
    offset += local.length + nameBytes.length + data.length;
  });

  const centralStart = offset;
  fileRecords.forEach(({ nameBytes, crc, size, offset: fileOffset }) => {
    const central = [];
    pushUint32(central, 0x02014b50);
    pushUint16(central, 20);
    pushUint16(central, 20);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint16(central, toDosTime(now));
    pushUint16(central, toDosDate(now));
    pushUint32(central, crc);
    pushUint32(central, size);
    pushUint32(central, size);
    pushUint16(central, nameBytes.length);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint16(central, 0);
    pushUint32(central, 0);
    pushUint32(central, fileOffset);
    chunks.push(new Uint8Array(central), nameBytes);
    offset += central.length + nameBytes.length;
  });

  const end = [];
  pushUint32(end, 0x06054b50);
  pushUint16(end, 0);
  pushUint16(end, 0);
  pushUint16(end, fileRecords.length);
  pushUint16(end, fileRecords.length);
  pushUint32(end, offset - centralStart);
  pushUint32(end, centralStart);
  pushUint16(end, 0);
  chunks.push(new Uint8Array(end));

  return new Blob(chunks, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export function requireSelectedRows(rows, itemName = "row") {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    const message =
      itemName === "manual inbound"
        ? "Please select minimum one inbound"
        : `Please select at least one ${itemName} first.`;
    toast.error(translateStaticText(message));
    return null;
  }
  return list;
}

export function exportRowsToCsv(rows, columns, filename = "export.csv", itemName = "row") {
  const selected = requireSelectedRows(rows, itemName);
  if (!selected) return;
  const cols = translateColumns(normalizeColumns(selected, columns));
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

export function exportRowsToXlsx(rows, columns, filename = "export.xlsx", itemName = "row") {
  const selected = requireSelectedRows(rows, itemName);
  if (!selected) return;
  const cols = translateColumns(normalizeColumns(selected, columns));
  const tableRows = [
    cols.map((c) => c.label),
    ...selected.map((row) => cols.map((c) => (c.render ? c.render(row) : valueForKey(row, c.key)))),
  ];
  const sheetData = tableRows
    .map((row, rowIndex) => `<row r="${rowIndex + 1}">${row
      .map((value, colIndex) => {
        const cell = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
        return `<c r="${cell}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
      })
      .join("")}</row>`)
    .join("");
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`;
  const blob = makeZip([
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>` },
    { name: "xl/worksheets/sheet1.xml", content: sheet },
  ]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`${selected.length} ${itemName}(s) exported successfully.`);
}

export function printRows(rows, columns, title = "Selected Records", itemName = "row") {
  const selected = requireSelectedRows(rows, itemName);
  if (!selected) return;
  const cols = translateColumns(normalizeColumns(selected, columns));
  const translatedTitle = translateStaticText(title);
  const htmlRows = selected.map((row) => `
    <tr>${cols.map((c) => `<td>${String(c.render ? c.render(row) : valueForKey(row, c.key)).replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>`).join("")}</tr>`).join("");
  const html = `<!doctype html><html><head><title>${translatedTitle}</title><style>
    body{font-family:Arial,sans-serif;padding:24px;color:#0f172a} h1{font-size:20px;margin-bottom:16px}
    table{border-collapse:collapse;width:100%;font-size:12px} th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;vertical-align:top} th{background:#f8fafc}
  </style></head><body><h1>${translatedTitle}</h1><table><thead><tr>${cols.map((c) => `<th>${c.label}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table></body></html>`;
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
