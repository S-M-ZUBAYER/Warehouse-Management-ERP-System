import { useTranslation } from "react-i18next";
import { Globe2 } from "lucide-react";
import { languageOptions } from "@/i18n";

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage || i18n.language || "en";

  return (
    <label className="flex items-center gap-2 rounded-full bg-white px-3 py-2 border border-surface-border">
      <Globe2 size={16} className="text-primary" aria-hidden="true" />
      <span className="sr-only">{t("app.selectLanguage")}</span>
      <select
        value={currentLanguage}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        aria-label={t("app.selectLanguage")}
        className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
      >
        {languageOptions.map((language) => (
          <option key={language.value} value={language.value}>
            {language.label}
          </option>
        ))}
      </select>
    </label>
  );
}
