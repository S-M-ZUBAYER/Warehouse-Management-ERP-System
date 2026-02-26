import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useDashboardData — provides all data for the dashboard page
// Replace mock data with real API calls when backend is ready
// ─────────────────────────────────────────────────────────────────────────────

export function useDashboardData() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 600);
        return () => clearTimeout(timer);
    }, []);

    // ── Overview KPI cards ────────────────────────────────────────────────────
    const kpiCards = [
        {
            id: "total_products",
            label: "Total Products",
            value: "14,525",
            icon: "package",
            color: "#3B82F6",
            bg: "#EFF6FF",
        },
        {
            id: "total_stock",
            label: "Total Stock Unit",
            value: "154,536",
            icon: "boxes",
            color: "#22C55E",
            bg: "#F0FDF4",
        },
        {
            id: "low_stock",
            label: "Low Stock",
            value: "500",
            icon: "alert",
            color: "#F59E0B",
            bg: "#FFFBEB",
        },
        {
            id: "out_of_stock",
            label: "Out of Stock",
            value: "100",
            icon: "x-circle",
            color: "#EF4444",
            bg: "#FEF2F2",
        },
    ];

    // ── Inventory Status chart data (line chart) ──────────────────────────────
    const inventoryData = [
        { month: "Oct 23", stockIn: 80000, stockOut: 60000 },
        { month: "Jan 24", stockIn: 100000, stockOut: 75000 },
        { month: "Feb 24", stockIn: 120000, stockOut: 95000 },
        { month: "Mar 24", stockIn: 115000, stockOut: 110000 },
        { month: "Apr 24", stockIn: 130000, stockOut: 105000 },
        { month: "May 24", stockIn: 145000, stockOut: 115000 },
        { month: "Jun 24", stockIn: 160000, stockOut: 125000 },
        { month: "Jul 24", stockIn: 175000, stockOut: 140000 },
    ];

    // ── Order Status chart data (donut chart) ─────────────────────────────────
    const orderStatusData = [
        { name: "Pending Orders", value: 220, color: "#F59E0B" },
        { name: "Processing Orders", value: 180, color: "#3B82F6" },
        { name: "Shipped Orders", value: 310, color: "#8B5CF6" },
        { name: "Completed Orders", value: 420, color: "#22C55E" },
        { name: "Cancelled Orders", value: 80, color: "#EF4444" },
    ];

    // ── Sales Trends chart data (area chart) ──────────────────────────────────
    const salesTrendsData = [
        { date: "Feb 23", sales: 120 },
        { date: "Mar 23", sales: 140 },
        { date: "Apr 23", sales: 110 },
        { date: "May 23", sales: 160 },
        { date: "Jun 23", sales: 130 },
        { date: "Jul 23", sales: 175 },
        { date: "Aug 23", sales: 145 },
        { date: "Sep 23", sales: 190 },
        { date: "Oct 23", sales: 220 },
        { date: "Nov 23", sales: 210 },
        { date: "Dec 23", sales: 280 },
        { date: "Jan 24", sales: 310 }, // peak
        { date: "Feb 24", sales: 240 },
        { date: "Mar 24", sales: 195 },
        { date: "Apr 24", sales: 230 },
        { date: "May 24", sales: 260 },
        { date: "Jun 24", sales: 245 },
        { date: "Jul 24", sales: 280 },
        { date: "Aug 24", sales: 300 },
        { date: "Sep 24", sales: 270 },
        { date: "Oct 24", sales: 290 },
    ];

    const platforms = ["All", "Amazon", "Shopify", "eBay", "WooCommerce"];

    return {
        loading,
        kpiCards,
        inventoryData,
        orderStatusData,
        salesTrendsData,
        platforms,
    };
}