import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck } from "lucide-react";
import { useRegister } from "../hooks/useRegister";
import AuthLayout from "../components/AuthLayout";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";

export default function Register() {
  const {
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
    togglePassword,
    toggleConfirm,
  } = useRegister();

  return (
    <AuthLayout
      title="Join WareERP Today"
      subtitle="Start managing your warehouse operations with precision and efficiency"
    >
      <div className="max-w-sm mx-auto w-full auth-fade-in">
        {/* Page heading */}
        <div className="mb-7">
          <h1
            className="text-3xl font-bold mb-1.5"
            style={{ fontFamily: "'Sora', sans-serif", color: "#0F2744" }}
          >
            Create Account
          </h1>
          <p className="text-sm" style={{ color: "#64748B" }}>
            Fill in your details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* ── Avatar Upload ── */}
          <div
            className="flex items-center gap-4 mb-5 p-4 rounded-xl"
            style={{
              background: "#F8FAFC",
              border: "1.5px dashed #CBD5E1",
            }}
          >
            {/* Avatar preview */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{
                background: previewUrl ? "none" : "rgba(245,158,11,0.12)",
              }}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={22} color="#F59E0B" />
              )}
            </div>

            <div>
              <p
                className="text-sm font-semibold mb-1"
                style={{
                  color: "#0F2744",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Profile Photo
              </p>
              <label
                className="text-xs font-semibold rounded-lg px-3 py-1.5 cursor-pointer transition-colors"
                style={{
                  background: "rgba(245,158,11,0.15)",
                  color: "#92400E",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                {previewUrl ? "Change photo" : "Upload photo"}
              </label>
              <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                Optional — PNG, JPG up to 5MB
              </p>
            </div>
          </div>

          {/* Full Name */}
          <InputField
            icon={User}
            label="Full Name"
            type="text"
            name="userName"
            required
            autoComplete="name"
            placeholder="John Manager"
            value={formData.userName}
            onChange={handleChange}
          />

          {/* Email */}
          <InputField
            icon={Mail}
            label="Email Address"
            type="email"
            name="userEmail"
            required
            autoComplete="email"
            placeholder="john@warehouse.com"
            value={formData.userEmail}
            onChange={handleChange}
            error={emailError}
          />

          {/* Password */}
          <InputField
            icon={Lock}
            label="Password"
            type={showPassword ? "text" : "password"}
            name="userPassword"
            required
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={formData.userPassword}
            onChange={handleChange}
            error={error}
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
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            required
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={passwordMatchError}
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

          <PrimaryButton type="submit" loading={loading}>
            Create Account
          </PrimaryButton>
        </form>

        {/* Login link */}
        <p className="text-center mt-5 text-sm" style={{ color: "#64748B" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold transition-colors"
            style={{ color: "#0F2744", fontFamily: "'DM Sans', sans-serif" }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
