import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authApi from "@/lib/authApi";
import api from "@/lib/api";


export function useForgotPassword() {
    const navigate = useNavigate();
    const location = useLocation();

    // ── Send email state ───────────────────────────────────────────────────────
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    // ── Reset with code state ──────────────────────────────────────────────────
    const [formData, setFormData] = useState({
        code: "", newPassword: "", confirmPass: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [codeError, setCodeError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [matchError, setMatchError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    // ── Action 1: Send reset email ─────────────────────────────────────────────
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotLoading(true);
        setForgotError("");
        setForgotSuccess("");

        try {
            // API uses query param + empty body + url-encoded content type
            const res = await authApi.post(
                `/dev/user/forgot-password?email=${encodeURIComponent(forgotEmail)}`,
                "",   // empty body as per API spec
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Accept: "*/*",
                    },
                }
            );

            if (res.code === 200 && res.status === "success") {
                setForgotSuccess(res.message || "Reset email sent! Check your inbox.");
                sessionStorage.setItem("forgotPasswordEmail", forgotEmail);
                const resetEmail = forgotEmail;
                setForgotEmail("");
                setTimeout(() => navigate("/warehouse_management/forgotpassword", {
                    state: { email: resetEmail },
                }), 1500);
            } else {
                setForgotError(res.message || "Email not found. Please try another.");
            }
        } catch (err) {
            console.error("Forgot password error:", err);
            setForgotError(
                err.response?.data?.message || "Network error. Please try again."
            );
        } finally {
            setForgotLoading(false);
        }
    };

    // ── Action 2: Reset password with code ────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        const nextValue = name === "code"
            ? value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
            : value;

        setFormData((prev) => ({ ...prev, [name]: nextValue }));
        if (name === "code") setCodeError("");
        if (name === "newPassword" || name === "confirmPass") {
            setPasswordError("");
            setMatchError("");
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPass) {
            setMatchError("Passwords do not match.");
            return;
        }

        const resetEmail = location.state?.email || sessionStorage.getItem("forgotPasswordEmail");

        if (!resetEmail) {
            setPasswordError("Please request a reset code again before updating your password.");
            return;
        }

        setLoading(true);
        setCodeError("");
        setPasswordError("");
        setSuccess("");

        try {
            const resetRes = await authApi.post(
                `/dev/user/reset-password?code=${encodeURIComponent(formData.code)}&newPassword=${encodeURIComponent(formData.newPassword)}`,
                "",
                {
                    headers: {
                        Accept: "*/*",
                    },
                }
            );

            const resetSuccess = resetRes?.status === "success" || resetRes?.code === 200;

            if (!resetSuccess) {
                const message = resetRes?.message || "Invalid or expired verification code.";
                setCodeError(message);
                return;
            }

            const res = await api.put(
                "/auth/password",
                {
                    email: resetEmail,
                    newPassword: formData.newPassword,
                },
                {
                    headers: {
                        Accept: "*/*",
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res?.success) {
                setSuccess(res.message || "Password updated successfully!");
                setFormData({ code: "", newPassword: "", confirmPass: "" });
                sessionStorage.removeItem("forgotPasswordEmail");
                setTimeout(() => navigate("/warehouse_management/login"), 2000);
            } else {
                setPasswordError(res?.message || "Failed to update password.");
            }
        } catch (err) {
            console.error("Reset password error:", err);
            const status = err.response?.status;
            const message = err.response?.data?.message || "Network error. Please try again.";

            if (status === 404) {
                setCodeError("Invalid or expired verification code.");
            } else {
                setPasswordError(message);
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        // Send email (used in Login modal)
        forgotEmail,
        setForgotEmail,
        forgotError,
        forgotSuccess,
        forgotLoading,
        handleForgotSubmit,

        // Reset with code (used in ForgotPassword page)
        formData,
        handleChange,
        showPassword,
        showConfirm,
        togglePassword: () => setShowPassword((prev) => !prev),
        toggleConfirm: () => setShowConfirm((prev) => !prev),
        codeError,
        passwordError,
        matchError,
        success,
        loading,
        handleResetSubmit,
    };
}
