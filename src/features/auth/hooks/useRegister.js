import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/lib/authApi";
import api from "../../../lib/api";

const PENDING_SECONDARY_REGISTER_KEY = "pendingSecondaryRegister";

const getStoredSecondaryPayload = () => {
    try {
        const stored = sessionStorage.getItem(PENDING_SECONDARY_REGISTER_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        sessionStorage.removeItem(PENDING_SECONDARY_REGISTER_KEY);
        return null;
    }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const registerSecondaryWithRetry = async (payload, maxAttempts = 3) => {
    let lastError;
    const normalizedPayload = normalizeSecondaryPayload(payload);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await api.post("/auth/register", normalizedPayload, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
        } catch (err) {
            lastError = err;

            if (attempt < maxAttempts) {
                await wait(attempt * 1000);
            }
        }
    }

    throw lastError;
};

const normalizeSecondaryPayload = (payload) => ({
    userName: payload.userName || "",
    userEmail: payload.userEmail || "",
    userPassword: payload.userPassword || "",
    companyName: payload.companyName || "",
    phone: payload.phone || "",
    timezone: payload.timezone || "",
    currency: payload.currency || "",
    avatar: payload.avatar || "",
});

const isAlreadyRegisteredMessage = (message = "") =>
    message.toLowerCase().includes("already");

export function useRegister() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        userName: "",
        userEmail: "",
        userPassword: "",
        confirmPassword: "",
        photo: null,
    });

    const [previewUrl, setPreviewUrl] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordMatchError, setPasswordMatchError] = useState("");
    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setPasswordMatchError("");
        setError("");
        setEmailError("");
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPreviewUrl(URL.createObjectURL(file));
        const reader = new FileReader();
        reader.onloadend = () =>
            setFormData((prev) => ({ ...prev, photo: reader.result }));
        reader.readAsDataURL(file);
    };

    // const handleSubmit = async (e) => {
    //     e.preventDefault();

    //     if (formData.userPassword !== formData.confirmPassword) {
    //         setPasswordMatchError("Passwords do not match.");
    //         return;
    //     }

    //     setLoading(true);
    //     setError("");
    //     setEmailError("");

    //     try {
    //         const res = await authApi.post("/v1/user/signup", {
    //             userId: 0,
    //             userName: formData.userName,
    //             userEmail: formData.userEmail,
    //             userPassword: formData.userPassword,
    //             role: "user",
    //             photo: formData.photo || "string",
    //             emailVerified: true,
    //         });

    //         if (res.status === "success" && res.code === 200) {
    //             setFormData({
    //                 userName: "", userEmail: "",
    //                 userPassword: "", confirmPassword: "", photo: null,
    //             });
    //             setPreviewUrl(null);
    //             navigate("/warehouse_management/verifyemail");
    //         } else if (res.code === 409 || res.message?.includes("already")) {
    //             setEmailError("This email is already registered. Try signing in.");
    //         } else {
    //             setError(res.message || "Registration failed. Please try again.");
    //         }
    //     } catch (err) {
    //         console.error("Register error:", err);
    //         const serverMsg = err.response?.data?.message;
    //         if (serverMsg?.includes("already")) {
    //             setEmailError("This email is already registered.");
    //         } else {
    //             setError(serverMsg || "Network error. Please try again.");
    //         }
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const pendingSecondaryPayload = getStoredSecondaryPayload();
        const currentEmail = formData.userEmail.trim().toLowerCase();
        const pendingEmail = (pendingSecondaryPayload?.userEmail || "")
            .trim()
            .toLowerCase();

        if (pendingSecondaryPayload && pendingEmail === currentEmail) {
            setLoading(true);
            setError("");
            setEmailError("");

            try {
                await registerSecondaryWithRetry(pendingSecondaryPayload);
                sessionStorage.removeItem(PENDING_SECONDARY_REGISTER_KEY);
                navigate("/warehouse_management/verifyemail");
            } catch (err) {
                const serverMsg = err.response?.data?.message;
                setError(
                    serverMsg ||
                    "Account created, but final setup failed after 3 attempts. Please try again."
                );
            } finally {
                setLoading(false);
            }

            return;
        }

        if (pendingSecondaryPayload && pendingEmail !== currentEmail) {
            sessionStorage.removeItem(PENDING_SECONDARY_REGISTER_KEY);
        }

        if (formData.userPassword !== formData.confirmPassword) {
            setPasswordMatchError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");
        setEmailError("");
        setPasswordMatchError("");

        const secondaryPayload = {
            userName: formData.userName,
            userEmail: formData.userEmail,
            userPassword: formData.userPassword,
            companyName: formData.companyName || "",
            phone: formData.phone || "",
            timezone: formData.timezone || "",
            currency: formData.currency || "",
            avatar: formData.photo || "",
        };

        try {
            const mainApiResponse = await authApi.post("/v1/user/signup", {
                userId: 0,
                userName: formData.userName,
                userEmail: formData.userEmail,
                userPassword: formData.userPassword,
                role: "user",
                photo: formData.photo || "string",
                emailVerified: true,
            });

            const isSuccess = mainApiResponse?.status === "success" ||
                mainApiResponse?.code === 200;

            if (isSuccess) {
                sessionStorage.setItem(
                    PENDING_SECONDARY_REGISTER_KEY,
                    JSON.stringify(normalizeSecondaryPayload(secondaryPayload))
                );

                await registerSecondaryWithRetry(secondaryPayload);
                sessionStorage.removeItem(PENDING_SECONDARY_REGISTER_KEY);

                setFormData({
                    userName: "",
                    userEmail: "",
                    userPassword: "",
                    confirmPassword: "",
                    companyName: "",
                    phone: "",
                    photo: null,
                    avatar: null,
                });
                setPreviewUrl(null);
                navigate("/warehouse_management/verifyemail");
            } else {
                const errorMsg = mainApiResponse?.data?.message || "Registration failed. Please try again.";

                if (isAlreadyRegisteredMessage(errorMsg)) {
                    await registerSecondaryWithRetry(secondaryPayload);
                    sessionStorage.removeItem(PENDING_SECONDARY_REGISTER_KEY);
                    setEmailError("This email is already registered. Try signing in.");
                } else {
                    setError(errorMsg);
                }
            }

        } catch (err) {
            console.error("Register error:", err);
            const serverMsg = err.response?.data?.message;
            const hasPendingSecondaryRegister = Boolean(getStoredSecondaryPayload());

            if (hasPendingSecondaryRegister) {
                setError(
                    serverMsg ||
                    "Account created, but final setup failed after 3 attempts. Please try again."
                );
            } else if (isAlreadyRegisteredMessage(serverMsg)) {
                try {
                    await registerSecondaryWithRetry(secondaryPayload);
                    setEmailError("This email is already registered. Try signing in.");
                } catch (secondaryErr) {
                    const secondaryMsg = secondaryErr.response?.data?.message;
                    setError(
                        secondaryMsg ||
                        "This email is already registered, but final setup failed after 3 attempts."
                    );
                }
            } else if (serverMsg) {
                setError(serverMsg);
            } else {
                setError("Network error. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        formData,
        previewUrl,
        showPassword,
        showConfirm,
        passwordMatchError,
        error,
        emailError,
        loading,
        handleChange,
        handleImageChange,
        handleSubmit,
        togglePassword: () => setShowPassword((prev) => !prev),
        toggleConfirm: () => setShowConfirm((prev) => !prev),
    };
}
