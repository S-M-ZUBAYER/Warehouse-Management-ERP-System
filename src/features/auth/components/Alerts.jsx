import { CheckCircle, AlertCircle } from "lucide-react";

export function SuccessAlert({ message }) {
  if (!message) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm font-medium"
      style={{
        background: "#ECFDF5",
        border: "1px solid #6EE7B7",
        color: "#047857",
      }}
    >
      <CheckCircle size={15} className="flex-shrink-0" />
      {message}
    </div>
  );
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm font-medium"
      style={{
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        color: "#DC2626",
      }}
    >
      <AlertCircle size={15} className="flex-shrink-0" />
      {message}
    </div>
  );
}
