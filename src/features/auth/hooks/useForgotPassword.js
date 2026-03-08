import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/lib/authApi";


export function useForgotPassword() {
    const navigate = useNavigate();

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
                setForgotEmail("");
                setTimeout(() => navigate("/warehouse_management/forgotpassword"), 1500);
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
        setFormData((prev) => ({ ...prev, [name]: value }));
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

        setLoading(true);
        setCodeError("");
        setPasswordError("");
        setSuccess("");

        try {
            const res = await authApi.post(
                `/dev/user/reset-password?code=${encodeURIComponent(formData.code)}&newPassword=${encodeURIComponent(formData.newPassword)}`,
                "",   // empty body
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        Accept: "*/*",
                    },
                }
            );

            if (res.code === 200 && res.status === "success") {
                setSuccess(res.message || "Password reset successfully!");
                setFormData({ code: "", newPassword: "", confirmPass: "" });
                setTimeout(() => navigate("/warehouse_management/login"), 2000);
            } else {
                const msg = res.message || "";
                if (msg.toLowerCase().includes("code")) {
                    setCodeError(msg || "Invalid or expired code.");
                } else {
                    setPasswordError(msg || "Failed to reset password.");
                }
            }
        } catch (err) {
            console.error("Reset password error:", err);
            setPasswordError(
                err.response?.data?.message || "Network error. Please try again."
            );
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