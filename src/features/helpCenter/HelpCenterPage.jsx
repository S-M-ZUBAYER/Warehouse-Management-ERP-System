import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  ImageIcon,
  PlayCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Topbar from "@/components/layout/Topbar";

const FAQ_PRODUCT = "Warehouse ERP";
const FAQ_LIMIT = 100;
const FAQ_PATH = "/tht/chatBot/faqs/language";
const DEFAULT_CHATBOT_ORIGIN = "https://grozziie.zjweiting.com:8035";
const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const LANGUAGE_TO_FAQ_CODE = {
  en: "EN",
  zh: "CN",
  fil: "PH",
  id: "ID",
  th: "TH",
  vi: "VI",
  ms: "MY",
  pt: "PT",
  ja: "JP",
};

function getBaseLanguage(language) {
  return String(language || "en").toLowerCase().split(/[-_]/)[0] || "en";
}

function getFaqLanguageCode(language) {
  return LANGUAGE_TO_FAQ_CODE[getBaseLanguage(language)] || "EN";
}

function getChatbotOrigin() {
  const configuredUrl = String(import.meta.env.VITE_AI_CHATBOT_API_URL || "").trim();

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      return DEFAULT_CHATBOT_ORIGIN;
    }
  }

  return DEFAULT_CHATBOT_ORIGIN;
}

function buildFaqUrl(page, languageCode) {
  const url = new URL(FAQ_PATH, `${getChatbotOrigin()}/`);
  url.searchParams.set("product", FAQ_PRODUCT);
  url.searchParams.set("lan", languageCode);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(FAQ_LIMIT));
  return url.toString();
}

function getFaqKey(item, index) {
  return item.id || `${item.question || "faq"}-${index}`;
}

function normalizeMatchedUrl(value) {
  return String(value || "").replace(/[),.;!?]+$/g, "");
}

function getLinkType(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.includes("vimeo.com") ||
      /\.(mp4|mov|webm|m4v)$/i.test(path)
    ) {
      return "video";
    }

    if (/\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(path)) {
      return "image";
    }
  } catch {
    return "link";
  }

  return "link";
}

