import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bot, ExternalLink, Expand, ImageIcon, Minimize2, Move, PlayCircle, Send, UserRound, X } from "lucide-react";
import { getStoredWarehouseUser } from "../../utils/permissions";

const CHATBOT_API_URL =
  import.meta.env.VITE_AI_CHATBOT_API_URL ||
  "https://grozziie.zjweiting.com:8035/tht/chatBot/warehouseErp/chat/gpt";
const CHATBOT_DB_NAME = "grozziie-ai-chatbot";
const CHATBOT_DB_VERSION = 1;
const CHATBOT_STORE_NAME = "chatHistories";
const MAX_STORED_MESSAGES = 100;
const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

const launcherSize = 58;
const widgetSizes = {
  normal: { width: 390, height: 520 },
  large: { width: 720, height: 620 },
};

function createWelcomeMessage(t) {
  return {
    role: "assistant",
    content: t("aiChatbot.welcomeMessage", {
      defaultValue: "Hi, I am your AI assistant. How can I help you today?",
    }),
    isWelcome: true,
  };
}

function readJsonStorage(key, fallback = {}) {
  if (typeof localStorage === "undefined") return fallback;

  try {
    return JSON.parse(localStorage.getItem(key) || "") || fallback;
  } catch {
    return fallback;
  }
}

function getCurrentUserHistoryKey() {
  const warehouseUser = getStoredWarehouseUser();
  const authStore = readJsonStorage("auth-store", {});
  const authUser = authStore?.state?.user || {};
  const authToken = authStore?.state?.token || {};
  const identity =
    warehouseUser?.id ||
    warehouseUser?.userId ||
    warehouseUser?.user_id ||
    warehouseUser?.email ||
    warehouseUser?.userEmail ||
    authUser?.id ||
    authUser?.email ||
    authToken?.id ||
    authToken?.email ||
    "guest";

  return `user:${String(identity).trim().toLowerCase() || "guest"}`;
}

function openChatbotDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(CHATBOT_DB_NAME, CHATBOT_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CHATBOT_STORE_NAME)) {
        db.createObjectStore(CHATBOT_STORE_NAME, { keyPath: "userKey" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB open failed"));
  });
}

function runChatbotStoreTransaction(mode, handler) {
  return openChatbotDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(CHATBOT_STORE_NAME, mode);
        const store = transaction.objectStore(CHATBOT_STORE_NAME);
        const request = handler(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error);
        };
      })
  );
}

async function loadChatHistory(userKey) {
  const record = await runChatbotStoreTransaction("readonly", (store) => store.get(userKey));
  return Array.isArray(record?.messages) ? record.messages : [];
}

function normalizeStoredMessages(messages) {
  return messages
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .filter((message) => !message.isWelcome && !message.error)
    .map((message) => ({
      role: message.role,
      content: String(message.content || ""),
      createdAt: message.createdAt || Date.now(),
    }))
    .filter((message) => message.content.trim())
    .slice(-MAX_STORED_MESSAGES);
}

async function saveChatHistory(userKey, messages) {
  const persistableMessages = normalizeStoredMessages(messages);
  await runChatbotStoreTransaction("readwrite", (store) =>
    store.put({
      userKey,
      messages: persistableMessages,
      updatedAt: Date.now(),
    })
  );
}

function normalizeMatchedUrl(value) {
  return String(value || "").replace(/[),.;!?]+$/g, "");
}

