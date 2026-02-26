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
      subtitle="Verify your email to activate your WareERP account and start managing"
    >
      <div className="max-w-sm mx-auto w-full auth-fade-in text-center">
        {/* Email icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(245,158,11,0.1)" }}
        >
          <MailCheck size={36} color="#F59E0B" />
        </div>

        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "'Sora', sans-serif", color: "#0F2744" }}
        >
          Verify Your Email
        </h1>
        <p
          className="text-sm leading-relaxed mb-8"
          style={{ color: "#64748B" }}
        >
          We've sent a{" "}
          <strong style={{ color: "#0F2744" }}>6-character code</strong> to your
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
              className="rounded-xl text-center font-bold transition-all duration-200"
              style={{
                width: "50px",
                height: "58px",
                fontSize: "22px",
                fontFamily: "'Sora', sans-serif",
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

        {/* Divider */}
        <div
          className="flex items-center gap-3 my-5"
          style={{ color: "#CBD5E1" }}
        >
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs" style={{ color: "#94A3B8" }}>
            or
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Resend */}
        <button
          type="button"
          className="flex items-center gap-2 justify-center w-full text-sm font-semibold transition-colors"
          style={{
            background: "#F8FAFC",
            border: "1.5px solid #E2E8F0",
            borderRadius: "12px",
            padding: "12px",
            color: "#64748B",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#CBD5E1";
            e.currentTarget.style.color = "#0F2744";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.color = "#64748B";
          }}
        >
          <RefreshCw size={14} />
          Resend verification code
        </button>

        {/* Back to login */}
        <p className="mt-5 text-sm" style={{ color: "#64748B" }}>
          <Link
            to="/login"
            className="font-semibold transition-colors"
            style={{ color: "#0F2744", fontFamily: "'DM Sans', sans-serif" }}
          >
            ← Back to Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
