import { Link } from "react-router-dom";
import { ShieldCheck, MailCheck, RefreshCw } from "lucide-react";
import { useVerifyEmail } from "../hooks/useVerifyEmail";
import AuthLayout from "../components/AuthLayout";
import PrimaryButton from "../components/PrimaryButton";
import { SuccessAlert } from "../components/Alerts";

export default function VerifyEmail() {
  const {
    codes,
    inputRefs,
    error,
    success,
    loading,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
  } = useVerifyEmail();

  const allFilled = codes.every((c) => c !== "");

  return (
    <AuthLayout
      title="Almost There!"
      subtitle="Verify your email to activate your Grozziie account and start managing"
    >
      <div className="max-w-sm mx-auto w-full auth-fade-in text-center">
        {/* Email icon */}
        <div className="w-20 h-20 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 bg-surface-card">
          <MailCheck size={36} />
        </div>

        <h1 className="text-3xl font-bold mb-2 text-primary font-display">
          Verify Your Email
        </h1>
        <p
          className="text-sm leading-relaxed mb-8"
          style={{ color: "#64748B" }}
        >
          We've sent a{" "}
          <strong className=" text-primary">6-character code</strong> to your
          email address. Enter it below to confirm your account.
        </p>

        {/* ── OTP Boxes ── */}
        <div className="flex gap-2.5 justify-center mb-3">
          {codes.map((code, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              value={code}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={loading || success}
              aria-label={`Code digit ${index + 1}`}
              className="rounded-xl font-display text-center font-bold transition-all duration-200"
              style={{
                width: "50px",
                height: "58px",
                fontSize: "22px",
                color: "#0F2744",
                background: code ? "rgba(245,158,11,0.08)" : "#F8FAFC",
                border: `2px solid ${
                  error ? "#EF4444" : code ? "#F59E0B" : "#CBD5E1"
                }`,
                outline: "none",
                boxShadow: code ? "0 0 0 3px rgba(245,158,11,0.1)" : "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#F59E0B";
                e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = error
                  ? "#EF4444"
                  : code
                    ? "#F59E0B"
                    : "#CBD5E1";
                e.target.style.boxShadow = code
                  ? "0 0 0 3px rgba(245,158,11,0.1)"
                  : "none";
              }}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm font-medium mb-4" style={{ color: "#EF4444" }}>
            {error}
          </p>
        )}

        {/* Success banner */}
        <SuccessAlert
          message={success ? "Email verified! Redirecting to login..." : ""}
        />

        {/* Verify button */}
        <PrimaryButton
          onClick={handleSubmit}
          disabled={loading || success || !allFilled}
          loading={loading}
        >
          <ShieldCheck size={16} /> Verify & Continue
        </PrimaryButton>

        {/* Back to login */}
        <p className="mt-5 text-sm" style={{ color: "#64748B" }}>
          <Link
            to="/login"
            className="font-semibold transition-colors font-body text-primary"
          >
            ← Back to Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
