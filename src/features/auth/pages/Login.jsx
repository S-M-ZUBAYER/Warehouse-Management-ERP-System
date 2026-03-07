import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useLogin } from "../hooks/useLogin";
import { useForgotPassword } from "../hooks/useForgotPassword";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { SuccessAlert } from "../components/Alerts";

export default function Login() {
  const [showModal, setShowModal] = useState(false);

  const {
    formData,
    showPassword,
    emailError,
    passwordError,
    forbiddenError,
    loading,
    handleChange,
    handleSubmit,
    togglePassword,
  } = useLogin();

  const {
    forgotEmail,
    setForgotEmail,
    forgotError,
    forgotSuccess,
    forgotLoading,
    handleForgotSubmit,
  } = useForgotPassword();

  return (
    <AuthLayout
      title="Warehouse Command Center"
      subtitle="Log In to explore our site"
    >
      <div className="max-w-sm mx-auto w-full auth-fade-in bg-white">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl text-center font-bold mb-1.5 text-primary font-display">
            Log In
          </h1>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} noValidate>
          <InputField
            icon={Mail}
            label="Email"
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Enter Your Email Address"
            value={formData.email}
            onChange={handleChange}
            error={emailError || forbiddenError}
          />

          <InputField
            icon={Lock}
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            value={formData.password}
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

          {/* Forgot password link */}
          <div className="flex justify-end -mt-2 mb-10">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-sm font-light font-body transition-colors text-gray-400"
              style={{
                background: "none",
                border: "none",
              }}
            >
              Forgot password?
            </button>
          </div>

          <PrimaryButton type="submit" loading={loading}>
            Log In
          </PrimaryButton>
        </form>

        {/* Register link */}
        <p className="text-center mt-12 text-sm" style={{ color: "#64748B" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-bold transition-colors text-primary font-body"
          >
            Create account
          </Link>
        </p>
      </div>

      {/* ── Forgot Password Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-8 w-full auth-fade-in"
            style={{
              maxWidth: "420px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 text-primary bg-surface-card rounded-xl flex items-center justify-center">
                <Lock size={18} />
              </div>
              <h2 className="text-xl font-bold text-primary font-display">
                Reset Password
              </h2>
            </div>
            <p className="text-sm mb-6" style={{ color: "#64748B" }}>
              Enter your email and we'll send you a reset code.
            </p>

            <form onSubmit={handleForgotSubmit} noValidate>
              <InputField
                icon={Mail}
                label="Email Address"
                type="email"
                required
                placeholder="Enter Your Email Address"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                error={forgotError}
              />

              <SuccessAlert message={forgotSuccess} />

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-body font-semibold transition-colors"
                  style={{
                    background: "#F1F5F9",
                    border: "none",
                    color: "#64748B",
                  }}
                >
                  Cancel
                </button>
                <PrimaryButton
                  type="submit"
                  loading={forgotLoading}
                  fullWidth={false}
                  style={{ flex: 1, marginTop: 0 }}
                >
                  Send Code
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
