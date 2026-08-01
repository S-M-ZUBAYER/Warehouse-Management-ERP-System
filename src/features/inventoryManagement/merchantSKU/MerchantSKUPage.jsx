import { useRef, useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  Loader2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  UploadCloud,
  X,
} from "lucide-react";
import Topbar from "../../../components/layout/Topbar";
import InvFooter from "../shared/components/InvFooter";
import AddMerchantSKUModal from "./AddMerchantSKUModal";
import { useProductList } from "../../productManagement/hooks/useProductList";
import { ConfirmModal } from "../../productManagement/productList/component/ProductModals";
import { useEditSKU } from "./hooks/useMerchantSKUEdit";
import EditMerchantSKUModal from "./EditMerchantSKUModal";
import PortalActionMenu from "../../../components/shared/PortalActionMenu";
import RecordDetailModal from "../../../components/shared/RecordDetailModal";
import { exportRowsToCsv, exportRowsToXlsx, printRows } from "../../../utils/tableOutput";
import ExportMenu from "../../../components/shared/ExportMenu";

const MERCHANT_SKU_SEARCH_FIELDS = [
  { label: "SKU Name", value: "sku_name" },
  { label: "SKU Title", value: "sku_title" },
  { label: "GTIN", value: "gtin" },
];

const merchantSkuTemplateColumns = [
  { label: "skuName", key: "skuName" },
  { label: "skuTitle", key: "skuTitle" },
  { label: "productDetails", key: "productDetails" },
  { label: "gtin", key: "gtin" },
  { label: "imageUrl", key: "imageUrl" },
  { label: "price", key: "price" },
  { label: "costPrice", key: "costPrice" },
  { label: "country", key: "country" },
  { label: "weight", key: "weight" },
  { label: "length", key: "length" },
  { label: "width", key: "width" },
  { label: "height", key: "height" },
];

const merchantSkuTemplateRows = [
  {
    skuName: "SKU-001",
    skuTitle: "Example Product",
    productDetails: "Product details here",
    gtin: "GTIN-00001",
    imageUrl: "https://example.com/product-image.jpg",
    price: "100",
    costPrice: "60",
    country: "Malaysia",
    weight: "1.5",
    length: "10",
    width: "8",
    height: "5",
  },
];

const parseProductDetails = (row) => {
  const value = row?.product_details ?? row?.productDetails;
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};

  const trimmed = value.trim();
  if (!trimmed || !["{", "["].includes(trimmed[0])) return {};

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

const firstValue = (...values) =>
  values.find((value) => value !== null && value !== undefined && value !== "") ?? "-";

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

const detailField = (key, fallbackKey) => ({
  label: key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()),
  render: (row) => {
    const details = parseProductDetails(row);
    return firstValue(details[key], fallbackKey ? row?.[fallbackKey] : undefined, row?.[key]);
  },
});

const tableHeadings = [
  { label: "Image" },
  { label: "SKU Name" },
  { label: "SKU Title" },
  { label: "Weight", className: "w-16 whitespace-nowrap" },
  { label: "Size", className: "w-28 whitespace-nowrap" },
  { label: "Creation Time", className: "w-24 whitespace-nowrap" },
  { label: "Update Time", className: "w-24 whitespace-nowrap" },
  { label: "Details", className: "w-16 min-w-[56px] whitespace-nowrap text-center" },
  { label: "Actions", className: "w-16 min-w-[56px] whitespace-nowrap text-center" },
];

