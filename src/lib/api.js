import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// BASE API — for protected routes (dashboard, inventory, orders, etc.)
// Automatically attaches token from authStore if available
// ─────────────────────────────────────────────────────────────────────────────
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://grozziieget.zjweiting.com:3091/CustomerService-Chat/api",
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// ── Request interceptor: attach token only when it exists ─────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: unwrap data, handle 401 ────────────────────────
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const status = error.response?.status;

        if (status === 401) {
            // Token expired — clear storage and redirect
            localStorage.removeItem("token");
            localStorage.removeItem("warehouseUser");
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default api;