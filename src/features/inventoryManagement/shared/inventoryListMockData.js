// ─────────────────────────────────────────────────────────────────────────────
// Mock data for Inventory List + Manual Inbound
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_INVENTORY = [
    { id: 1, skuName: "WM-012", warehouseName: "Tech Haven Warehouse", qty: 15, stockAlert: "In Stock", image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, skuName: "KB-045", warehouseName: "Green Valley Logistics", qty: 20, stockAlert: "In Stock", image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, skuName: "SSD-123", warehouseName: "Skyline Distribution Center", qty: 0, stockAlert: "Out of Stock", image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, skuName: "HP-678", warehouseName: "Ocean View Shipping", qty: 30, stockAlert: "In Stock", image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, skuName: "WC-234", warehouseName: "Mountain Peak Freight", qty: 35, stockAlert: "In Stock", image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, skuName: "SH-456", warehouseName: "Urban Express Couriers", qty: 40, stockAlert: "In Stock", image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, skuName: "BP-789", warehouseName: "Valley Forge Transport", qty: 9, stockAlert: "Low Stock", image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, skuName: "CP-321", warehouseName: "Riverbend Supply Chain", qty: 50, stockAlert: "In Stock", image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, skuName: "CC-987", warehouseName: "Summit Point Logistics", qty: 55, stockAlert: "In Stock", image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, skuName: "GR-222", warehouseName: "Pine Grove Warehousing", qty: 0, stockAlert: "Out of Stock", image: "https://placehold.co/36x36/212529/fff?text=G" },
];

export const MOCK_MANUAL_INBOUND = [
    { id: 1, inboundId: "WM-012", productName: "Ergonomic wireless mouse with 3k...", warehouseName: "Tech Haven Warehouse", image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, inboundId: "KB-045", productName: "Compact mechanical keyboard with...", warehouseName: "Green Valley Logistics", image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, inboundId: "SSD-123", productName: "Portable external SSD 1TB", warehouseName: "Skyline Distribution Center", image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, inboundId: "HP-678", productName: "Noise-cancelling over-ear headphones", warehouseName: "Ocean View Shipping", image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, inboundId: "WC-234", productName: "High-definition webcam 1080p", warehouseName: "Mountain Peak Freight", image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, inboundId: "SH-456", productName: "Smartphone holder with adjustable ..", warehouseName: "Urban Express Couriers", image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, inboundId: "BP-789", productName: "Ultra-slim laptop backpack", warehouseName: "Valley Forge Transport", image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, inboundId: "CP-321", productName: "Wireless charging pad for smartphones", warehouseName: "Riverbend Supply Chain", image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, inboundId: "CC-987", productName: "High-speed HDMI cable 6ft", warehouseName: "Summit Point Logistics", image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, inboundId: "GR-222", productName: "Smart home hub for automation", warehouseName: "Pine Grove Warehousing", image: "https://placehold.co/36x36/212529/fff?text=G" },
];

export const MOCK_MERCHANT_SKUS = [
    { id: 1, name: "Ergonomic wireless mouse with 3k...", sku: "WM-012", available: 125, image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, name: "Compact mechanical keyboard with...", sku: "KB-045", available: 200, image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, name: "Portable external SSD 1TB", sku: "SSD-123", available: 0, image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, name: "Noise-cancelling over-ear headphones", sku: "HP-678", available: 75, image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, name: "High-definition webcam 1080p", sku: "WC-234", available: 100, image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, name: "Smartphone holder with adjustable ..", sku: "SH-456", available: 300, image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, name: "Ultra-slim laptop backpack", sku: "BP-789", available: 10, image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, name: "Wireless charging pad for smartphones", sku: "CP-321", available: 180, image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, name: "High-speed HDMI cable 6ft", sku: "CC-987", available: 500, image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, name: "Smart home hub for automation", sku: "GR-222", available: 90, image: "https://placehold.co/36x36/212529/fff?text=G" },
];

export const WAREHOUSES = ["Warehouse name here", "Warehouse A", "Warehouse B", "Warehouse C"];
export const SKU_OPTS = ["SKU", "SKU Name", "Product Name", "Product ID", "Store ID"];
export const TIME_OPTS = ["All", "Yesterday", "Today", "Last 7 days", "Last 30 days"];
export const INBOUND_OPTS = ["Inbound No.", "SKU Name", "GTIN"];