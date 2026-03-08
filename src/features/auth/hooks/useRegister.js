import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/lib/authApi";


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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.userPassword !== formData.confirmPassword) {
            setPasswordMatchError("Passwords do not match.");
            return;
        }

        setLoading(true);
        setError("");
        setEmailError("");

        try {
            const res = await authApi.post("/v1/user/signup", {
                userId: 0,
                userName: formData.userName,
                userEmail: formData.userEmail,
                userPassword: formData.userPassword,
                role: "user",
                photo: formData.photo || "string",
                emailVerified: true,
            });

            if (res.status === "success" && res.code === 200) {
                setFormData({
                    userName: "", userEmail: "",
                    userPassword: "", confirmPassword: "", photo: null,
                });
                setPreviewUrl(null);
                navigate("/warehouse_management/verifyemail");
            } else if (res.code === 409 || res.message?.includes("already")) {
                setEmailError("This email is already registered. Try signing in.");
            } else {
                setError(res.message || "Registration failed. Please try again.");
            }
        } catch (err) {
            console.error("Register error:", err);
            const serverMsg = err.response?.data?.message;
            if (serverMsg?.includes("already")) {
                setEmailError("This email is already registered.");
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