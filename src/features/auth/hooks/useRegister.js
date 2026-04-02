import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/lib/authApi";
import api from "../../../lib/api";


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

        if (formData.userPassword !== formData.confirmPassword) {
            setPasswordMatchError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");
        setEmailError("");
        setPasswordMatchError("");

        try {
            // Call both APIs at the same time
            const [res1, res2] = await Promise.allSettled([
                // Old signup API
                authApi.post("/v1/user/signup", {
                    userId: 0,
                    userName: formData.userName,
                    userEmail: formData.userEmail,
                    userPassword: formData.userPassword,
                    role: "user",
                    photo: formData.photo || "string",
                    emailVerified: true,
                }),

                // New register API
                api.post("/auth/register", {
                    userName: formData.userName,
                    userEmail: formData.userEmail,
                    userPassword: formData.userPassword,
                    companyName: formData.companyName || "",
                    phone: formData.phone || "",
                    timezone: formData.timezone || "",
                    currency: formData.currency || "",
                    avatar: formData.photo || "",
                }),
            ]);

            // Check email-already-exists errors from either API first
            const oldApiMsg = res1.reason?.response?.data?.message || res1.value?.data?.message || "";
            const newApiMsg = res2.reason?.response?.data?.message || res2.value?.data?.message || "";

            const emailAlreadyExists =
                oldApiMsg?.toLowerCase().includes("already") ||
                newApiMsg?.toLowerCase().includes("already");

            if (emailAlreadyExists) {
                setEmailError("This email is already registered. Try signing in.");
                return;
            }

            // Check if new register API succeeded (primary — has tokens + user)
            const newApiSuccess =
                res2.status === "fulfilled" && res2.value?.data?.success === true;

            // Check if old signup API succeeded
            const oldApiSuccess =
                res1.status === "fulfilled" &&
                (res1.value?.data?.status === "success" || res1.value?.data?.code === 200);

            if (newApiSuccess || oldApiSuccess) {
                // Store tokens from new API if available
                if (newApiSuccess) {
                    const { accessToken, refreshToken } = res2.value.data.data;
                    localStorage.setItem("whmAccessToken", accessToken);
                    localStorage.setItem("whmRefreshToken", refreshToken);
                }

                // Reset form
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

                // Navigate to verify email
                navigate("/warehouse_management/verifyemail");

            } else {
                // Both failed — show most relevant error
                const errorMsg =
                    newApiMsg || oldApiMsg || "Registration failed. Please try again.";
                setError(errorMsg);
            }

        } catch (err) {
            console.error("Register error:", err);
            const serverMsg = err.response?.data?.message;
            if (serverMsg?.toLowerCase().includes("already")) {
                setEmailError("This email is already registered. Try signing in.");
            } else {
                setError(serverMsg || "Network error. Please try again.");
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