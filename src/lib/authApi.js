import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// Endpoints using this:
//   POST  /dev/user/signIn2              → login
//   POST  /v1/user/signup                → register
//   POST  /dev/user/forgot-password      → send reset email
//   POST  /dev/user/reset-password       → reset with code
//   GET   /v1/user/verify                → verify email
// ─────────────────────────────────────────────────────────────────────────────

const authApi = axios.create({
    baseURL: import.meta.env.VITE_AUTH_BASE_LOGIN_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// ── Response interceptor: just unwrap data, no token logic ───────────────
authApi.interceptors.response.use(
    (response) => response.data,   // always returns res.data directly
    (error) => Promise.reject(error)
);

export default authApi;