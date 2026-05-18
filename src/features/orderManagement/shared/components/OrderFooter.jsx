import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { exportRowsToCsv, printRows } from "../../../../utils/tableOutput";

// ─────────────────────────────────────────────────────────────────────────────
// OrderFooter — Export dropdown + Print button matching all Figma order pages
// ─────────────────────────────────────────────────────────────────────────────

const defaultColumns = [
  { label: "Package No.", key: "pkgNo" },
  { label: "SKU", key: "sku" },
  { label: "Order Number", key: "orderNo" },
  { label: "Tracking Number", key: "trackingNo" },
  { label: "Price", key: "price" },
  { label: "Create Time", key: "createdAt" },
  { label: "Status", key: "status" },
];

const xmlEscape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const getCellValue = (row, key) => {
  const value = key.split(".").reduce((acc, part) => acc?.[part], row);
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const columnName = (index) => {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const mod = (value - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    value = Math.floor((value - mod) / 26);
  }
  return name;
};

const buildWorksheetXml = (rows, columns) => {
  const headerCells = columns
    .map((column, index) => {
      const ref = `${columnName(index)}1`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(column.label)}</t></is></c>`;
    })
    .join("");

  const dataRows = rows
    .map((row, rowIndex) => {
      const excelRowNumber = rowIndex + 2;
      const cells = columns
        .map((column, columnIndex) => {
          const ref = `${columnName(columnIndex)}${excelRowNumber}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(getCellValue(row, column.key))}</t></is></c>`;
        })
        .join("");
      return `<row r="${excelRowNumber}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>
    <row r="1">${headerCells}</row>
    ${dataRows}
  </sheetData>
</worksheet>`;
};

const makeCrcTable = () => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
};

const CRC_TABLE = makeCrcTable();

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const textEncoder = new TextEncoder();
const encode = (value) => textEncoder.encode(value);

const uint16 = (value) => {
  const bytes = new Uint8Array(2);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, value, true);
  return bytes;
};

const uint32 = (value) => {
  const bytes = new Uint8Array(4);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, value >>> 0, true);
  return bytes;
};

const concatBytes = (chunks) => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
};

const createZip = (files) => {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  files.forEach(({ name, content }) => {
    const nameBytes = encode(name);
    const dataBytes = encode(content);
    const crc = crc32(dataBytes);

    const localHeader = concatBytes([
      uint32(0x04034b50),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(dataBytes.length),
      uint32(dataBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      nameBytes,
    ]);

    localChunks.push(localHeader, dataBytes);

    const centralHeader = concatBytes([
      uint32(0x02014b50),
      uint16(20),
      uint16(20),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(crc),
      uint32(dataBytes.length),
      uint32(dataBytes.length),
      uint16(nameBytes.length),
      uint16(0),
      uint16(0),
      uint16(0),
      uint16(0),
      uint32(0),
      uint32(offset),
      nameBytes,
    ]);

    centralChunks.push(centralHeader);
    offset += localHeader.length + dataBytes.length;
  });

  const localData = concatBytes(localChunks);
  const centralData = concatBytes(centralChunks);
  const endRecord = concatBytes([
    uint32(0x06054b50),
    uint16(0),
    uint16(0),
    uint16(files.length),
    uint16(files.length),
    uint32(centralData.length),
    uint32(localData.length),
    uint16(0),
  ]);

  return concatBytes([localData, centralData, endRecord]);
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const exportRowsToXlsx = (rows, columns, filename = "orders.xlsx") => {
  const worksheet = buildWorksheetXml(rows, columns);
  const workbookFiles = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Orders" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`,
    },
    { name: "xl/worksheets/sheet1.xml", content: worksheet },
  ];

  const bytes = createZip(workbookFiles);
  downloadBlob(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename
  );
};

export default function OrderFooter({
  selectedRows = [],
  columns,
  title = "Selected Orders",
  onPrint,
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const outputColumns = columns || defaultColumns;

  useEffect(() => {
    const handler = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setExportOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCsvExport = () => {
    setExportOpen(false);
    exportRowsToCsv(selectedRows, outputColumns, "orders.csv", "order");
  };

  const handleXlsxExport = () => {
    setExportOpen(false);
    exportRowsToXlsx(selectedRows, outputColumns, "orders.xlsx");
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint(selectedRows, outputColumns);
      return;
    }

    printRows(selectedRows, outputColumns, title, "order");
  };

  return (
    <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
      <div className="relative" ref={exportRef}>
        <button
          type="button"
          onClick={() => setExportOpen((open) => !open)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold
                     border border-surface-border rounded-lg text-slate-700 bg-white
                     hover:bg-surface-card transition-colors font-body"
        >
          Export
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform ${exportOpen ? "rotate-180" : ""}`}
          />
        </button>

        {exportOpen && (
          <div className="absolute bottom-full right-0 z-30 mb-1 w-40 overflow-hidden rounded-xl border border-surface-border bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={handleXlsxExport}
              className="block w-full px-4 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-surface-card"
            >
              Export XLSX
            </button>
            <button
              type="button"
              onClick={handleCsvExport}
              className="block w-full px-4 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-surface-card"
            >
              Export CSV
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-primary
                   hover:bg-primary-dark text-white transition-colors font-body"
      >
        Print
      </button>
    </div>
  );
}
