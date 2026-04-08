import { X } from "lucide-react";
import { NestedPageRow } from "./NestedPageRow";

export default function EditRoleModal({
  open,
  onClose,
  form,
  onChange,
  togglePermission,
  errors,
  saving,
  onSave,
  pages,
}) {
  if (!open) return null;

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
        className="bg-white rounded-2xl shadow-xl w-full font-body"
        style={{ maxWidth: "440px", animation: "popIn 0.18s ease both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5">
          <h2 className="text-lg font-bold text-slate-800 font-display">
            Edit Role
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full
                                   text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-7 pb-7 space-y-5">
          {/* Basic Information */}
          <div>
            <p className="text-sm font-bold text-slate-800 mb-3">
              Basic Information
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  <span className="text-slate-700 mr-0.5">*</span>Role
                </label>
                <input
                  type="text"
                  name="role"
                  value={form.role}
                  onChange={onChange}
                  placeholder="Input role name here"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white
                                                placeholder-slate-400 text-slate-700 outline-none transition-all
                                                ${
                                                  errors.role
                                                    ? "border-red-300 focus:border-red-400"
                                                    : "border-surface-border focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                }`}
                />
                {errors.role && (
                  <p className="text-xs text-red-500 mt-1">{errors.role}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Describe the role"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-surface-border
                                               bg-white placeholder-slate-400 text-slate-700 outline-none transition-all
                                               focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>
          </div>

          {/* Set Permissions */}
          <div>
            <p className="text-sm font-bold text-slate-800 mb-3">
              Set Permissions
            </p>
            <div className="border border-surface-border rounded-xl overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-surface-border">
                      <th className="py-2.5 text-center text-xs font-semibold text-slate-600 w-16">
                        Select
                      </th>
                      <th className="py-2.5 text-center text-xs font-semibold text-slate-600">
                        Webpage name
                      </th>
                      <th className="py-2.5 pr-5 text-center text-xs font-semibold text-slate-600 w-16">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {pages.map((page) => (
                      <NestedPageRow
                        key={page.id}
                        page={page}
                        form={form}
                        togglePermission={togglePermission}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold border border-surface-border
                                       rounded-xl text-slate-700 bg-white hover:bg-surface-card transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold bg-primary hover:bg-primary-dark
                                       text-white rounded-xl transition-colors disabled:opacity-60
                                       flex items-center gap-2"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}
