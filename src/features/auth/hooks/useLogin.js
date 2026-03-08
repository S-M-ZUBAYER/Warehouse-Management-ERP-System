import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/lib/authApi";
import { useAuthStore } from "../../../stores/authStore";

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
            // authApi interceptor returns res.data directly so `res` = full response body
            const res = await authApi.post("/dev/user/signIn2", {
                userEmail: formData.email,
                userPassword: formData.password,
            });

            if (res.status === "success") {
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

                // Save to Zustand (also writes localStorage internally)
                login(formData.email, userData);

                navigate("/warehouse_management");
            } else {
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
            }
        } catch (err) {
            console.error("Login error:", err);
            const serverMsg = err.response?.data?.message;
            setPasswordError(serverMsg || "Network error. Please try again.");
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