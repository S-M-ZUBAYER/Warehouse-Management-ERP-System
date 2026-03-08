import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "@/lib/authApi";


export function useVerifyEmail() {
    const navigate = useNavigate();

    const [codes, setCodes] = useState(["", "", "", "", "", ""]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    const handleChange = (index, value) => {
        if (value && !/^[a-zA-Z0-9]$/.test(value)) return;
        const newCodes = [...codes];
        newCodes[index] = value.toUpperCase();
        setCodes(newCodes);
        setError("");
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !codes[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData
            .getData("text")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase()
            .slice(0, 6);

        const newCodes = [...codes];
        pasted.split("").forEach((char, i) => { newCodes[i] = char; });
        setCodes(newCodes);
        inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    };

    const handleSubmit = async () => {
        const code = codes.join("");
        if (code.length < 6) {
            setError("Please enter the complete 6-character code.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // This endpoint returns 200 on success, 404 on invalid code
            // authApi wraps axios so we use .get() with params
            const response = await authApi.get(`/v1/user/verify?code=${code}`);
            console.log(response);

            // If we reach here (no error thrown), it's a success
            setSuccess(true);
            setTimeout(() => navigate("/warehouse_management/login"), 2000);
        } catch (err) {
            const status = err.response?.status;
            if (status === 404) {
                setError("Invalid verification code. Please check and try again.");
                setCodes(["", "", "", "", "", ""]);
                inputRefs.current[0]?.focus();
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return {
        codes,
        inputRefs,
        error,
        success,
        loading,
        allFilled: codes.every((c) => c !== ""),
        handleChange,
        handleKeyDown,
        handlePaste,
        handleSubmit,
    };
}