export default function MerchantSKUPage() {
  const [skuType, setSkuType] = useState("sku_name");
  const [searchDraft, setSearchDraft] = useState("");
  const [openActionId, setOpenActionId] = useState(null);
  const [actionAnchor, setActionAnchor] = useState(null);
  const [showBulkDrop, setShowBulkDrop] = useState(false);
  const [detailSku, setDetailSku] = useState(null);
  const bulkRef = useRef(null);

  const {
    setSearch,
    setSearchField,
    products,
    pagination,
    page,
    setPage,
    listLoading,
    listFetching,
    isListError,
    listError,
    refetchList,
    selectedIds,
    selectedProducts,
    selectionLoading,
    toggleSelect,
    toggleAll,
    allSelected,
    someSelected,
    showAddModal,
    setShowAddModal,
    openDeleteModal,
    handleBulkAction,
    deleteTarget,
    showDeleteModal,
    setShowDeleteModal,
    confirmDelete,
    deleting,
    bulkDeleteConfirm,
    setBulkDeleteConfirm,
    confirmBulkDelete,
    bulkDeleting,
    form,
    errors,
    fileInputRef,
    handleFormChange,
    handlePhotoChange,
    handleWarehouseSelect,
    handleSave,
    handleCloseModal,
    saving,
    warehouseSearch,
    setWarehouseSearch,
    modalWarehouses,
    warehouseLoading,
    showImportModal,
    setShowImportModal,
    importFile,
    setImportFile,
    importWarehouseId,
    importWarehouseName,
    handleImportWarehouseSelect,
    resetImportTemplateState,
    confirmImportTemplate,
    importingTemplate,
  } = useProductList();

  const modalProps = {
    form,
    errors,
    fileInputRef,
    handleFormChange,
    handlePhotoChange,
    handleWarehouseSelect,
    handleSave,
    handleCloseModal,
    saving,
    warehouseSearch,
    setWarehouseSearch,
    modalWarehouses,
    warehouseLoading,
  };
  const edit = useEditSKU();
  const [confirmImportCancel, setConfirmImportCancel] = useState(false);

  
  const confirmCancelImport = () => {
    resetImportTemplateState();
    setConfirmImportCancel(false);
    setShowImportModal(false);
  };


  const handleSearch = () => {
    setPage(1);
    setSearchField(skuType);
    setSearch(searchDraft);
  };

  const handleDownloadTemplate = () => {
    exportRowsToXlsx(
      merchantSkuTemplateRows,
      merchantSkuTemplateColumns,
      "merchant-sku-import-template.xlsx",
      "template row"
    );
  };
  

  useEffect(() => {
    const handler = (e) => {
      if (openActionId !== null) {
        if (actionAnchor && !actionAnchor.contains(e.target)) {
          setOpenActionId(null);
          setActionAnchor(null);
        }
      }
      if (bulkRef.current && !bulkRef.current.contains(e.target))
        setShowBulkDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openActionId, actionAnchor]);

  const selectedRows = selectedProducts.length === selectedIds.length
    ? selectedProducts
    : products.filter((sku) => selectedIds.includes(sku.id));

  return (
    <div className="space-y-4 font-body">
      <Topbar PageTitle="Merchant SKU" />

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-surface-border p-7 flex items-center gap-3">
        <div className="relative">
          <select
            value={skuType}
            onChange={(e) => setSkuType(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-sm border border-surface-border
                       rounded-lg bg-white text-slate-600 outline-none focus:border-primary cursor-pointer w-28"
          >
            {MERCHANT_SKU_SEARCH_FIELDS.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-border rounded-lg
                       text-slate-700 placeholder-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="px-5 py-2 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
        >
          Search
        </button>
      </div>

      {/* SKU List card */}
      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="text-base font-bold text-slate-800 font-display">
            SKU List
          </h2>
          <div className="flex items-center gap-2">
            {/* Bulk Action */}
            <div className="relative" ref={bulkRef}>
              <button
                onClick={() => setShowBulkDrop((p) => !p)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border
                           border-surface-border rounded-lg text-slate-700 bg-white hover:bg-surface-card transition-colors"
              >
                Bulk Action <ChevronDown size={13} className="text-slate-400" />
              </button>
              {showBulkDrop && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-40">
                  <button
                    onClick={() => {
                      handleBulkAction("delete");
                      setShowBulkDrop(false);
                    }}
                    disabled={selectedIds.length === 0}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => {
                      exportRowsToXlsx(selectedRows, [
                        { label: 'SKU', render: (row) => row.sku_name || row.skuName || '' },
                        { label: 'Product Name', render: (row) => row.sku_title || row.skuTitle || '' },
                        { label: 'Weight', key: 'weight' },
                        { label: 'Size', render: (row) => [row.length, row.width, row.height].filter(Boolean).join(' x ') },
                        { label: 'Created', render: (row) => row.created_at || row.createdAt || '' },
                      ], 'merchant-sku-list.xlsx', 'merchant SKU');
                      setShowBulkDrop(false);
                    }}
                    disabled={selectedIds.length === 0}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Export Selected
                  </button>
                </div>
              )}
            </div>

            <AddMerchantSkuMenu
              onAddSingle={() => setShowAddModal(true)}
              onImport={() => setShowImportModal(true)}
              onDownloadTemplate={handleDownloadTemplate}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative">
          {listFetching && !listLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden">
              <div className="h-full bg-primary animate-pulse w-1/3" />
            </div>
          )}
          <table className="w-full text-sm font-body">
            <thead className="[&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800">
              <tr className="border-b border-surface-border">
                <th className="py-3 pl-5 w-36 text-left">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    {selectionLoading ? (
                      <Loader2 size={16} className="text-primary animate-spin" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => toggleAll({ allPages: true })}
                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                      />
                    )}
                    <span className="pl-2 text-sm font-bold text-slate-800">
                      Select All
                    </span>
                  </label>
                </th>
                {tableHeadings.map((heading) => (
                  <th
                    key={heading.label}
                    className={`py-3 pr-4 text-left text-sm font-bold text-slate-800 ${heading.className || ""}`}
                  >
                    {heading.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {listLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="pl-5 py-3">
                      <div className="w-4 h-4 bg-slate-200 rounded" />
                    </td>
                    <td className="py-3 pr-4">
                      <div className="w-9 h-9 bg-slate-200 rounded-lg" />
                    </td>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-3 pr-4">
                        <div className="h-3 bg-slate-200 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isListError ? (
                <tr>
                  <td colSpan={11} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle size={36} className="text-red-400 opacity-70" />
                      <p className="text-sm font-medium text-slate-700">
                        {listError?.response?.data?.message ?? listError?.message ?? "Failed to load SKUs"}
                      </p>
                      <button
                        type="button"
                        onClick={refetchList}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <RefreshCw size={12} /> Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="py-16 text-center text-slate-400 text-sm"
                  >
                    No SKUs found
                  </td>
                </tr>
              ) : (
                products.map((sku) => (
                  <tr
                    key={sku.id}
                    className={`hover:bg-surface/50 transition-colors ${
                      selectedIds.includes(sku.id) ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <td className="pl-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sku.id)}
                        onChange={() => toggleSelect(sku.id)}
                        className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <img
                        src={sku.image_url || sku.image}
                        alt={sku.sku_name || sku.skuName}
                        className="w-9 h-9 rounded-lg object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/36x36/E6ECF0/004368?text=?";
                        }}
                      />
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {sku.sku_name || sku.skuName}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {sku.sku_title || sku.skuTitle}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {sku.weight ? `${sku.weight} kg` : "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 font-mono text-xs">
                      {sku.length && sku.width && sku.height
                        ? `${sku.length}×${sku.width}×${sku.height}`
                        : sku.size || "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">
                      {formatDateTime(sku.created_at || sku.createdAt)}
                    </td>
                    <td className="py-3 pr-4 text-slate-500 text-xs">
                      {formatDateTime(sku.updated_at || sku.updatedAt)}
                    </td>
                    <td className="py-3 pr-4 w-16 min-w-[56px] text-center whitespace-nowrap">
                      <button onClick={() => setDetailSku(sku)} className="text-xs font-semibold text-primary hover:underline whitespace-nowrap">
                        Details
                      </button>
                    </td>
                    <td className="py-3 pr-5 w-16 min-w-[56px] text-center whitespace-nowrap">
                      <div
                        className="relative flex justify-center"
                      >
                        <button
                          onClick={(e) => {
                            if (openActionId === sku.id) {
                              setOpenActionId(null);
                              setActionAnchor(null);
                              return;
                            }
                            setOpenActionId(sku.id);
                            setActionAnchor(e.currentTarget);
                          }}
                          className="flex items-center gap-0.5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-surface-card transition-colors"
                        >
                          {[1, 2, 3].map((d) => (
                            <span
                              key={d}
                              className="w-1 h-1 rounded-full bg-current mx-px"
                            />
                          ))}
                        </button>
                        <PortalActionMenu
                          open={openActionId === sku.id}
                          anchorRef={{ current: actionAnchor }}
                          onClose={() => {
                            setOpenActionId(null);
                            setActionAnchor(null);
                          }}
                          width={112}
                        >
                          <button
                            onClick={() => {
                              setOpenActionId(null);
                              edit.setShowEditModal(true);
                              edit?.setEditingSku(sku);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-surface-card transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setOpenActionId(null);
                              openDeleteModal(sku);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </PortalActionMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Updated Pagination - matching ProductListPage style */}
        {!listLoading && pagination?.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-surface-border">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * (pagination.limit || 10) + 1}–
              {Math.min(page * (pagination.limit || 10), pagination.total || 0)}{" "}
              of {pagination.total || 0} SKUs
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const totalPages = pagination.totalPages || 1;
                  const visibleCount = Math.min(5, totalPages);
                  const startPage = Math.min(
                    Math.max(1, page - Math.floor(visibleCount / 2)),
                    Math.max(1, totalPages - visibleCount + 1),
                  );
                  const p = startPage + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-xs rounded-lg border transition-colors
                        ${
                          page === p
                            ? "bg-primary text-white border-primary"
                            : "border-surface-border text-slate-600 hover:bg-surface-card"
                        }`}
                    >
                      {p}
                    </button>
                  );
                },
              )}
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 text-xs border border-surface-border rounded-lg text-slate-600 hover:bg-surface-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-surface-border">
          <ExportMenu
            onExportCsv={() => exportRowsToCsv(selectedRows, [
              { label: 'SKU', render: (row) => row.sku_name || row.skuName || '' },
              { label: 'Product Name', render: (row) => row.sku_title || row.skuTitle || '' },
              { label: 'Weight', key: 'weight' },
              { label: 'Size', render: (row) => [row.length, row.width, row.height].filter(Boolean).join(' x ') },
              { label: 'Created', render: (row) => row.created_at || row.createdAt || '' },
            ], 'merchant-sku-list.csv', 'merchant SKU')}
            onExportXlsx={() => exportRowsToXlsx(selectedRows, [
              { label: 'SKU', render: (row) => row.sku_name || row.skuName || '' },
              { label: 'Product Name', render: (row) => row.sku_title || row.skuTitle || '' },
              { label: 'Weight', key: 'weight' },
              { label: 'Size', render: (row) => [row.length, row.width, row.height].filter(Boolean).join(' x ') },
              { label: 'Created', render: (row) => row.created_at || row.createdAt || '' },
            ], 'merchant-sku-list.xlsx', 'merchant SKU')}
          />
          <button onClick={() => printRows(selectedRows, [
            { label: 'SKU', render: (row) => row.sku_name || row.skuName || '' },
            { label: 'Product Name', render: (row) => row.sku_title || row.skuTitle || '' },
            { label: 'Weight', key: 'weight' },
            { label: 'Size', render: (row) => [row.length, row.width, row.height].filter(Boolean).join(' x ') },
            { label: 'Created', render: (row) => row.created_at || row.createdAt || '' },
          ], 'Selected Merchant SKUs', 'merchant SKU')} className="px-16 py-2.5 text-base font-semibold rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors">
            Print
          </button>
        </div>
      </div>

      <RecordDetailModal
        open={!!detailSku}
        title="Merchant SKU Details"
        subtitle={detailSku?.sku_name || detailSku?.skuName}
        record={detailSku}
        onClose={() => setDetailSku(null)}
        fields={[
          { label: 'Merchant SKU ID', render: (row) => firstValue(row.id) },
          { label: 'SKU', render: (row) => row.sku_name || row.skuName || '—' },
          { label: 'Product Name', render: (row) => row.sku_title || row.skuTitle || '—' },
          { label: 'Details', render: (row) => firstValue(row.product_details, row.productDetails), fullWidth: true },
          { label: 'GTIN', key: 'gtin' },
          { label: 'Weight', key: 'weight' },
          { label: 'Price', key: 'price' },
          { label: 'Status', key: 'status' },
          { label: 'Cost Price', render: (row) => firstValue(row.cost_price, row.costPrice) },
          { label: 'Length', render: (row) => firstValue(row.length) },
          { label: 'Width', render: (row) => firstValue(row.width) },
          { label: 'Height', render: (row) => firstValue(row.height) },
          { label: 'Warehouse', render: (row) => firstValue(row.warehouse?.name, row.warehouse_name, row.warehouseName) },
          { label: 'Warehouse ID', render: (row) => firstValue(row.warehouse_id, row.warehouseId) },
          { label: 'Country', render: (row) => firstValue(row.country) },
          detailField('source'),
          detailField('platform'),
          detailField('platform_store_id'),
          detailField('platform_product_id'),
          detailField('platform_sku_id'),
          detailField('seller_sku'),
          detailField('variant_name'),
          { label: 'Created', render: (row) => row.created_at || row.createdAt || '—' },
          { label: 'Updated', render: (row) => row.updated_at || row.updatedAt || '—' },
        ]}
      />

      {/* Single Delete Confirm */}
      {showDeleteModal && deleteTarget && (
        <ConfirmModal
          title="Delete Product"
          message={
            <>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-800">
                {deleteTarget.sku_title}
              </span>{" "}
              ({deleteTarget.sku_name})?
              <br />
              <span className="text-red-500 text-xs mt-1 block">
                This action cannot be undone.
              </span>
            </>
          }
          confirmLabel={deleting ? "Deleting..." : "Delete"}
          confirmClass="bg-red-500 hover:bg-red-600 text-white"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={confirmDelete}
          loading={deleting}
        />
      )}

      {/* Bulk Delete Confirm */}
      {bulkDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(200,210,220,0.55)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-sm">
            <h3 className="text-base font-bold text-slate-800 mb-2">
              Delete Selected SKUs?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently delete{" "}
              <span className="font-semibold text-red-500">
                {selectedIds.length}
              </span>{" "}
              selected SKU(s).
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="px-5 py-2 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 hover:bg-surface-card transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
                className="px-5 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-60"
              >
                {bulkDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && <AddMerchantSKUModal {...modalProps} />}

      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(200,210,220,0.55)", backdropFilter: "blur(3px)" }}
          onClick={(e) => e.target === e.currentTarget && !importingTemplate && setShowImportModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md font-body overflow-hidden">
            <div className="flex items-start justify-between px-7 pt-7 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 font-display">
                  Add SKU via Template
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload the completed Merchant SKU XLSX template with imageUrl.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                disabled={importingTemplate}
                className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-7 pb-7">
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Warehouse
                </label>
                <select
                  value={importWarehouseId}
                  onChange={(e) => {
                    const selected = modalWarehouses.find((warehouse) => String(warehouse.id) === e.target.value);
                    if (selected) handleImportWarehouseSelect(selected);
                  }}
                  disabled={importingTemplate || warehouseLoading}
                  className="w-full px-3.5 py-2.5 text-sm border border-surface-border rounded-xl bg-white
                             text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60"
                >
                  <option value="">
                    {warehouseLoading ? "Loading warehouses..." : importWarehouseName}
                  </option>
                  {modalWarehouses.map((warehouse) => (
                    <option key={warehouse.id} value={String(warehouse.id)}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-surface-border rounded-xl py-8 cursor-pointer hover:border-primary/40 transition-colors bg-surface">
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  disabled={importingTemplate}
                />
                {importFile ? (
                  <FileSpreadsheet size={30} className="text-primary mb-2" />
                ) : (
                  <UploadCloud size={30} className="text-slate-400 mb-2" />
                )}
                <p className="text-sm font-semibold text-slate-700">
                  {importFile ? (
                    <span className="text-primary">{importFile.name}</span>
                  ) : (
                    "Choose XLSX file"
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Use the downloaded template format.
                </p>
                <span className="mt-3 px-5 py-1.5 text-xs font-semibold border border-surface-border rounded-lg text-slate-700 bg-white">
                  {importFile ? "Change File" : "Browse File"}
                </span>
              </label>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Download template again
              </button>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setConfirmImportCancel(true)}
                  disabled={importingTemplate}
                  className="px-5 py-2.5 text-sm font-semibold border border-surface-border rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmImportTemplate}
                  disabled={importingTemplate}
                  className="px-5 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {importingTemplate && <Loader2 size={14} className="animate-spin" />}
                  {importingTemplate ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmImportCancel && (
        <ConfirmModal
          title="Cancel Template Import?"
          message="Are you sure you want to cancel this upload? The selected file will be cleared."
          confirmLabel="Yes, Cancel"
          confirmClass="bg-red-500 hover:bg-red-600 text-white"
          onCancel={() => setConfirmImportCancel(false)}
          onConfirm={confirmCancelImport}
        />
      )}

      {/* Edit Modal */}
      {edit.showEditModal && (
        <EditMerchantSKUModal
          sku={edit.editingSku}
          onClose={edit.closeEditModal}
          onSave={edit.handleUpdateSKU}
          saving={edit.editSaving}
          warehouses={edit.editModalWarehouses}
          warehouseLoading={edit.warehouseLoading}
        />
      )}
    </div>
  );
}

function AddMerchantSkuMenu({ onAddSingle, onImport, onDownloadTemplate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const runAction = (handler) => {
    setOpen(false);
    handler?.();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold
                   bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
      >
        Add Merchant SKU
        <ChevronDown size={13} className={`text-white/70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl border border-surface-border shadow-lg py-1 w-56">
          <button
            type="button"
            onClick={() => runAction(onAddSingle)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
          >
            Add Single SKU
          </button>
          <button
            type="button"
            onClick={() => runAction(onImport)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
          >
            Add SKU via Template
          </button>
          <button
            type="button"
            onClick={() => runAction(onDownloadTemplate)}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-surface-card transition-colors"
          >
            Download Template
          </button>
        </div>
      )}
    </div>
  );
}