function parseAnswerLinks(answer) {
  const links = [];
  const text = String(answer || "")
    .replace(URL_PATTERN, (match) => {
      const url = normalizeMatchedUrl(match);
      const trailingText = match.slice(url.length);

      if (url && !links.some((link) => link.url === url)) {
        links.push({ url, type: getLinkType(url) });
      }

      return trailingText;
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, links };
}

function getLinkButtonMeta(type, t) {
  if (type === "video") {
    return {
      label: t("aiChatbot.watchVideo", { defaultValue: "Watch video" }),
      icon: PlayCircle,
    };
  }

  if (type === "image") {
    return {
      label: t("aiChatbot.watchImage", { defaultValue: "Watch image" }),
      icon: ImageIcon,
    };
  }

  return {
    label: t("aiChatbot.openLink", { defaultValue: "Open link" }),
    icon: ExternalLink,
  };
}

function HelpCenterAnswer({ answer, t }) {
  const fallbackAnswer = t("helpCenter.noAnswer", { defaultValue: "No answer available." });
  const { text, links } = useMemo(() => parseAnswerLinks(answer || fallbackAnswer), [answer, fallbackAnswer]);

  return (
    <div className="space-y-3">
      {text ? <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{text}</p> : null}

      {links.length ? (
        <div className="flex flex-wrap gap-2">
          {links.map((link) => {
            const meta = getLinkButtonMeta(link.type, t);
            const Icon = meta.icon;

            return (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-dark"
              >
                <Icon size={15} />
                <span>{meta.label}</span>
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

async function getAllFaqs(languageCode, signal, onPageLoaded) {
  let page = 1;
  let hasNextPage = true;
  const allQuestions = [];

  while (hasNextPage) {
    const res = await fetch(buildFaqUrl(page, languageCode), {
      signal,
      headers: { Accept: "application/json" },
    });
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Failed to load FAQs");
    }

    const rows = Array.isArray(result.data) ? result.data : [];
    allQuestions.push(...rows);
    onPageLoaded?.(allQuestions.length);

    hasNextPage = Boolean(result.hasNextPage);
    page += 1;
  }

  return allQuestions;
}

export default function HelpCenterPage() {
  const { t, i18n } = useTranslation();
  const [faqs, setFaqs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [openFaqKey, setOpenFaqKey] = useState("");
  const currentLanguage = i18n.resolvedLanguage || i18n.language || "en";
  const faqLanguageCode = useMemo(() => getFaqLanguageCode(currentLanguage), [currentLanguage]);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    setLoading(true);
    setError("");
    setFaqs([]);
    setLoadedCount(0);

    getAllFaqs(faqLanguageCode, controller.signal, (count) => {
      if (alive) setLoadedCount(count);
    })
      .then((rows) => {
        if (alive) setFaqs(rows);
      })
      .catch((err) => {
        if (!alive || err.name === "AbortError") return;
        setFaqs([]);
        setError(err.message || "Failed to load FAQs");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [faqLanguageCode, reloadKey]);

  const filteredFaqs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return faqs;

    return faqs.filter((item) => {
      const variants = Array.isArray(item.variants) ? item.variants.join(" ") : "";
      return [item.id, item.question, item.answer, variants]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [faqs, search]);

  const handleRefresh = () => {
    setOpenFaqKey("");
    setReloadKey((key) => key + 1);
  };

  return (
    <main className="space-y-5 font-body text-primary-text">
      <Topbar PageTitle={t("helpCenter.title", { defaultValue: "Help Center" })} />

      <section className="rounded-xl bg-white px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-primary-text">
              {t("helpCenter.heading", { defaultValue: "Warehouse ERP Help Center" })}
            </h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-500">
              {t("helpCenter.description", {
                defaultValue:
                  "Browse the available Warehouse ERP questions and answers from the chatbot knowledge base.",
              })}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
            <HelpCircle size={16} />
            {FAQ_PRODUCT}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-surface-border bg-white">
        <div className="flex flex-col gap-3 border-b border-surface-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("helpCenter.searchPlaceholder", { defaultValue: "Search questions or answers" })}
              className="h-11 w-full rounded-lg border border-surface-border bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">
              {loading
                ? t("helpCenter.loadingCount", {
                    count: loadedCount,
                    defaultValue: `Loaded ${loadedCount} questions...`,
                  })
                : t("helpCenter.count", {
                    shown: filteredFaqs.length,
                    total: faqs.length,
                    defaultValue: `${filteredFaqs.length} of ${faqs.length} questions`,
                  })}
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-surface-border bg-white px-4 text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              {t("common.refresh", { defaultValue: "Refresh" })}
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          {error ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle size={17} />
                {error}
              </span>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {t("common.retry", { defaultValue: "Retry" })}
              </button>
            </div>
          ) : loading && !faqs.length ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-surface-border bg-slate-50 px-4 py-4">
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : filteredFaqs.length ? (
            <div className="space-y-3">
              {filteredFaqs.map((item, index) => {
                const faqKey = getFaqKey(item, index);
                const isOpen = openFaqKey === faqKey;

                return (
                  <article key={faqKey} className="overflow-hidden rounded-lg border border-surface-border bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenFaqKey(isOpen ? "" : faqKey)}
                      aria-expanded={isOpen}
                      className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/15"
                    >
                      <span className="flex min-w-0 items-start gap-2 text-sm font-bold leading-6 text-slate-900">
                        <span className="shrink-0 text-primary">{item.id || `Q-${index + 1}`}</span>
                        <span>{item.question}</span>
                      </span>
                      <ChevronDown
                        size={18}
                        className={`mt-1 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isOpen ? (
                      <div className="border-t border-surface-border bg-slate-50/70 px-4 py-4">
                        <HelpCenterAnswer answer={item.answer} t={t} />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-surface-border bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                {t("helpCenter.noResults", { defaultValue: "No questions found." })}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {t("helpCenter.noResultsHint", { defaultValue: "Try another search keyword." })}
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
