import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/lib/authApi";
import { useAuthStore } from "../../../stores/authStore";
import api from "../../../lib/api";

// ─────────────────────────────────────────────────────────────────────────────
// useLogin — uses authApi (no token) + Zustand authStore
// ─────────────────────────────────────────────────────────────────────────────

export function useLogin() {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [forbiddenError, setForbiddenError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === "email") { setEmailError(""); setForbiddenError(""); }
        if (name === "password") setPasswordError("");
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setEmailError("");
        setPasswordError("");
        setForbiddenError("");

        try {
            // ── STEP 1: Existing login API ──────────────────────────────────────
            const res = await authApi.post("/dev/user/signIn2", {
                userEmail: formData.email,
                userPassword: formData.password,
            });

            if (res.status !== "success") {
                // Step 1 failed — show errors and stop
                const msg = res.message || "";
                if (msg.includes("email") || msg.includes("incorrect")) {
                    setEmailError("Incorrect email. Please try again.");
                } else if (msg.includes("password")) {
                    setPasswordError("Password did not match. Please try again.");
                } else if (msg.includes("verify")) {
                    setForbiddenError("Please verify your email before signing in.");
                } else {
                    setPasswordError(msg || "Login failed. Please try again.");
                }
                setFormData((prev) => ({ ...prev, password: "" }));
                return;
            }

            // Step 1 success — build userData from old API
            const userData = {
                id: res.data.userId,
                fullName: res.data.userName,
                email: res.data.userEmail,
                phoneNumber: res.data.phone || "",
                role: res.data.role || "user",
                image: res.data.photo || "",
                shopName: res.data.designation || "",
                region: res.data.country || "",
                status: res.data.status || "active",
            };

            // ── STEP 2: New login API ───────────────────────────────────────────
            let newApiRes = null;
            try {
                newApiRes = await api.post("/auth/login", {
                    email: formData.email,
                    password: formData.password,
                });
            } catch (newApiErr) {
                newApiRes = newApiErr.response?.data || null;
            }

            const newApiSuccess = newApiRes?.success === true || newApiRes?.data?.success === true;

            if (newApiSuccess) {
                // ── Step 2 succeeded — store tokens from new API ───────────────
                const { accessToken, refreshToken, user } =
                    newApiRes.data?.data || newApiRes.data || {};

                localStorage.setItem("whmAccessToken", accessToken);
                localStorage.setItem("whmRefreshToken", refreshToken);
                localStorage.setItem("warehouseUser", JSON.stringify(user));

            } else {
                // ── Step 2 failed — register via new API then store tokens ──────
                console.warn("New login API failed, attempting auto-register...");
                try {
                    const registerRes = await api.post("/auth/register", {
                        userName: res.data.userName,
                        userEmail: formData.email,
                        userPassword: formData.password,
                        companyName: res.data.designation || undefined,
                        phone: res.data.phone || undefined,
                        timezone: res.data.timezone || undefined,
                        currency: res.data.currency || undefined,
                        avatar: res.data.photo || undefined,
                    });

                    const regData = registerRes.data || registerRes;

                    if (regData?.success === true) {
                        const { accessToken, refreshToken, user } = regData.data || {};
                        localStorage.setItem("whmAccessToken", accessToken);
                        localStorage.setItem("whmRefreshToken", refreshToken);
                        localStorage.setItem("warehouseUser", JSON.stringify(user));
                    } else {
                        // Register also failed — clear new API keys, proceed with old login only
                        console.warn("Auto-register also failed:", regData?.message);
                        localStorage.removeItem("whmAccessToken");
                        localStorage.removeItem("whmRefreshToken");
                        localStorage.removeItem("warehouseUser");
                    }
                } catch (regErr) {
                    console.warn("Auto-register error:", regErr);
                    localStorage.removeItem("whmAccessToken");
                    localStorage.removeItem("whmRefreshToken");
                    localStorage.removeItem("warehouseUser");
                }
            }

            // ── STEP 3: Save old API user to Zustand + navigate ────────────────
            login(formData.email, userData);
            navigate("/warehouse_management");

        } catch (err) {
            console.error("Login error:", err);
            const serverMsg = err.response?.data?.message;
            if (serverMsg?.includes("email") || serverMsg?.includes("incorrect")) {
                setEmailError("Incorrect email. Please try again.");
            } else if (serverMsg?.includes("password")) {
                setPasswordError("Password did not match. Please try again.");
            } else {
                setPasswordError(serverMsg || "Network error. Please try again.");
            }
            setFormData((prev) => ({ ...prev, password: "" }));
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        showPassword,
        emailError,
        passwordError,
        forbiddenError,
        loading,
        handleChange,
        handleSubmit,
        togglePassword: () => setShowPassword((prev) => !prev),
    };
}