function parseMessageLinks(content) {
  const links = [];
  const text = String(content || "")
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

function ChatMessageContent({ content, fromUser, t }) {
  const { text, links } = useMemo(() => parseMessageLinks(content), [content]);

  return (
    <div className="space-y-2">
      {text && <p className="whitespace-pre-wrap break-words">{text}</p>}
      {links.length > 0 && (
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
                className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  fromUser
                    ? "bg-white text-primary hover:bg-slate-50"
                    : "bg-primary text-white hover:bg-primary-dark"
                }`}
              >
                <Icon size={14} />
                <span>{meta.label}</span>
              </a>
            );
          })}
        </div>
      )}
      {!text && links.length === 0 && <p>{content}</p>}
    </div>
  );
}

function getViewportSize() {
  if (typeof window === "undefined") return { width: 1280, height: 720 };
  return { width: window.innerWidth, height: window.innerHeight };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function clampPosition(position, size) {
  const viewport = getViewportSize();
  const padding = 12;

  return {
    x: clamp(position.x, padding, Math.max(padding, viewport.width - size.width - padding)),
    y: clamp(position.y, padding, Math.max(padding, viewport.height - size.height - padding)),
  };
}

function getDefaultLauncherPosition() {
  const viewport = getViewportSize();
  return {
    x: Math.max(12, viewport.width - launcherSize - 24),
    y: Math.max(12, viewport.height - launcherSize - 24),
  };
}

function getDefaultWidgetPosition(size) {
  const viewport = getViewportSize();
  return {
    x: Math.max(12, viewport.width - size.width - 24),
    y: Math.max(12, viewport.height - size.height - 24),
  };
}

export default function FloatingAiChatbot() {
  const { t, i18n } = useTranslation();
  const userHistoryKey = useMemo(() => getCurrentUserHistoryKey(), []);
  const [open, setOpen] = useState(false);
  const [large, setLarge] = useState(false);
  const [launcherPosition, setLauncherPosition] = useState(getDefaultLauncherPosition);
  const [widgetPosition, setWidgetPosition] = useState(() => getDefaultWidgetPosition(widgetSizes.normal));
  const [messages, setMessages] = useState(() => [createWelcomeMessage(t)]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [dragState, setDragState] = useState(null);
  const [launcherMoved, setLauncherMoved] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesChangedBeforeLoadRef = useRef(false);

  const widgetSize = useMemo(() => {
    const viewport = getViewportSize();
    const requested = large ? widgetSizes.large : widgetSizes.normal;

    return {
      width: Math.min(requested.width, viewport.width - 24),
      height: Math.min(requested.height, viewport.height - 24),
    };
  }, [large]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoaded(false);

    loadChatHistory(userHistoryKey)
      .then((storedMessages) => {
        if (cancelled || messagesChangedBeforeLoadRef.current) return;
        setMessages(storedMessages.length ? storedMessages : [createWelcomeMessage(t)]);
      })
      .catch((error) => {
        console.warn("AI chatbot history could not be loaded.", error);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userHistoryKey]);

  useEffect(() => {
    if (!historyLoaded) return;

    saveChatHistory(userHistoryKey, messages).catch((error) => {
      console.warn("AI chatbot history could not be saved.", error);
    });
  }, [historyLoaded, messages, userHistoryKey]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1 || !current[0]?.isWelcome) return current;
      return [createWelcomeMessage(t)];
    });
  }, [i18n.resolvedLanguage, t]);

  useEffect(() => {
    const handleResize = () => {
      setLauncherPosition((position) =>
        clampPosition(position, { width: launcherSize, height: launcherSize })
      );
      setWidgetPosition((position) => clampPosition(position, widgetSize));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [widgetSize]);

  useEffect(() => {
    setWidgetPosition((position) => clampPosition(position, widgetSize));
  }, [widgetSize]);

  useEffect(() => {
    if (!dragState) return undefined;

    const handlePointerMove = (event) => {
      const nextPosition = clampPosition(
        {
          x: dragState.startX + event.clientX - dragState.pointerX,
          y: dragState.startY + event.clientY - dragState.pointerY,
        },
        dragState.size
      );

      if (dragState.type === "launcher") {
        if (
          Math.abs(event.clientX - dragState.pointerX) > 4 ||
          Math.abs(event.clientY - dragState.pointerY) > 4
        ) {
          setLauncherMoved(true);
        }
        setLauncherPosition(nextPosition);
        return;
      }

      setWidgetPosition(nextPosition);
    };

    const handlePointerUp = () => setDragState(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragState]);

  const startDrag = (event, type) => {
    if (event.button !== undefined && event.button !== 0) return;
    const position = type === "launcher" ? launcherPosition : widgetPosition;
    const size = type === "launcher" ? { width: launcherSize, height: launcherSize } : widgetSize;

    setLauncherMoved(false);
    setDragState({
      type,
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: position.x,
      startY: position.y,
      size,
    });
  };

  const handleLauncherClick = () => {
    if (launcherMoved) return;
    setOpen(true);
  };

  const toggleLarge = () => {
    setLarge((current) => !current);
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (!content || sending) return;

    const nextMessages = [...messages, { role: "user", content }];
    messagesChangedBeforeLoadRef.current = true;
    setMessages(nextMessages);
    setDraft("");
    setSending(true);

    try {
      const response = await fetch(CHATBOT_API_URL, {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.role === "user" || message.role === "assistant")
            .map((message) => ({
              role: message.role,
              content: message.content,
            })),
        }),
      });

      if (!response.ok) throw new Error(`Chatbot request failed with ${response.status}`);

      const data = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data?.answer ||
            t("aiChatbot.emptyAnswer", {
              defaultValue: "Sorry, I could not find an answer right now.",
            }),
        },
      ]);
    } catch (error) {
      console.error("AI chatbot failed:", error);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: t("aiChatbot.errorMessage", {
            defaultValue: "Sorry, I could not connect to the AI assistant. Please try again.",
          }),
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleDraftKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onPointerDown={(event) => startDrag(event, "launcher")}
        onClick={handleLauncherClick}
        className="group fixed z-[9990] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-primary text-white shadow-[0_12px_28px_rgba(0,67,104,0.3)] ring-4 ring-white transition hover:bg-primary-dark"
        style={{ left: launcherPosition.x, top: launcherPosition.y, touchAction: "none" }}
        aria-label={t("aiChatbot.open", { defaultValue: "Open AI chatbot" })}
        title={t("aiChatbot.launcherTooltip", { defaultValue: "Ask AI assistant" })}
      >
        <span className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:block group-hover:opacity-100">
          {t("aiChatbot.launcherTooltip", { defaultValue: "Ask AI assistant" })}
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-slate-900" />
        </span>
        <Bot size={26} />
      </button>
    );
  }

  return (
    <section
      className="fixed z-[9990] flex overflow-hidden rounded-xl border border-surface-border bg-white shadow-2xl"
      style={{
        left: widgetPosition.x,
        top: widgetPosition.y,
        width: widgetSize.width,
        height: widgetSize.height,
      }}
      aria-label={t("aiChatbot.title", { defaultValue: "AI Chatbot" })}
    >
      <div className="flex min-h-0 w-full flex-col">
        <header
          className="flex cursor-move items-center justify-between gap-3 border-b border-surface-border bg-primary px-4 py-3 text-white"
          onPointerDown={(event) => startDrag(event, "widget")}
          style={{ touchAction: "none" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15">
              <Bot size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold">
                {t("aiChatbot.title", { defaultValue: "AI Chatbot" })}
              </h2>
              <p className="truncate text-xs text-white/75">
                {t("aiChatbot.subtitle", { defaultValue: "Ask about device setup and support" })}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1" onPointerDown={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={toggleLarge}
              className="grid h-8 w-8 place-items-center rounded-lg text-white transition hover:bg-white/15"
              aria-label={
                large
                  ? t("aiChatbot.makeSmaller", { defaultValue: "Make chatbot smaller" })
                  : t("aiChatbot.makeLarger", { defaultValue: "Make chatbot larger" })
              }
              title={
                large
                  ? t("aiChatbot.makeSmallerShort", { defaultValue: "Make smaller" })
                  : t("aiChatbot.makeLargerShort", { defaultValue: "Make larger" })
              }
            >
              {large ? <Minimize2 size={17} /> : <Expand size={17} />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-white transition hover:bg-white/15"
              aria-label={t("aiChatbot.close", { defaultValue: "Close AI chatbot" })}
              title={t("aiChatbot.closeShort", { defaultValue: "Close" })}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="flex items-center gap-2 border-b border-surface-border bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500">
          <Move size={14} />
          <span>{t("aiChatbot.dragHint", { defaultValue: "Drag the header to move this chat" })}</span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 px-4 py-4">
          {messages.map((message, index) => {
            const fromUser = message.role === "user";

            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex items-end gap-2 ${fromUser ? "justify-end" : "justify-start"}`}
              >
                {!fromUser && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/10 text-primary shadow-sm">
                    <Bot size={16} />
                  </span>
                )}
                <div
                  className={`max-w-[76%] rounded-xl px-3 py-2 text-sm leading-6 shadow-sm ${
                    fromUser
                      ? "bg-primary text-white"
                      : message.error
                        ? "border border-red-100 bg-red-50 text-red-700"
                        : "border border-surface-border bg-white text-slate-700"
                  }`}
                >
                  <ChatMessageContent content={message.content} fromUser={fromUser} t={t} />
                </div>
                {fromUser && (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary text-white shadow-sm">
                    <UserRound size={16} />
                  </span>
                )}
              </div>
            );
          })}

          {sending && (
            <div className="flex items-end justify-start gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-primary/15 bg-primary/10 text-primary shadow-sm">
                <Bot size={16} />
              </span>
              <div className="rounded-xl border border-surface-border bg-white px-3 py-2 text-sm text-slate-500 shadow-sm">
                {t("aiChatbot.thinking", { defaultValue: "Thinking..." })}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <footer className="border-t border-surface-border bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleDraftKeyDown}
              placeholder={t("aiChatbot.placeholder", { defaultValue: "Type your question..." })}
              rows={2}
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-slate-700 outline-none transition hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!draft.trim() || sending}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={t("aiChatbot.sendMessage", { defaultValue: "Send message" })}
              title={t("aiChatbot.sendShort", { defaultValue: "Send" })}
            >
              <Send size={17} />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
