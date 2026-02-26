export default function InputField({
  icon: Icon,
  label,
  error,
  rightElement,
  className = "",
  ...props
}) {
  return (
    <div className="mb-5">
      {label && (
        <label
          className="block text-sm font-semibold mb-1.5"
          style={{ color: "#0F2744", fontFamily: "'DM Sans', sans-serif" }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex"
            style={{ color: "#94A3B8" }}
          >
            <Icon size={16} />
          </div>
        )}
        <input
          {...props}
          className={`w-full rounded-xl text-sm transition-all duration-200 ${className}`}
          style={{
            padding: `12px ${rightElement ? "44px" : "14px"} 12px ${Icon ? "42px" : "14px"}`,
            background: "#F8FAFC",
            border: `1.5px solid ${error ? "#EF4444" : "#CBD5E1"}`,
            color: "#1E293B",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#F59E0B";
            e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "#EF4444" : "#CBD5E1";
            e.target.style.boxShadow = "none";
          }}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs mt-1.5 font-medium" style={{ color: "#EF4444" }}>
          {error}
        </p>
      )}
    </div>
  );
}
