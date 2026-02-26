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
    baseURL: "https://grozziieget.zjweiting.com:3091/CustomerService-Chat/api",
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