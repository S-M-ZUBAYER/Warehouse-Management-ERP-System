import { Link } from "react-router-dom";
import { Eye, EyeOff, Lock, ShieldCheck, KeyRound } from "lucide-react";
import { useForgotPassword } from "../hooks/useForgotPassword";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { SuccessAlert } from "../components/Alerts";

export default function ForgotPassword() {
  const {
    formData,
    handleChange,
    showPassword,
    showConfirm,
    togglePassword,
    toggleConfirm,
    codeError,
    passwordError,
    matchError,
    success,
    loading,
    handleResetSubmit,
  } = useForgotPassword();

  return (
    <AuthLayout
      title="Secure Password Reset"
      subtitle="Enter the verification code from your email to set a new password"
    >
      <div className="max-w-sm mx-auto w-full auth-fade-in">
        {/* Page heading */}
        <div className="mb-8 text-center">
          {/* Icon badge */}
          <div className=" flex justify-center items-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 bg-surface-card text-primary">
              <KeyRound size={22} />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-1.5 font-display text-primary-text ">
            Reset Password
          </h1>
          <p className="text-sm text-primary-text">
            Enter your 6-character code and choose a new password
          </p>
        </div>

        {/* Info banner */}
        <div
          className="flex items-start gap-3 rounded-xl p-3.5 mb-6 text-sm"
          style={{
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            color: "#92400E",
          }}
        >
          <ShieldCheck
            size={16}
            className="flex-shrink-0 mt-0.5"
            color="#F59E0B"
          />
          <span className=" font-body">
            Check your email inbox for the 6-character verification code we sent
            you.
          </span>
        </div>

        <form onSubmit={handleResetSubmit}>
          {/* ── Code input - styled differently, centered with large font ── */}
          <div className="mb-5">
            <label
              className="block text-sm font-body font-semibold mb-1.5"
              style={{ color: "#0F2744" }}
            >
              Verification Code
            </label>
            <input
              type="text"
              name="code"
              required
              maxLength={6}
              value={formData.code}
              onChange={handleChange}
              placeholder="A1B2C3"
              autoComplete="one-time-code"
              className="w-full rounded-xl transition-all duration-200 text-center font-display font-bold uppercase tracking-widest"
              style={{
                padding: "14px",
                background: "#F8FAFC",
                border: `1.5px solid ${codeError ? "#EF4444" : "#CBD5E1"}`,
                color: "#0F2744",
                fontSize: "22px",
                letterSpacing: "10px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#F59E0B";
                e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = codeError ? "#EF4444" : "#CBD5E1";
                e.target.style.boxShadow = "none";
              }}
            />
            {codeError && (
              <p
                className="text-xs mt-1.5 font-medium"
                style={{ color: "#EF4444" }}
              >
                {codeError}
              </p>
            )}
          </div>

          {/* New Password */}
          <InputField
            icon={Lock}
            label="New Password"
            type={showPassword ? "text" : "password"}
            name="newPassword"
            required
            autoComplete="new-password"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChange={handleChange}
            error={passwordError}
            rightElement={
              <button
                type="button"
                onClick={togglePassword}
                className="flex items-center justify-center"
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  padding: 0,
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {/* Confirm Password */}
          <InputField
            icon={ShieldCheck}
            label="Confirm New Password"
            type={showConfirm ? "text" : "password"}
            name="confirmPass"
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={formData.confirmPass}
            onChange={handleChange}
            error={matchError}
            rightElement={
              <button
                type="button"
                onClick={toggleConfirm}
                className="flex items-center justify-center"
                style={{
                  background: "none",
                  border: "none",
                  color: "#94A3B8",
                  padding: 0,
                }}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          <SuccessAlert message={success} />

          <PrimaryButton type="submit" loading={loading}>
            Reset Password
          </PrimaryButton>
        </form>

        {/* Back to login */}
        <p className="text-center mt-5 text-sm" style={{ color: "#64748B" }}>
          <Link
            to="/warehouse_management/login"
            className="font-semibold font-body transition-colors"
            style={{ color: "#0F2744" }}
          >
            ← Back to Login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
