import { CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateStaticText } from "../../../i18nDomTranslator";

export function SuccessAlert({ message }) {
  const { i18n } = useTranslation();
  if (!message) return null;
  const translatedMessage = translateStaticText(message, i18n.resolvedLanguage || i18n.language);
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
      {translatedMessage}
    </div>
  );
}

export function ErrorAlert({ message }) {
  const { i18n } = useTranslation();
  if (!message) return null;
  const translatedMessage = translateStaticText(message, i18n.resolvedLanguage || i18n.language);
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
      {translatedMessage}
    </div>
  );
}
