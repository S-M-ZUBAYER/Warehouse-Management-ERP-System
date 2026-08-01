import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translateStaticText } from "../../../i18nDomTranslator";

function translateNode(node, language) {
  if (typeof node === "string") return translateStaticText(node, language);
  if (Array.isArray(node)) return node.map((child) => translateNode(child, language));
  return node;
}

export default function PrimaryButton({
  loading = false,
  children,
  fullWidth = true,
  variant = "primary",
  ...props
}) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const variants = {
    primary: {
      background: "#004368",
      color: "#fff",
      boxShadow: "0 4px 14px rgba(15,39,68,0.35)",
    },
    ghost: {
      background: "#F1F5F9",
      color: "#64748B",
      boxShadow: "none",
    },
  };

  const style = variants[variant] || variants.primary;

  return (
    <button
      {...props}
      style={{
        width: fullWidth ? "100%" : "auto",
        padding: "13px 20px",
        border: "none",
        borderRadius: "12px",
        fontSize: "15px",
        fontWeight: 600,
        fontFamily: "'Inter Tight', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "transform 0.15s, box-shadow 0.15s, opacity 0.15s",
        marginTop: "4px",
        ...style,
        ...(props.style || {}),
      }}
      onMouseEnter={(e) => {
        if (!props.disabled) {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 8px 22px rgba(15,39,68,0.45)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = style.boxShadow;
      }}
    >
      {loading ? (
        <div
          style={{
            width: "20px",
            height: "20px",
            border: "2.5px solid rgba(255,255,255,0.25)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
      ) : (
        <>
          {translateNode(children, language)}
          {variant === "primary" && <ArrowRight size={15} />}
        </>
      )}
    </button>
  );
}
