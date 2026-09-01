import React, { useState } from "react";
import toast from "react-hot-toast";
import emailjs from "emailjs-com";
import { Mail, MessageCircle, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import Topbar from "@/components/layout/Topbar";
import worldImage from "@/assets/world.png";

const supportEmail = "service@printernoble.com";
const whatsappNumber = "+65 8012 6475";
const whatsappHref = "https://wa.me/6580126475";
const emailServiceId = import.meta.env.VITE_EMAIL_JS_SERVICE_ID;
const emailTemplateId = import.meta.env.VITE_EMAIL_JS_TEMPLATE_ID;
const emailPublicKey = import.meta.env.VITE_EMAIL_JS_PUBLIC_KEY;
const countryOptions = [
  { value: "Singapore", labelKey: "contact.countries.singapore" },
  { value: "Malaysia", labelKey: "contact.countries.malaysia" },
  { value: "Philippines", labelKey: "contact.countries.philippines" },
  { value: "Indonesia", labelKey: "contact.countries.indonesia" },
  { value: "Vietnam", labelKey: "contact.countries.vietnam" },
  { value: "Thailand", labelKey: "contact.countries.thailand" },
  { value: "Other", labelKey: "contact.countries.other" },
];

const isEmailJsConfigured = [emailServiceId, emailTemplateId, emailPublicKey].every(
  (value) => value && !String(value).startsWith("your_")
);

export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    userName: "",
    email: "",
    country: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailJsConfigured) {
      toast.error(t("contact.emailServiceNotConfigured", { defaultValue: "Email service is not configured yet." }));
      return;
    }

    setSending(true);

    try {
      await emailjs.send(
        emailServiceId,
        emailTemplateId,
        formData,
        emailPublicKey
      );

      toast.success(t("contact.sendSuccess", { defaultValue: "Thank you! Your message has been sent." }));
      setFormData({ userName: "", email: "", country: "", message: "" });
    } catch (error) {
      console.error("Email failed:", error);
      toast.error(t("contact.sendFailed", { defaultValue: "Failed to send message. Please try again later." }));
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="space-y-5 font-body text-primary-text">
      <Topbar PageTitle="Contact" />

      <section className="rounded-xl bg-white px-5 py-4">
        <h2 className="text-xl font-bold font-display text-primary-text">
          {t("contact.letsTalk", { defaultValue: "Let's Talk" })}
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
          {t("contact.description", {
            defaultValue:
              "Need help with the ERP website, orders, inventory, account setup, or anything else? Send us a message and our support team will get back to you.",
          })}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <section className="rounded-xl border border-surface-border bg-white xl:col-span-3">
          <div className="border-b border-surface-border px-5 py-4">
            <h2 className="text-xl font-bold font-display text-primary-text">
              {t("contact.supportChannels", { defaultValue: "Support Channels" })}
            </h2>
          </div>

          <div className="space-y-5 px-5 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <a
                className="flex items-start gap-3 rounded-lg border border-surface-border bg-slate-50/70 px-4 py-4 transition hover:border-primary/40 hover:bg-white"
                href={`mailto:${supportEmail}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Mail size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    {t("contact.supportEmail", { defaultValue: "Support Email" })}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-primary">
                    {supportEmail}
                  </span>
                </span>
              </a>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-lg border border-surface-border bg-slate-50/70 px-4 py-4 transition hover:border-primary/40 hover:bg-white"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#E5F4EC] text-[#168A4A]">
                  <MessageCircle size={18} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    {t("contact.directCsTitle", { defaultValue: "Direct talk with CS team" })}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    {t("contact.directCsDescription", {
                      defaultValue: "Use WhatsApp for quick help from our customer service team.",
                    })}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    {t("contact.whatsapp", { defaultValue: "WhatsApp" })}: {whatsappNumber}
                  </span>
                </span>
              </a>
            </div>

            <div className="overflow-hidden rounded-lg border border-surface-border bg-slate-50/70 px-4 py-4">
              <img className="mx-auto w-full max-w-4xl object-contain" src={worldImage} alt="World" />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-surface-border bg-white xl:col-span-2">
          <div className="border-b border-surface-border px-5 py-4">
            <h2 className="text-xl font-bold font-display text-primary-text">
              {t("contact.sendMessage", { defaultValue: "Send Message" })}
            </h2>
          </div>

          <div className="px-5 py-5">
            <form className="w-full space-y-5" onSubmit={handleSubmit}>
              <ContactInput
                label={t("contact.name", { defaultValue: "Name" })}
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                placeholder={t("contact.namePlaceholder", { defaultValue: "Your name" })}
                required
              />
              <ContactInput
                label={t("contact.email", { defaultValue: "Email" })}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t("contact.emailPlaceholder", { defaultValue: "you@example.com" })}
                required
              />
              <ContactSelect
                label={t("contact.country", { defaultValue: "Country" })}
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder={t("contact.countryPlaceholder", { defaultValue: "Your country" })}
              />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-800">
                  {t("contact.message", { defaultValue: "Message" })}
                </span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={7}
                  placeholder={t("contact.messagePlaceholder", { defaultValue: "Tell us what you need help with" })}
                  className="min-h-[190px] w-full resize-none rounded-lg border border-surface-border bg-white px-3 py-3 text-sm text-slate-700 outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Send size={16} />
                )}
                {sending
                  ? t("contact.sending", { defaultValue: "Sending..." })
                  : t("contact.sendMessage", { defaultValue: "Send Message" })}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function ContactInput({ label, name, value, onChange, type = "text", placeholder, required = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-surface-border bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </label>
  );
}

function ContactSelect({ label, name, value, onChange, placeholder, required = false }) {
  const { t } = useTranslation();

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="h-11 w-full rounded-lg border border-surface-border bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
      >
        <option value="">{placeholder}</option>
        {countryOptions.map((country) => (
          <option key={country.value} value={country.value}>
            {t(country.labelKey, { defaultValue: country.value })}
          </option>
        ))}
      </select>
    </label>
  );
}
