// ─────────────────────────────────────────────────────────────────────────────
// Shared mock data for Inbound Draft + On The Way pages
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_INBOUND_LIST = [
    { id: 1, inboundId: "WM-012", warehouseName: "Tech Haven Warehouse", estimatedArrival: "01 Dec 2025  16:20", image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, inboundId: "KB-045", warehouseName: "Green Valley Logistics", estimatedArrival: "02 Dec 2025  17:30", image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, inboundId: "SSD-123", warehouseName: "Skyline Distribution Center", estimatedArrival: "03 Dec 2025  18:45", image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, inboundId: "HP-678", warehouseName: "Ocean View Shipping", estimatedArrival: "04 Dec 2025  19:00", image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, inboundId: "WC-234", warehouseName: "Mountain Peak Freight", estimatedArrival: "05 Dec 2025  20:15", image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, inboundId: "SH-456", warehouseName: "Urban Express Couriers", estimatedArrival: "06 Dec 2025  21:30", image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
    { id: 7, inboundId: "BP-789", warehouseName: "Valley Forge Transport", estimatedArrival: "07 Dec 2025  22:00", image: "https://placehold.co/36x36/3a3a3c/fff?text=B" },
    { id: 8, inboundId: "CP-321", warehouseName: "Riverbend Supply Chain", estimatedArrival: "08 Dec 2025  23:15", image: "https://placehold.co/36x36/004368/fff?text=C" },
    { id: 9, inboundId: "CC-987", warehouseName: "Summit Point Logistics", estimatedArrival: "09 Dec 2025  00:30", image: "https://placehold.co/36x36/1b4332/fff?text=H" },
    { id: 10, inboundId: "GR-222", warehouseName: "Pine Grove Warehousing", estimatedArrival: "10 Dec 2025  01:45", image: "https://placehold.co/36x36/212529/fff?text=G" },
];

// Used for Create Inbound (Draft detail page) - Image 3
export const MOCK_DRAFT_ITEMS = [
    { id: 1, image: "https://placehold.co/36x36/1a1a2e/fff?text=M", productName: "Ergonomic wireless mouse with 3k...", merchantSku: "WM-012", qty: 15 },
    { id: 2, image: "https://placehold.co/36x36/16213e/fff?text=K", productName: "Compact mechanical keyboard with...", merchantSku: "KB-045", qty: 20 },
    { id: 3, image: "https://placehold.co/36x36/0f3460/fff?text=S", productName: "Portable external SSD 1TB", merchantSku: "SSD-123", qty: 0 },
    { id: 4, image: "https://placehold.co/36x36/533483/fff?text=H", productName: "Noise-cancelling over-ear headphones", merchantSku: "HP-678", qty: 30 },
    { id: 5, image: "https://placehold.co/36x36/2b2d42/fff?text=W", productName: "High-definition webcam 1080p", merchantSku: "WC-234", qty: 35 },
    { id: 6, image: "https://placehold.co/36x36/8d99ae/004368?text=S", productName: "Smartphone holder with adjustable ..", merchantSku: "SH-456", qty: 40 },
    { id: 7, image: "https://placehold.co/36x36/3a3a3c/fff?text=B", productName: "Ultra-slim laptop backpack", merchantSku: "BP-789", qty: 9 },
    { id: 8, image: "https://placehold.co/36x36/004368/fff?text=C", productName: "Wireless charging pad for smartphones", merchantSku: "CP-321", qty: 50 },
    { id: 9, image: "https://placehold.co/36x36/1b4332/fff?text=H", productName: "High-speed HDMI cable 6ft", merchantSku: "CC-987", qty: 55 },
    { id: 10, image: "https://placehold.co/36x36/212529/fff?text=G", productName: "Smart home hub for automation", merchantSku: "GR-222", qty: 0 },
];

// Used for Select Merchant SKU modal (Image 4)
export const MOCK_MERCHANT_SKUS_MODAL = [
    { id: 1, name: "Ergonomic wireless mouse with 3k...", sku: "WM-012", available: 125, image: "https://placehold.co/36x36/1a1a2e/fff?text=M" },
    { id: 2, name: "Compact mechanical keyboard with...", sku: "KB-045", available: 200, image: "https://placehold.co/36x36/16213e/fff?text=K" },
    { id: 3, name: "Portable external SSD 1TB", sku: "SSD-123", available: 0, image: "https://placehold.co/36x36/0f3460/fff?text=S" },
    { id: 4, name: "Noise-cancelling over-ear headphones", sku: "HP-678", available: 75, image: "https://placehold.co/36x36/533483/fff?text=H" },
    { id: 5, name: "High-definition webcam 1080p", sku: "WC-234", available: 100, image: "https://placehold.co/36x36/2b2d42/fff?text=W" },
    { id: 6, name: "Smartphone holder with adjustable ..", sku: "SH-456", available: 300, image: "https://placehold.co/36x36/8d99ae/004368?text=S" },
];

export const WAREHOUSES = ["Warehouse name here", "Warehouse A", "Warehouse B", "Warehouse C"];
export const TIME_TYPES = ["Created Time", "Estimated arrival time"];
export const TIME_FILTERS = ["All", "Yesterday", "Today", "Last 7 days", "Last 30 days"];
export const INBOUND_TYPES = ["Inbound No.", "SKU Name", "GTIN"];