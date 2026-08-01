import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/lib/authApi";
import { useAuthStore } from "../../../stores/authStore";
import api from "../../../lib/api";

const loginNewApi = async (email, password) => {
    return api.post("/auth/login", { email, password });
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getAuthData = (response) => {
    const body = response?.data?.success !== undefined ? response.data : response;
    return body?.data || body || {};
};

const hasAuthSuccess = (response) => {
    const body = response?.data?.success !== undefined ? response.data : response;
    return body?.success === true || Boolean(getAuthData(response).accessToken);
};

const storeNewApiAuth = (authData) => {
    const { accessToken, refreshToken, user } = authData || {};

    if (!accessToken) {
        throw new Error("Auth token was not returned.");
    }

    localStorage.setItem("whmAccessToken", accessToken);
    localStorage.setItem("whmRefreshToken", refreshToken || "");
    localStorage.setItem("warehouseUser", JSON.stringify(user));
};

const getSafeRegistrationName = (email) => {
    const fallback = String(email || "").split("@")[0] || "user";
    return fallback.replace(/[^a-zA-Z0-9]/g, "") || "user";
};

const resolveUserWithPermissions = async (user) => {
    if (!user?.id) return user;

    try {
        const detailRes = await api.get(`/users/${user.id}`);
        const detailUser = detailRes?.data || detailRes;
        return detailUser && typeof detailUser === "object"
            ? { ...user, ...detailUser }
            : user;
    } catch (err) {
        console.warn("Failed to load full user permissions:", err);
        return user;
    }
};

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
            const registrationName = getSafeRegistrationName(formData.email);

            // ── STEP 2: New login API ───────────────────────────────────────────
            let newApiRes = null;
            try {
                newApiRes = await loginNewApi(formData.email, formData.password);
            } catch (newApiErr) {
                newApiRes = newApiErr.response?.data || null;
            }

            const newApiSuccess = hasAuthSuccess(newApiRes);

            if (newApiSuccess) {
                // ── Step 2 succeeded — store tokens from new API ───────────────
                const authData = getAuthData(newApiRes);
                const resolvedUser = await resolveUserWithPermissions(authData.user);
                storeNewApiAuth({ ...authData, user: resolvedUser });

            } else {
                // ── Step 2 failed — register via new API then store tokens ──────
                console.warn("New login API failed, attempting auto-register...");
            
                try {
                    const autoRegisterPayload = {
                        userName: registrationName,
                        userEmail: formData.email,
                        userPassword: formData.password,
                    };

                    const registerRes = await api.post("/auth/register", autoRegisterPayload);

                    const regData = registerRes;

                    if (hasAuthSuccess(regData)) {
                        let authData = getAuthData(regData);

                        if (!authData.accessToken) {
                            const loginAfterRegisterRes = await loginNewApi(formData.email, formData.password);
                            authData = getAuthData(loginAfterRegisterRes);
                        }

                        if (!authData.accessToken) {
                            throw new Error("Auto-register succeeded but login token was not returned.");
                        }

                        storeNewApiAuth(authData);
                    } else {
                        // Register also failed — clear new API keys, proceed with old login only
                        console.warn("Auto-register also failed:", regData?.message);
                        localStorage.removeItem("whmAccessToken");
                        localStorage.removeItem("whmRefreshToken");
                        localStorage.removeItem("warehouseUser");
                    }
                } catch (regErr) {
                    console.warn("Auto-register error:", regErr.response?.data || regErr);
                    try {
                        if (!regErr.response) {
                            await wait(800);
                        }

                        const loginAfterRegisterRes = await loginNewApi(formData.email, formData.password);
                        const loginAfterRegisterData = getAuthData(loginAfterRegisterRes);

                        if (!loginAfterRegisterData.accessToken) {
                            throw new Error("Login token was not returned after register error.");
                        }

                        storeNewApiAuth(loginAfterRegisterData);
                    } catch (loginAfterRegisterErr) {
                        console.warn(
                            "Login after auto-register error:",
                            loginAfterRegisterErr.response?.data || loginAfterRegisterErr
                        );
                        localStorage.removeItem("whmAccessToken");
                        localStorage.removeItem("whmRefreshToken");
                        localStorage.removeItem("warehouseUser");
                    }
                }
            }

            // ── STEP 3: Save old API user to Zustand + navigate ────────────────
            login(userData, localStorage.getItem("whmAccessToken"));
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
