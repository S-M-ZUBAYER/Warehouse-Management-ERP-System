import { X } from "lucide-react";

function ModalInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  error,
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-primary-text mb-1.5 font-body">
        {required && <span className="text-primary-text mr-0.5">*</span>}
        {label}
      </label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white font-body
                    placeholder-slate-400 text-primary-text outline-none transition-all
                    ${
                      error
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
                    }`}
      />
      {error && <p className="text-xs text-red-500 mt-1 font-body">{error}</p>}
    </div>
  );
}

export default function AddWarehouseModal({
  isOpen,
  form,
  errors,
  saving,
  onFormChange,
  onAttributeChange,
  onAdd,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(200,210,220,0.55)",
        backdropFilter: "blur(3px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white max-w-[657px] rounded-2xl shadow-2xl w-full font-body"
        style={{
          animation: "popIn 0.18s ease both",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-2xl font-bold text-primary-text font-display">
            Add Warehouse
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full
                       text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="px-6 pb-6 space-y-4">
          {/* Warehouse Attribute — radio group */}
          <div>
            <p className="text-xs font-semibold text-primary-text mb-2.5">
              Warehouse Attribute
            </p>
            <div className="flex items-center gap-6">
              {["Own Warehouse", "Third party Warehouse"].map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <div
                    onClick={() => onAttributeChange(option)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                transition-colors cursor-pointer flex-shrink-0
                                ${
                                  form.attribute === option
                                    ? "border-primary"
                                    : "border-slate-300 group-hover:border-slate-400"
                                }`}
                  >
                    {form.attribute === option && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-sm text-primary-text select-none">
                    {option}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Warehouse Name — required */}
          <ModalInput
            label="Warehouse Name"
            name="name"
            value={form.name}
            onChange={onFormChange}
            placeholder="Warehouse name here"
            required
            error={errors.name}
          />

          {/* Manager */}
          <ModalInput
            label="Manager"
            name="manager"
            value={form.manager}
            onChange={onFormChange}
            placeholder="Manager name here"
          />

          {/* Phone Number */}
          <ModalInput
            label="Phone Number"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={onFormChange}
            placeholder="Phone Number Here"
          />

          {/* Location */}
          <ModalInput
            label="Location"
            name="location"
            value={form.location}
            onChange={onFormChange}
            placeholder="Warehouse address/Location here"
          />

          {/* ── Footer Buttons ── */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-10 py-2.5 text-sm font-semibold border border-surface-border
                         rounded-lg text-primary-text bg-white hover:bg-surface-card transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAdd}
              disabled={saving}
              className="px-10 py-2.5 text-sm font-semibold rounded-lg bg-primary
                         hover:bg-primary-dark text-white transition-colors
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center gap-2"
            >
              {saving && (
                <div
                  className="w-4 h-4 border-2 border-white/30 border-t-white
                                rounded-full animate-spin"
                />
              )}
              Add
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
}
