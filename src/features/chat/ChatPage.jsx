import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  ChevronDown,
  Edit2,
  FileUp,
  Filter,
  ImageUp,
  Plus,
  Search,
  Send,
} from "lucide-react";
import Topbar from "../../components/layout/Topbar";
import {
  createTikTokChatSocket,
  fetchChatStores,
  fetchConversationMessages,
  fetchConversations,
  fetchTikTokConversationOrderContext,
  getStoredChatValue,
  setStoredChatValue,
  normalizeConversation,
  normalizeMessage,
  sendConversationReply,
  uploadConversationMedia,
} from "./chatApi";
import {
  setCachedOrderDetailForId,
  setStoredOrderContext,
} from "../orderManagement/shared/utils/orderApi";

const chatT = (t, key, defaultValue, options = {}) =>
  t(`chatPage.${key}`, { defaultValue, ...options });

const CHAT_PAGE_SELECTION_KEY = "chat-page-selection";
let chatPageMemoryCache = null;

const avatars = Array.from(
  { length: 70 },
  (_, index) => `https://i.pravatar.cc/96?img=${index + 1}`
);

const quickMessages = [
  ["Hi", "Hi, Sir how can I help you?"],
  ["Hello", "Good morning! What assistance do you need today?"],
  ["Greetings", "Hello! How may I assist you with your inquiry?"],
  ["Hey", "Hi there! What can I do for you today?"],
  ["Welcome", "Welcome! Let me know how I can support you today."],
];

const quickMessageKeys = [
  ["quickHi", "quickHiText"],
  ["quickHello", "quickHelloText"],
  ["quickGreetings", "quickGreetingsText"],
  ["quickHey", "quickHeyText"],
  ["quickWelcome", "quickWelcomeText"],
];

const settingsIssues = [
  ["Printer head issue", "There have issues on printer head."],
  ["Paper jam error", "A paper jam has occurred inside the printer."],
  ["Low ink warning", "The ink cartridge is running low and needs replacement soon."],
  ["Connectivity problem", "The printer is not connecting to the network properly."],
];

const customerCategories = [
  ["5 Star", "The customer gave our store a 5-star rating."],
  ["4 Star", "The customer rated our service with 4 stars, showing satisfaction."],
  ["3 Star", "The customer provided a 3-star rating, indicating room for improvement."],
  ["2 Star", "The customer gave a 2-star rating, reflecting some dissatisfaction."],
  ["1 Star", "The customer rated us 1 star, expressing significant disappointment."],
  ["No Rating", "The customer chose not to leave a rating for their experience."],
];

const keywords = [
  ["Spam", "Avoid sending repetitive or irrelevant messages during the conversation."],
  ["Personal attacks", "Refrain from using offensive language or insulting others in the chat."],
  ["Sensitive info", "Do not share passwords, credit card numbers, or confidential data."],
];

const trainingQuestions = [
  ["Paper jam", "This printer does not support wireless printing during active jobs."],
  ["Ink smudging", "Avoid printing duplicate or unnecessary pages to save ink and paper."],
  ["Printer errors", "Do not ignore error messages or warnings displayed on the printer screen."],
  ["Confidential documents", "Do not print sensitive information without proper authorization."],
  ["Slow printing speed", "Check if the printer is set to draft mode or high quality, and adjust accordingly."],
  ["Connectivity issues", "Restart your router and printer to re-establish a stable network connection."],
  ["Low toner warning", "Replace the toner cartridge promptly to maintain print quality."],
  ["Scanner not detected", "Verify the scanner drivers are installed and the USB cable is securely connected."],
];

const settingsRowKeys = {
  "Printer head issue": ["printerHeadIssue", "printerHeadIssueText"],
  "Paper jam error": ["paperJamError", "paperJamErrorText"],
  "Low ink warning": ["lowInkWarning", "lowInkWarningText"],
  "Connectivity problem": ["connectivityProblem", "connectivityProblemText"],
  "5 Star": ["fiveStar", "fiveStarText"],
  "4 Star": ["fourStar", "fourStarText"],
  "3 Star": ["threeStar", "threeStarText"],
  "2 Star": ["twoStar", "twoStarText"],
  "1 Star": ["oneStar", "oneStarText"],
  "No Rating": ["noRating", "noRatingText"],
  Spam: ["spam", "spamText"],
  "Personal attacks": ["personalAttacks", "personalAttacksText"],
  "Sensitive info": ["sensitiveInfo", "sensitiveInfoText"],
  "Paper jam": ["paperJam", "trainingPaperJamText"],
  "Ink smudging": ["inkSmudging", "trainingInkSmudgingText"],
  "Printer errors": ["printerErrors", "trainingPrinterErrorsText"],
  "Confidential documents": ["confidentialDocuments", "trainingConfidentialDocumentsText"],
  "Slow printing speed": ["slowPrintingSpeed", "trainingSlowPrintingSpeedText"],
  "Connectivity issues": ["connectivityIssues", "trainingConnectivityIssuesText"],
  "Low toner warning": ["lowTonerWarning", "trainingLowTonerWarningText"],
  "Scanner not detected": ["scannerNotDetected", "trainingScannerNotDetectedText"],
};

function customerTime(t, customer) {
  if (customer?.updatedAt || customer?.createdAt) {
    const timestamp = new Date(customer.updatedAt || customer.createdAt).getTime();
    if (Number.isFinite(timestamp)) {
      const elapsedMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
      if (elapsedMinutes < 60) return chatT(t, "time.minutesAgo", "{{count}} minutes ago", { count: elapsedMinutes });
      const elapsedHours = Math.floor(elapsedMinutes / 60);
      if (elapsedHours < 24) return chatT(t, "time.hoursAgo", "{{count}} hours ago", { count: elapsedHours });
      return new Date(timestamp).toLocaleDateString();
    }
  }
  return chatT(t, `time.${customer.timeKey}`, customer.timeKey, { count: customer.timeCount });
}

function SelectBox({ label, options, value, onChange, disabled = false }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[11px] font-medium text-slate-700">{label}</span>
      <span className="relative block">
        <select value={value} onChange={onChange} disabled={disabled} className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs text-slate-500 outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-slate-50">
          {options.map((option) => {
            const item = typeof option === "string" ? { label: option, value: option } : option;
            return <option key={item.value} value={item.value} disabled={item.disabled}>{item.label}</option>;
          })}
        </select>
        <ChevronDown size={13} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </span>
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="min-w-0 text-center">
      <p className="mb-3 truncate text-[11px] text-slate-700">{label}</p>
      <p className="text-lg font-bold text-slate-600">{value}</p>
    </div>
  );
}

const HIDDEN_TEST_CHAT_MESSAGE = "test customer service conversation created";

function normalizeChatText(value) {
  return String(value || "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isHiddenTestChatMessage(messageOrText) {
  const rawText =
    typeof messageOrText === "object" && messageOrText !== null
      ? messageOrText.message
      : messageOrText;

  return normalizeChatText(rawText) === HIDDEN_TEST_CHAT_MESSAGE;
}

function isAwaitingSellerResponse(conversation) {
  if (isHiddenTestChatMessage(conversation?.lastMessage)) return false;
  return String(conversation?.lastMessageDirection || "").toUpperCase() === "INCOMING";
}

function isSellerResponse(conversation) {
  return String(conversation?.lastMessageDirection || "").toUpperCase() === "OUTGOING";
}

function formatResponseDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function Avatar({ src, online = true, size = "h-9 w-9" }) {
  return (
    <span className={`relative inline-flex ${size} flex-shrink-0`}>
      <img src={src} alt="" className="h-full w-full rounded-full object-cover ring-1 ring-slate-200" />
      {online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500" />}
    </span>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 px-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      {children}
    </div>
  );
}

function AddQuickMessageModal({ onClose, t }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl">
        <h2 className="text-center text-xl font-bold text-slate-800">{chatT(t, "addQuickMessage", "Add Quick Message")}</h2>
        <p className="mx-auto mt-2 max-w-xs text-center text-xs text-slate-500">
          {chatT(t, "quickMessageHelp", "Create a quick message for faster replies. Type your message and press Enter to send it instantly.")}
        </p>
        <label className="mt-7 block text-xs font-semibold text-slate-700">{chatT(t, "enterQuickMessage", "Enter Quick Message")}</label>
        <input className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary" placeholder={chatT(t, "quickMessageHello", "Hello")} />
        <label className="mt-5 block text-xs font-semibold text-slate-700">{chatT(t, "enterFullMessage", "Enter Full Message")}</label>
        <input className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary" placeholder={chatT(t, "fullMessagePlaceholder", "Hello boss, How can I you?")} />
        <div className="mt-7 grid grid-cols-2 gap-4">
          <button onClick={onClose} className="h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">{chatT(t, "cancel", "Cancel")}</button>
          <button onClick={onClose} className="h-11 rounded-lg bg-primary text-sm font-semibold text-white">{chatT(t, "save", "Save")}</button>
        </div>
      </div>
    </Modal>
  );
}

function MarkCustomerModal({ customer, onClose, t }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl">
        <h2 className="text-center text-xl font-bold text-slate-800">{chatT(t, "markCustomer", "Mark the customer")}</h2>
        <p className="mt-2 text-center text-xs text-slate-500">{chatT(t, "markCustomerHelp", "Mark the customer to Prioritize easily")}</p>
        <div className="mt-7">
          <p className="mb-2 text-xs font-semibold text-slate-700">{chatT(t, "customerName", "Customer Name")}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={customer.avatar} />
              <span className="text-sm font-bold text-slate-800">{customer.name}</span>
            </div>
            <Edit2 size={15} className="text-slate-400" />
          </div>
        </div>
        <SelectBox label={chatT(t, "selectCustomerCategory", "Select Customer's Category")} options={[
          chatT(t, "badReview", "Bad Review"),
          chatT(t, "fiveStar", "5 Star"),
          chatT(t, "fourStar", "4 Star"),
          chatT(t, "noRating", "No Rating"),
        ]} />
        <div className="mt-5">
          <SelectBox label={chatT(t, "selectIssue", "Select Issue")} options={[
            chatT(t, "printheadIssue", "Printhead Issue"),
            chatT(t, "paperJam", "Paper Jam"),
            chatT(t, "connectivity", "Connectivity"),
            chatT(t, "lowInk", "Low Ink"),
          ]} />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4">
          <button onClick={onClose} className="h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">{chatT(t, "cancel", "Cancel")}</button>
          <button onClick={onClose} className="h-11 rounded-lg bg-primary text-sm font-semibold text-white">{chatT(t, "save", "Save")}</button>
        </div>
      </div>
    </Modal>
  );
}

function TransferModal({ onClose, t }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-7 shadow-2xl">
        <h2 className="text-center text-xl font-bold text-slate-800">{chatT(t, "transferCustomer", "Transfer Customer")}</h2>
        <p className="mt-2 text-center text-xs text-slate-500">{chatT(t, "transferCustomerHelp", "Select a support team to transfer the customers")}</p>
        <div className="mt-7 space-y-4 text-sm font-semibold text-slate-700">
          <label className="flex items-center gap-3"><input type="radio" name="team" /> {chatT(t, "preSaleSupport", "Pre Sale Support")}</label>
          <label className="flex items-center gap-3"><input type="radio" name="team" /> {chatT(t, "afterSaleSupport", "After Sale Support")}</label>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4">
          <button onClick={onClose} className="h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">{chatT(t, "cancel", "Cancel")}</button>
          <button onClick={onClose} className="h-11 rounded-lg bg-primary text-sm font-semibold text-white">{chatT(t, "transfer", "Transfer")}</button>
        </div>
      </div>
    </Modal>
  );
}

function ChatHistory({ conversations, selected, onSelect, unreadCounts, setShowTransfer, setShowMark, loading, error, t }) {
  const [bulkMode, setBulkMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const visibleConversations = conversations.filter((conversation) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return [conversation.customerName, conversation.conversationId, conversation.lastMessage, conversation.subject]
      .some((value) => String(value || "").toLowerCase().includes(needle));
  });
  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-800">{chatT(t, "chatHistory", "Chat History")}</h2>
      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 w-full rounded-lg border border-slate-100 bg-white pl-9 text-xs outline-none" placeholder={chatT(t, "search", "Search")} />
        </div>
        <button onClick={() => setFiltersOpen((value) => !value)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <Filter size={16} />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
        {[
          chatT(t, "all", "All"),
          chatT(t, "unread", "Unread"),
          chatT(t, "starred", "Starred"),
          chatT(t, "notResponded", "Not Responded"),
        ].map((tab, index) => (
          <button key={tab} className={`h-8 rounded-full px-4 ${index === 0 ? "bg-primary font-semibold text-white" : ""}`}>{tab}</button>
        ))}
      </div>
      {filtersOpen && (
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white p-2 shadow-lg ring-1 ring-slate-100">
          <SelectBox label={chatT(t, "selectTime", "Select Time")} options={[chatT(t, "today", "Today"), chatT(t, "week", "Week"), chatT(t, "month", "Month")]} />
          <SelectBox label={chatT(t, "customerCategory", "Customer Category")} options={[chatT(t, "goodReview", "Good Review"), chatT(t, "badReview", "Bad Review")]} />
          <SelectBox label={chatT(t, "issueCategory", "Issue Category")} options={[chatT(t, "printHead", "Print head"), chatT(t, "paperJam", "Paper Jam")]} />
        </div>
      )}
      {bulkMode && (
        <label className="mt-3 flex items-center gap-2 text-xs text-primary">
          <input type="checkbox" defaultChecked /> {chatT(t, "selectAll", "Select All")}
        </label>
      )}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        {loading && <p className="px-2 py-3 text-xs text-slate-400">{chatT(t, "loadingConversations", "Loading conversations...")}</p>}
        {!loading && error && <p className="px-2 py-3 text-xs text-rose-500">{error}</p>}
        {!loading && !error && visibleConversations.length === 0 && (
          <p className="px-2 py-3 text-xs text-slate-400">{chatT(t, "noConversations", "No conversations found")}</p>
        )}
        {visibleConversations.map((customer) => {
          const unreadCount = Number(unreadCounts?.[customer.conversationId] || 0);
          return (
            <button
              key={customer.conversationId}
              onClick={() => onSelect(customer)}
              className={`mb-2 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left ${selected?.conversationId === customer.conversationId ? "bg-slate-100" : "hover:bg-slate-50"}`}
            >
              {bulkMode && <input type="checkbox" defaultChecked className="accent-primary" onClick={(event) => event.stopPropagation()} />}
              <Avatar src={customer.avatar} online={customer.active} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-slate-800">{customer.customerName}</span>
                <span className="block truncate text-[11px] text-slate-400">{chatT(t, "lastConnect", "Last connect {{time}}", { time: customerTime(t, customer) })}</span>
              </span>
              {unreadCount > 0 && (
                <span
                  className="inline-flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold leading-none text-white"
                  title={`${unreadCount} unread message${unreadCount === 1 ? "" : "s"}`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <Edit2 size={15} onClick={(event) => { event.stopPropagation(); setShowMark(customer); }} className="text-slate-400" />
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-end">
        {bulkMode ? (
          <button onClick={() => setShowTransfer(true)} className="flex h-9 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white">
            {chatT(t, "transfer", "Transfer")} <Send size={14} />
          </button>
        ) : (
          <button onClick={() => setBulkMode(true)} className="text-xs font-semibold text-primary">{chatT(t, "selectCustomers", "Select customers")}</button>
        )}
      </div>
    </section>
  );
}

function formatMessageTime(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function isGeneratedMediaMessage(value) {
  return ["image media", "video media", "image and video media"].includes(String(value || "").trim().toLowerCase());
}

function ChatImageAttachment({ src }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-center text-[11px] text-slate-500">
        Image uploaded · preview unavailable
      </div>
    );
  }
  return <img src={src} alt="Chat attachment" onError={() => setFailed(true)} className="max-h-52 max-w-full rounded-lg object-contain" />;
}

function ChatVideoAttachment({ src }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-center text-[11px] text-slate-500">
        Video uploaded · preview unavailable
      </div>
    );
  }
  return <video src={src} controls onError={() => setFailed(true)} className="max-h-52 max-w-full rounded-lg" />;
}

function extractOrderId(value) {
  const match = String(value || "").match(/\border\s*id\s*:\s*([A-Za-z0-9_-]+)/i);
  return match?.[1] || "";
}

function LinkedOrderMessage({ orderId, commerceContext, commerceLoading, commerceError, onViewOrder }) {
  const isActiveOrder = String(commerceContext?.orderId || "") === String(orderId);
  const order = isActiveOrder ? commerceContext?.order : null;
  const rawOrder = order?.raw || {};
  const firstItem = order?.items?.[0] || null;
  const status = rawOrder.status || order?.rawStatus || order?.status;

  if (commerceLoading && !order) {
    return (
      <div className="w-80 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4 text-left shadow-sm">
        <p className="text-xs font-bold text-primary">Customer shared an order</p>
        <p className="mt-2 text-xs text-slate-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-80 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left shadow-sm">
        <p className="text-xs font-bold text-slate-700">Customer shared an order</p>
        <p className="mt-2 text-xs text-slate-500">{commerceError || "Order details are unavailable."}</p>
      </div>
    );
  }

  return (
    <div className="w-80 overflow-hidden rounded-xl border border-blue-100 bg-white text-left shadow-sm">
      <div className="flex items-start justify-between gap-3 bg-blue-50 px-4 py-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Customer shared an order</p>
          <p className="mt-1 text-xs font-semibold text-slate-700">Order #{order.orderNo}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${commerceStatusClass(status)}`}>{status || "Order"}</span>
      </div>
      {firstItem && (
        <div className="flex gap-3 border-b border-slate-100 p-3">
          <img src={firstItem.image} alt={firstItem.name || "Order product"} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-700">{firstItem.name}</p>
            <p className="mt-1 text-[10px] text-slate-400">SKU: {firstItem.sku} · Qty: {firstItem.quantity}</p>
          </div>
        </div>
      )}
      <div className="space-y-2 px-4 py-3">
        <DetailRow label="Total" value={order.payment?.orderValue || order.price} />
        <DetailRow label="Shipping" value={rawOrder.shippingProvider || rawOrder.lineItems?.[0]?.shippingProviderName || order.logistics?.logisticsName} />
        <DetailRow label="Tracking" value={rawOrder.trackingNumber || rawOrder.lineItems?.[0]?.trackingNumber || order.trackingNo} />
        <button type="button" onClick={() => onViewOrder(order)} className="mt-1 w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">View Order Details</button>
      </div>
    </div>
  );
}

function Conversation({ selected, messages, loading, error, onSend, onUpload, sending, commerceContexts, onViewOrder, t }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const renderedMessageIdsRef = useRef(new Set());

  const visibleMessages = messages.filter(
    (message) => !isHiddenTestChatMessage(message)
  );

  useEffect(() => {
    const nextMessageIds = new Set(messages.map((message) => String(message.id)));
    const hasNewMessage = messages.some(
      (message) => !renderedMessageIdsRef.current.has(String(message.id))
    );
    renderedMessageIdsRef.current = nextMessageIds;

    if (hasNewMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  const submitReply = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    const sent = await onSend(message);
    if (sent) setDraft("");
  };

  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setUploadOpen(false);
    if (file) {
      await onUpload(file);
    }
  };

  if (!selected) {
    return (
      <section className="flex h-full min-h-0 items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="mx-auto grid h-48 w-64 grid-cols-2 place-items-center gap-3">
            <div className="h-24 w-32 rounded-lg border border-primary/60 bg-blue-50" />
            <div className="mt-16 h-24 w-32 rounded-lg border border-primary/60 bg-blue-50" />
            <div className="-mt-14 h-24 w-32 rounded-lg border border-primary/60 bg-blue-50" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-sky-900/40">{chatT(t, "noSelectedMessage", "No Selected Customer Message Found")}</h2>
        </div>
      </section>
    );
  }
  return (
    <section className="relative flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={selected.avatar} />
          <div>
            <h2 className="font-bold text-slate-800">{selected.customerName}</h2>
            <p className="text-[11px] text-slate-400">{chatT(t, "lastConnect", "Last connect {{time}}", { time: customerTime(t, selected) })}</p>
          </div>
        </div>
      </div>
      <div className="mt-7 flex-1 space-y-8 overflow-y-auto pr-2">
        {loading && <p className="text-center text-xs text-slate-400">{chatT(t, "loadingMessages", "Loading messages...")}</p>}
        {!loading && visibleMessages.length === 0 && <p className="text-center text-xs text-slate-400">{chatT(t, "noMessages", "No messages found")}</p>}
        {visibleMessages.map((message) => {
          const messageOrderId = message.incoming ? extractOrderId(message.message) : "";
          const messageCommerceContext = messageOrderId
            ? commerceContexts.find((context) => String(context.orderId) === String(messageOrderId))
            : null;
          return (
            <div key={message.id} className={message.incoming ? `flex items-start gap-3 ${messageOrderId ? "max-w-md" : "max-w-xs"}` : `ml-auto text-right ${messageOrderId ? "max-w-md" : "max-w-xs"}`}>
              {message.incoming && <Avatar src={selected.avatar} size="h-8 w-8" />}
              <div className={message.incoming ? "" : "ml-auto"}>
                <p className="mb-1 text-[11px] text-slate-400">{formatMessageTime(message.createdAt)}</p>
                {messageOrderId ? (
                  <LinkedOrderMessage
                    orderId={messageOrderId}
                    commerceContext={messageCommerceContext}
                    commerceLoading={messageCommerceContext?.loading}
                    commerceError={messageCommerceContext?.error}
                    onViewOrder={onViewOrder}
                  />
                ) : (
                  <div className="space-y-2 rounded-xl bg-slate-100 px-4 py-3 text-left text-xs text-slate-700">
                    {message.message && !isGeneratedMediaMessage(message.message) && <p>{message.message}</p>}
                    {message.imageUrl && <ChatImageAttachment src={message.imageUrl} />}
                    {message.videoUrl && <ChatVideoAttachment src={message.videoUrl} />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      <div className="relative mt-4 flex h-11 items-center rounded-full bg-slate-100 pl-3 pr-2">
        {uploadOpen && (
          <div className="absolute bottom-12 left-1 rounded-lg bg-slate-500 p-2 text-xs text-white shadow-lg">
            <button onClick={() => imageInputRef.current?.click()} className="flex w-28 items-center gap-2 rounded px-2 py-1 hover:bg-white/10"><ImageUp size={13} /> {chatT(t, "uploadImage", "Upload Image")}</button>
            <button onClick={() => videoInputRef.current?.click()} className="flex w-28 items-center gap-2 rounded px-2 py-1 hover:bg-white/10"><FileUp size={13} /> {chatT(t, "uploadVideo", "Upload Video")}</button>
          </div>
        )}
        <input ref={imageInputRef} type="file" accept="image/*" onChange={uploadFile} className="hidden" />
        <input ref={videoInputRef} type="file" accept="video/*" onChange={uploadFile} className="hidden" />
        <button onClick={() => setUploadOpen((value) => !value)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600"><Plus size={18} /></button>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitReply(); } }} disabled={sending} className="min-w-0 flex-1 bg-transparent px-3 text-xs outline-none" placeholder={chatT(t, "messagePlaceholder", "You can solve this problem with")} />
        <button onClick={submitReply} disabled={!draft.trim() || sending} className="flex h-8 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white disabled:opacity-50">{sending ? chatT(t, "sending", "Sending...") : chatT(t, "send", "Send")} <Send size={15} /></button>
      </div>
    </section>
  );
}

function formatCommerceDate(value) {
  if (!value || value === "-") return "-";
  const numeric = Number(value);
  const date = Number.isFinite(numeric)
    ? new Date(numeric > 9999999999 ? numeric : numeric * 1000)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-slate-700">{value || "-"}</span>
    </div>
  );
}

function commerceStatusClass(status) {
  const value = String(status || "").toUpperCase();
  if (value.includes("DELIVER") || value.includes("COMPLETE") || value.includes("REFUND")) return "bg-emerald-50 text-emerald-700";
  if (value.includes("CANCEL") || value.includes("REJECT") || value.includes("FAIL")) return "bg-rose-50 text-rose-700";
  if (value.includes("SHIP") || value.includes("TRANSIT") || value.includes("COLLECTION")) return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

function CommerceOrderDetails({ context, onViewOrder, onViewReturn }) {
  const order = context?.order || null;
  const rawOrder = order?.raw || {};
  const firstReturn = context?.returns?.[0] || null;
  const orderStatus = rawOrder.status || order?.rawStatus || order?.status;
  const deliveryStatus = rawOrder.deliveryTime
    ? "Delivered"
    : rawOrder.rtsTime
      ? "Shipped"
      : rawOrder.collectionTime
        ? "Collected"
        : orderStatus || "-";

  return (
    <div className="rounded-xl border border-slate-100 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Linked order</p>
          <p className="mt-1 break-all text-xs font-semibold text-slate-700">#{context.orderId}</p>
        </div>
        {orderStatus && <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${commerceStatusClass(orderStatus)}`}>{orderStatus}</span>}
      </div>

      {context.loading && <p className="mt-3 text-xs text-slate-400">Loading order, shipment, and return details...</p>}
      {!context.loading && context.error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{context.error}</p>}
      {!context.loading && !context.error && !order && <p className="mt-3 text-xs text-slate-400">No TikTok order was found for this order ID.</p>}

      {order && (
        <div className="mt-4 space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Order context</p>
            <DetailRow label="Order number" value={order.orderNo} />
            <DetailRow label="TikTok store" value={order.storeName} />
            <DetailRow label="Order status" value={orderStatus} />
            <DetailRow label="Payment / total" value={order.payment?.orderValue || order.price} />
            <DetailRow label="Created" value={order.createdAt || formatCommerceDate(rawOrder.createTime)} />
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Products</p>
            {(order.items || []).map((item) => (
              <div key={item.id} className="flex gap-3 rounded-lg bg-slate-50 p-2.5">
                <img src={item.image} alt={item.name || "Product"} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 text-xs">
                  <p className="line-clamp-2 font-semibold text-slate-700">{item.name}</p>
                  <p className="mt-1 text-slate-400">SKU: {item.sku}</p>
                  <p className="text-slate-400">{item.currency} {item.unitPrice} × {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Fulfillment & shipment</p>
            <DetailRow label="Fulfillment status" value={rawOrder.fulfillmentStatus || rawOrder.fulfillmentType} />
            <DetailRow label="Shipping provider" value={rawOrder.shippingProvider || rawOrder.lineItems?.[0]?.shippingProviderName || order.logistics?.logisticsName} />
            <DetailRow label="Tracking number" value={rawOrder.trackingNumber || rawOrder.lineItems?.[0]?.trackingNumber || order.trackingNo} />
            <DetailRow label="Shipping deadline" value={formatCommerceDate(rawOrder.shippingDueTime)} />
            <DetailRow label="Shipped / delivered status" value={deliveryStatus} />
            <DetailRow label={rawOrder.deliveryTime ? "Delivered" : "Estimated delivery"} value={formatCommerceDate(rawOrder.deliveryTime || rawOrder.deliveryDueTime || order.logistics?.estimatedDeliveryTime)} />
          </div>

          <button type="button" onClick={() => onViewOrder(order)} className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white">View Order Details</button>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">After-sales</p>
            {context.returnError && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">{context.returnError}</p>}
            {!context.returnError && !firstReturn && <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-slate-500">No return or refund request</p>}
            {firstReturn && (
              <>
                <DetailRow label="Return ID" value={firstReturn.returnId || firstReturn.id} />
                <DetailRow label="Return / refund type" value={firstReturn.returnType} />
                <DetailRow label="Platform status" value={firstReturn.platformStatus} />
                <DetailRow label="Refund amount" value={firstReturn.refundAmount ? `${firstReturn.refundCurrency || ""} ${firstReturn.refundAmount}`.trim() : "-"} />
                <DetailRow label="Return tracking" value={firstReturn.trackingNumber} />
                <button type="button" onClick={() => onViewReturn(firstReturn)} disabled={!firstReturn.id} className="w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary disabled:opacity-40">View Return Details</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RightPanel({
  setShowQuickModal,
  selected,
  onSend,
  sending,
  commerceContexts,
  onViewOrder,
  onViewReturn,
  t,
}) {
  const [reply, setReply] = useState("");
  const submitReply = async () => {
    const text = reply.trim();
    if (!text || !selected || sending) return;
    const sent = await onSend(text);
    if (sent) setReply("");
  };

  return (
  <aside className="flex h-full min-h-0 flex-col gap-5">
    {/* Order Details */}
    <section className="flex max-h-[52%] min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="text-lg font-bold text-slate-800">
          {chatT(t, "orderDetails", "Order Details")}
        </h2>

        {commerceContexts.length > 0 && (
          <p className="mt-1 text-[10px] text-slate-400">
            {commerceContexts.length} linked{" "}
            {commerceContexts.length === 1 ? "order" : "orders"} in this
            conversation
          </p>
        )}
      </div>

      <div className="mt-4 min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        {!selected && (
          <p className="text-xs text-slate-400">
            Select a conversation to view commerce information.
          </p>
        )}

        {selected && commerceContexts.length === 0 && (
          <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-500">
            No order is linked to this conversation. The customer can send{" "}
            <span className="font-semibold">orderId :123456</span>.
          </p>
        )}

        {[...commerceContexts].reverse().map((context) => (
          <CommerceOrderDetails
            key={context.orderId}
            context={context}
            onViewOrder={onViewOrder}
            onViewReturn={onViewReturn}
          />
        ))}
      </div>
    </section>

    {/* Quick Messages */}
    <section className="flex min-h-[320px] flex-1 flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">
          {chatT(t, "quickMessages", "Quick Messages")}
        </h2>

        <button onClick={() => setShowQuickModal(true)}>
          <Plus size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {/* Saved Replies */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {chatT(t, "savedReplies", "Saved Replies")}
        </p>

        <div className="space-y-4">
          {quickMessages.map(([title, text], index) => {
            const [titleKey, textKey] = quickMessageKeys[index] || [];

            return (
              <button
                key={title}
                onClick={() => setReply(chatT(t, textKey, text))}
                className="flex w-full items-start justify-between gap-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800">
                    {chatT(t, titleKey, title)}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {chatT(t, textKey, text)}
                  </p>
                </div>

                <Edit2
                  size={15}
                  className="mt-1 flex-shrink-0 text-slate-400"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Reply Input */}
      <div className="mt-4 flex shrink-0 items-center gap-2 border-t border-slate-100 pt-4">
        <input
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submitReply();
            }
          }}
          disabled={!selected || sending}
          className="h-9 min-w-0 flex-1 rounded-full border border-slate-200 px-3 text-xs outline-none focus:border-primary disabled:bg-slate-50"
          placeholder={chatT(t, "sellerReply", "Seller reply...")}
        />

        <button
          onClick={submitReply}
          disabled={!selected || !reply.trim() || sending}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
          title={chatT(t, "send", "Send")}
        >
          <Send size={14} />
        </button>
      </div>
    </section>
  </aside>
);
}

function SettingsView({ onBack, t }) {
  const [tab, setTab] = useState("general");
  const rows = tab === "general" ? settingsIssues : customerCategories;
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F7F7F7] p-2">
      <Topbar PageTitle={chatT(t, "settings", "Settings")} />
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">{chatT(t, "settings", "Settings")}</h1>
          <button onClick={onBack} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">{chatT(t, "backToChat", "Back to Chat")}</button>
        </div>
        <div className="mb-5 flex gap-4 text-sm">
          {[
            ["general", chatT(t, "generalSettings", "General Settings")],
            ["time", chatT(t, "timeManagement", "Time Management")],
            ["ai", chatT(t, "trainAiAssistant", "Train AI Assistant")],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`rounded-lg px-4 py-2 ${tab === key ? "bg-blue-50 font-semibold text-primary" : "text-slate-500"}`}>{label}</button>
          ))}
        </div>
        {tab === "time" ? (
          <div className="space-y-6">
            <section className="rounded-xl bg-white p-6">
              <h2 className="font-bold text-slate-800">{chatT(t, "storeTimeManagement", "Store Time Management")}</h2>
              <div className="mt-6 space-y-5 text-sm text-slate-700">
                <div className="flex justify-between"><span>{chatT(t, "storeOpeningTime", "Store Opening time")}</span><span className="rounded-lg border px-3 py-1 text-xs">07 : 00 am</span></div>
                <div className="flex justify-between"><span>{chatT(t, "storeClosingTime", "Store closing time")}</span><span className="rounded-lg border px-3 py-1 text-xs">07 : 00 am</span></div>
              </div>
            </section>
            <section className="rounded-xl bg-white p-6">
              <h2 className="font-bold text-slate-800">{chatT(t, "responseTimeManagement", "Response Time Management")}</h2>
              <div className="mt-6 space-y-5 text-sm text-slate-700">
                <div className="flex justify-between"><span>{chatT(t, "minimumResponseTime", "Minimum Response time")}</span><span className="rounded-lg border px-3 py-1 text-xs">03 min</span></div>
                <div className="flex justify-between"><span>{chatT(t, "setAutoTransferTime", "Set Auto transfer time")}</span><span className="rounded-lg border px-3 py-1 text-xs">02 min</span></div>
              </div>
            </section>
          </div>
        ) : tab === "ai" ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl bg-white p-8">
              <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-slate-200">
                <Bot size={30} className="text-primary" />
                <h2 className="mt-4 text-xl font-bold text-slate-800">{chatT(t, "chooseFile", "Choose a file or drag & drop it here")}</h2>
                <p className="mt-2 text-xs text-slate-400">{chatT(t, "fileTypes", "Pdf, Doc or Docx, less then 5MB")}</p>
                <button className="mt-5 h-10 w-full max-w-sm rounded-lg border text-sm">{chatT(t, "browseFile", "Browse File")}</button>
              </div>
              <div className="mt-6 rounded-xl border border-slate-200 p-5">
                <h2 className="font-bold">{chatT(t, "addQuestionAnswers", "Add Question and Answers")}</h2>
                <input className="mt-4 h-9 w-full rounded border px-3 text-sm" placeholder={chatT(t, "addQuestionPlaceholder", "Add question here")} />
                <textarea className="mt-4 h-28 w-full rounded border px-3 py-2 text-sm" placeholder={chatT(t, "addAnswerPlaceholder", "Add answer here")} />
                <div className="mt-4 flex justify-end gap-4">
                  <button className="h-10 w-32 rounded-full border">{chatT(t, "reset", "Reset")}</button>
                  <button className="h-10 w-32 rounded-full bg-primary text-white">{chatT(t, "save", "Save")}</button>
                </div>
              </div>
            </section>
            <section className="rounded-xl bg-white p-6">
              <h2 className="mb-5 font-bold">{chatT(t, "addedQuestionAnswers", "Added Question and Answers")}</h2>
              <div className="space-y-5">
                {trainingQuestions.map(([title, text]) => {
                  const [titleKey, textKey] = settingsRowKeys[title] || [];
                  return (
                    <div key={title} className="flex justify-between gap-4">
                      <div><p className="font-semibold text-slate-800">{chatT(t, titleKey, title)}</p><p className="mt-1 text-xs text-slate-500">{chatT(t, textKey, text)}</p></div>
                      <Edit2 size={15} className="text-slate-400" />
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <SettingsCard title={chatT(t, "categorizedAllIssues", "Categorized all issues")} rows={rows} t={t} />
            <SettingsCard title={chatT(t, "addCustomerCategory", "Add Customer Category")} rows={customerCategories} t={t} />
            <SettingsCard title={chatT(t, "addViolenceKeywords", "Add Violence Keywords")} rows={keywords} t={t} />
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsCard({ title, rows, t }) {
  return (
    <section className="rounded-xl bg-white p-6">
      <div className="mb-5 flex justify-between">
        <h2 className="font-bold text-slate-800">{title}</h2>
        <Plus size={18} />
      </div>
      <div className="space-y-5">
        {rows.map(([label, text]) => {
          const [labelKey, textKey] = settingsRowKeys[label] || [];
          return (
            <div key={`${title}-${label}`} className="flex justify-between gap-4">
              <div><p className="font-semibold text-slate-800">{chatT(t, labelKey, label)}</p><p className="mt-1 text-xs text-slate-500">{chatT(t, textKey, text)}</p></div>
              <Edit2 size={15} className="text-slate-400" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function decorateConversation(conversation, index = 0) {
  const conversationId = String(conversation.conversationId || conversation.id || "");
  const avatarIndex = conversationId
    ? [...conversationId].reduce((total, character) => total + character.charCodeAt(0), 0) % avatars.length
    : index % avatars.length;
  return {
    ...conversation,
    name: conversation.customerName,
    avatar: conversation.avatar || avatars[avatarIndex],
    active: true,
  };
}

function sameChatStore(left, right) {
  return Boolean(left && right && String(left.openId) === String(right.openId) && String(left.cipher) === String(right.cipher));
}

function mergeMessages(current, additions) {
  const byId = new Map(
    current
      .filter((message) => !isHiddenTestChatMessage(message))
      .map((message) => [String(message.id), message])
  );

  additions.forEach((message) => {
    if (isHiddenTestChatMessage(message)) return;

    const existing = byId.get(String(message.id));
    byId.set(String(message.id), {
      ...message,
      imageUrl: existing?.imageUrl?.startsWith("blob:") ? existing.imageUrl : message.imageUrl,
      videoUrl: existing?.videoUrl?.startsWith("blob:") ? existing.videoUrl : message.videoUrl,
    });
  });

  return [...byId.values()]
    .filter((message) => !isHiddenTestChatMessage(message))
    .sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
}

function extractOrderIds(messages = []) {
  const seen = new Set();
  return messages.reduce((orderIds, message) => {
    const orderId = message.incoming ? extractOrderId(message.message) : "";
    if (orderId && !seen.has(orderId)) {
      seen.add(orderId);
      orderIds.push(orderId);
    }
    return orderIds;
  }, []);
}

export default function ChatPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Restore the last rendered Chat page immediately when React mounts this route again.
  // Full chat data stays in memory; only the small selected IDs are persisted in localStorage.
  const initialStateRef = useRef(null);
  if (initialStateRef.current === null) {
    initialStateRef.current = {
      cache: chatPageMemoryCache,
      selection: getStoredChatValue(CHAT_PAGE_SELECTION_KEY, {}),
    };
  }

  const initialCache = initialStateRef.current.cache || {};
  const initialSelection = initialStateRef.current.selection || {};
  const initialSelectedStoreId = initialCache.selectedStoreId || initialSelection.selectedStoreId || "";
  const initialSelectedConversationId =
    initialCache.selectedCustomer?.conversationId ||
    initialSelection.selectedConversationId ||
    "";

  const [stores, setStores] = useState(() => initialCache.stores || []);
  const [selectedStoreId, setSelectedStoreId] = useState(() => initialSelectedStoreId);
  const [conversations, setConversations] = useState(() => initialCache.conversations || []);
  const [selectedCustomer, setSelectedCustomer] = useState(() => initialCache.selectedCustomer || null);
  const [messages, setMessages] = useState(() => initialCache.messages || []);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [messageError, setMessageError] = useState("");
  const [sending, setSending] = useState(false);
  const [quickModal, setQuickModal] = useState(false);
  const [markCustomer, setMarkCustomer] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [settingsView, setSettingsView] = useState(false);
  const [commerceContexts, setCommerceContexts] = useState(() => initialCache.commerceContexts || []);
  const [unreadCounts, setUnreadCounts] = useState(() => initialCache.unreadCounts || {});
  const [totalResponseSeconds, setTotalResponseSeconds] = useState(
    () => Number(initialCache.totalResponseSeconds || 0)
  );

  const selectedStore = useMemo(
    () => stores.find((store) => store.id === selectedStoreId) || null,
    [selectedStoreId, stores]
  );
  const selectedStoreKey = selectedStore
    ? `${selectedStore.id}::${selectedStore.openId || ""}::${selectedStore.cipher || ""}`
    : "";

  const selectedStoreRef = useRef(selectedStore);
  const selectedCustomerRef = useRef(selectedCustomer);
  const conversationsRef = useRef(initialCache.conversations || []);
  const messagesRef = useRef(initialCache.messages || []);
  const commerceContextsRef = useRef(initialCache.commerceContexts || []);
  const restoredSnapshotRef = useRef(Boolean(initialStateRef.current.cache));
  const restoredStoreIdRef = useRef(initialSelectedStoreId);
  const restoredConversationIdRef = useRef(initialSelectedConversationId);
  const activeDataStoreIdRef = useRef(initialCache.selectedStoreId || "");
  const preferredConversationIdRef = useRef(initialSelectedConversationId);
  const avatarAssignmentsRef = useRef(new Map(initialCache.avatarAssignments || []));
  const pendingResponseStartedAtRef = useRef(new Map(initialCache.pendingResponseStartedAt || []));
  const countedResponseIdsRef = useRef(new Set(initialCache.countedResponseIds || []));
  const selectedConversationId = selectedCustomer?.conversationId || "";
  const linkedOrderIdsKey = useMemo(() => JSON.stringify(extractOrderIds(messages)), [messages]);

  useEffect(() => {
    selectedStoreRef.current = selectedStore;
  }, [selectedStore]);

  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    commerceContextsRef.current = commerceContexts;
  }, [commerceContexts]);

  const latestSnapshotRef = useRef(null);
  latestSnapshotRef.current = {
    stores,
    selectedStoreId,
    conversations,
    selectedCustomer,
    messages,
    commerceContexts,
    unreadCounts,
    totalResponseSeconds,
  };

  // Keep a lightweight in-memory snapshot current. This is what makes route return instant.
  useEffect(() => {
    chatPageMemoryCache = {
      ...latestSnapshotRef.current,
      avatarAssignments: [...avatarAssignmentsRef.current.entries()],
      pendingResponseStartedAt: [...pendingResponseStartedAtRef.current.entries()],
      countedResponseIds: [...countedResponseIdsRef.current.values()],
    };
  });

  // Keep only selected IDs in local storage so the preferred store/customer also survives a hard refresh.
  useEffect(() => {
    setStoredChatValue(CHAT_PAGE_SELECTION_KEY, {
      selectedStoreId,
      selectedConversationId: selectedConversationId || preferredConversationIdRef.current || "",
    });
  }, [selectedConversationId, selectedStoreId]);

  // Capture the newest state synchronously when this route unmounts.
  useEffect(() => () => {
    chatPageMemoryCache = {
      ...(latestSnapshotRef.current || {}),
      avatarAssignments: [...avatarAssignmentsRef.current.entries()],
      pendingResponseStartedAt: [...pendingResponseStartedAtRef.current.entries()],
      countedResponseIds: [...countedResponseIdsRef.current.values()],
    };
  }, []);

  const getConversationAvatar = useCallback((conversation) => {
    const conversationId = String(conversation?.conversationId || conversation?.id || "");
    const preferredAvatar = conversation?.avatar || "";
    if (!conversationId) return preferredAvatar || avatars[0];

    const assignedAvatar = avatarAssignmentsRef.current.get(conversationId);
    if (assignedAvatar) return assignedAvatar;

    const usedAvatars = new Set(avatarAssignmentsRef.current.values());
    if (preferredAvatar && !usedAvatars.has(preferredAvatar)) {
      avatarAssignmentsRef.current.set(conversationId, preferredAvatar);
      return preferredAvatar;
    }

    const availableAvatar = avatars.find((avatar) => !usedAvatars.has(avatar));
    const avatar = availableAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(conversationId)}`;
    avatarAssignmentsRef.current.set(conversationId, avatar);
    return avatar;
  }, []);

  const markPendingResponse = useCallback((conversationId, startedAt) => {
    const id = String(conversationId || "");
    if (!id || pendingResponseStartedAtRef.current.has(id)) return;
    const timestamp = new Date(startedAt || Date.now()).getTime();
    if (Number.isFinite(timestamp)) pendingResponseStartedAtRef.current.set(id, timestamp);
  }, []);

  const recordCompletedResponse = useCallback(({ conversationId, responseAt, responseId }) => {
    const id = String(conversationId || "");
    if (!id) return;

    const startedAt = pendingResponseStartedAtRef.current.get(id);
    if (!Number.isFinite(startedAt)) return;

    const completedAt = new Date(responseAt || Date.now()).getTime();
    if (!Number.isFinite(completedAt) || completedAt < startedAt) return;

    const uniqueResponseId = String(responseId || `${id}:${completedAt}`);
    if (countedResponseIdsRef.current.has(uniqueResponseId)) return;

    countedResponseIdsRef.current.add(uniqueResponseId);
    pendingResponseStartedAtRef.current.delete(id);
    setTotalResponseSeconds((current) => current + Math.max(0, Math.floor((completedAt - startedAt) / 1000)));
  }, []);

  const handleSelectCustomer = useCallback((customer) => {
    restoredSnapshotRef.current = false;
    preferredConversationIdRef.current = customer.conversationId;
    messagesRef.current = [];
    setMessages([]);
    setSelectedCustomer(customer);
    selectedCustomerRef.current = customer;
    setUnreadCounts((current) => {
      if (!current[customer.conversationId]) return current;
      const next = { ...current };
      delete next[customer.conversationId];
      return next;
    });
  }, []);

  const handleStoreChange = useCallback((event) => {
    restoredSnapshotRef.current = false;
    preferredConversationIdRef.current = "";
    setSelectedStoreId(event.target.value);
  }, []);

  const loadConversations = useCallback(async (store, { silent = false } = {}) => {
    if (!store) {
      setConversations([]);
      setSelectedCustomer(null);
      return;
    }
    if (!silent) {
      setConversationsLoading(true);
      setConversationError("");
    }
    try {
      const response = await fetchConversations({ store });
      const rows = response.conversations.map((conversation, index) => {
        const decorated = decorateConversation({
          ...conversation,
          avatar: getConversationAvatar(conversation),
        }, index);

        if (isHiddenTestChatMessage(decorated.lastMessage)) {
          pendingResponseStartedAtRef.current.delete(String(decorated.conversationId || ""));
        } else if (isAwaitingSellerResponse(decorated)) {
          markPendingResponse(
            decorated.conversationId,
            decorated.updatedAt || decorated.createdAt
          );
        } else if (isSellerResponse(decorated)) {
          recordCompletedResponse({
            conversationId: decorated.conversationId,
            responseAt: decorated.updatedAt || decorated.createdAt,
            responseId: `poll:${store.id}:${decorated.conversationId}:${decorated.updatedAt || decorated.createdAt || ""}`,
          });
        }

        return decorated;
      });
      setConversations(rows);
      setSelectedCustomer((current) => {
        const preferredId = current?.conversationId || preferredConversationIdRef.current;
        const nextCustomer =
          rows.find((row) => row.conversationId === preferredId) ||
          rows[0] ||
          null;

        if (
          current?.conversationId &&
          nextCustomer?.conversationId &&
          nextCustomer.conversationId !== current.conversationId
        ) {
          restoredSnapshotRef.current = false;
        }

        preferredConversationIdRef.current = nextCustomer?.conversationId || "";
        return nextCustomer;
      });
    } catch (error) {
      if (!silent) {
        setConversations([]);
        setSelectedCustomer(null);
        setConversationError(error.message || "Unable to load conversations");
      }
    } finally {
      if (!silent) setConversationsLoading(false);
    }
  }, [getConversationAvatar, markPendingResponse, recordCompletedResponse]);

  useEffect(() => {
    let active = true;
    const loadStores = async () => {
      const testStore = getStoredChatValue("test-store", null);
      try {
        const authorizedStores = await fetchChatStores();
        if (!active) return;
        const mergedStores = [...authorizedStores];
        if (testStore?.openId && testStore?.cipher && !mergedStores.some((store) => sameChatStore(store, testStore))) {
          mergedStores.push(testStore);
        }
        setStores(mergedStores);
        setSelectedStoreId((current) => (
          mergedStores.some((store) => store.id === current && !store.disabled)
            ? current
            : mergedStores.find((store) => !store.disabled)?.id || ""
        ));
      } catch (error) {
        if (!active) return;
        const fallbackStores = testStore?.openId && testStore?.cipher ? [testStore] : [];
        setStores((current) => (current.length ? current : fallbackStores));
        setSelectedStoreId((current) => current || fallbackStores[0]?.id || "");
        if (!fallbackStores.length && !(initialCache.stores || []).length) {
          setConversationError(error.message || "Unable to load TikTok stores");
        }
      }
    };
    loadStores();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const store = selectedStoreRef.current;
    if (!store) return;

    const sameRenderedStore =
      restoredSnapshotRef.current &&
      String(activeDataStoreIdRef.current || "") === String(store.id || "");

    if (sameRenderedStore) {
      // Route return: keep the previous screen exactly as rendered and refresh behind it.
      loadConversations(store, { silent: true });
      return;
    }

    // Real store change / first uncached visit: reset store-specific state normally.
    activeDataStoreIdRef.current = String(store.id || "");
    messagesRef.current = [];
    commerceContextsRef.current = [];
    setMessages([]);
    setCommerceContexts([]);
    setSelectedCustomer(null);
    selectedCustomerRef.current = null;
    setUnreadCounts({});
    setTotalResponseSeconds(0);
    avatarAssignmentsRef.current = new Map();
    pendingResponseStartedAtRef.current = new Map();
    countedResponseIdsRef.current = new Set();
    loadConversations(store);
  }, [loadConversations, selectedStoreKey]);

  useEffect(() => {
    if (!selectedStoreKey) return undefined;
    const intervalId = window.setInterval(() => {
      const store = selectedStoreRef.current;
      if (store) loadConversations(store, { silent: true });
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [loadConversations, selectedStoreKey]);

  useEffect(() => {
    let active = true;
    const store = selectedStoreRef.current;

    if (!store || !selectedConversationId) {
      messagesRef.current = [];
      setMessages([]);
      setMessagesLoading(false);
      return () => { active = false; };
    }

    const keepPreviousDisplay =
      restoredSnapshotRef.current &&
      String(restoredStoreIdRef.current || "") === String(store.id || "") &&
      String(restoredConversationIdRef.current || "") === String(selectedConversationId);

    if (!keepPreviousDisplay) {
      setMessagesLoading(true);
      setMessageError("");
    } else {
      // Cached messages remain on screen while the request runs invisibly.
      setMessagesLoading(false);
    }

    let firstLoad = true;
    const refreshMessages = () => fetchConversationMessages({
      store,
      conversationId: selectedConversationId,
    }).then((response) => {
      if (active) {
        setMessages((current) => mergeMessages(current, response.messages));
        setMessageError("");
      }
    }).catch((error) => {
      // If an old screen is already visible, a temporary refresh error should not replace it.
      if (active && !keepPreviousDisplay) {
        setMessageError(error.message || "Unable to load messages");
      }
    }).finally(() => {
      if (active && firstLoad && !keepPreviousDisplay) setMessagesLoading(false);
      firstLoad = false;
    });

    refreshMessages();
    const intervalId = window.setInterval(refreshMessages, 2500);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedConversationId, selectedStoreKey]);

  useEffect(() => {
    let active = true;
    const store = selectedStoreRef.current;
    const linkedOrderIds = JSON.parse(linkedOrderIdsKey);

    if (!store || !selectedConversationId || linkedOrderIds.length === 0) {
      commerceContextsRef.current = [];
      setCommerceContexts([]);
      return () => { active = false; };
    }

    const keepPreviousDisplay =
      restoredSnapshotRef.current &&
      String(restoredStoreIdRef.current || "") === String(store.id || "") &&
      String(restoredConversationIdRef.current || "") === String(selectedConversationId);

    if (!keepPreviousDisplay) {
      setCommerceContexts(linkedOrderIds.map((orderId) => ({
        orderId,
        order: null,
        returns: [],
        returnError: "",
        loading: true,
        error: "",
      })));
    }

    Promise.all(linkedOrderIds.map(async (orderId) => {
      try {
        const context = await fetchTikTokConversationOrderContext({ store, orderId });
        return { ...context, loading: false, error: "" };
      } catch (error) {
        return {
          orderId,
          order: null,
          returns: [],
          returnError: "",
          loading: false,
          error: error.message || "Unable to load order information",
        };
      }
    })).then((contexts) => {
      if (active) setCommerceContexts(contexts);
    });

    return () => { active = false; };
  }, [linkedOrderIdsKey, selectedConversationId, selectedStoreKey]);

  useEffect(() => {
    const socket = createTikTokChatSocket({
      onEvent: ({ destination, body }) => {
        if (!body) return;
        const store = selectedStoreRef.current;
        if (!store) return;

        if (destination === "/topic/tiktok/customer-service/conversations") {
          const normalizedConversation = normalizeConversation(body, store);
          if (!sameChatStore(store, normalizedConversation)) return;

          const conversation = decorateConversation({
            ...normalizedConversation,
            avatar: getConversationAvatar(normalizedConversation),
          });

          if (isHiddenTestChatMessage(conversation.lastMessage)) {
            pendingResponseStartedAtRef.current.delete(String(conversation.conversationId || ""));
          } else if (isAwaitingSellerResponse(conversation)) {
            markPendingResponse(
              conversation.conversationId,
              conversation.updatedAt || conversation.createdAt
            );
          } else if (isSellerResponse(conversation)) {
            recordCompletedResponse({
              conversationId: conversation.conversationId,
              responseAt: conversation.updatedAt || conversation.createdAt,
              responseId: `conversation:${conversation.conversationId}:${conversation.updatedAt || conversation.createdAt || ""}`,
            });
          }

          setConversations((current) => [conversation, ...current.filter((item) => item.conversationId !== conversation.conversationId)]);
          setSelectedCustomer((current) => current || conversation);
          return;
        }

        if (destination?.includes("/tiktok/customer-service/") && destination?.endsWith("/messages")) {
          const message = normalizeMessage(body);
          if (!sameChatStore(store, message)) return;

          if (isHiddenTestChatMessage(message)) {
            pendingResponseStartedAtRef.current.delete(String(message.conversationId || ""));
            setMessages((current) => current.filter((item) => !isHiddenTestChatMessage(item)));
            return;
          }

          const isSelectedConversation = selectedCustomerRef.current?.conversationId === message.conversationId;
          if (isSelectedConversation) {
            setMessages((current) => mergeMessages(current, [message]));
          } else if (message.incoming) {
            setUnreadCounts((current) => ({
              ...current,
              [message.conversationId]: Number(current[message.conversationId] || 0) + 1,
            }));
          }

          if (message.incoming) {
            markPendingResponse(message.conversationId, message.createdAt);
          } else {
            recordCompletedResponse({
              conversationId: message.conversationId,
              responseAt: message.createdAt,
              responseId: message.id,
            });
          }

          setConversations((current) => {
            const existing = current.find((item) => item.conversationId === message.conversationId);
            const avatar = getConversationAvatar(existing || {
              conversationId: message.conversationId,
            });
            const updated = decorateConversation(normalizeConversation({
              ...(existing || {}),
              conversationId: message.conversationId,
              openId: message.openId,
              cipher: message.cipher,
              lastMessage: message.message,
              lastMessageDirection: message.direction,
              lastMessageSource: message.source,
              updatedAt: message.createdAt,
              avatar,
            }, store));
            return [updated, ...current.filter((item) => item.conversationId !== message.conversationId)];
          });
        }
      },
    });
    socket.subscribe("/topic/tiktok/customer-service/conversations", "chat-conversations");
    socket.subscribe("/topic/tiktok/customer-service/messages", "chat-messages");
    socket.connect();
    return () => socket.disconnect();
  }, [getConversationAvatar, markPendingResponse, recordCompletedResponse]);

  const updateConversationPreview = useCallback((message) => {
    setConversations((current) => current.map((conversation) => (
      conversation.conversationId === message.conversationId
        ? {
          ...conversation,
          lastMessage: message.message,
          lastMessageDirection: message.direction,
          lastMessageSource: message.source,
          updatedAt: message.createdAt,
        }
        : conversation
    )));
  }, []);

  const handleSend = useCallback(async (messageText) => {
    if (!selectedStore || !selectedCustomer) return false;
    setSending(true);
    setMessageError("");
    try {
      const savedMessage = await sendConversationReply({
        store: selectedStore,
        conversationId: selectedCustomer.conversationId,
        message: messageText,
      });
      recordCompletedResponse({
        conversationId: savedMessage.conversationId || selectedCustomer.conversationId,
        responseAt: savedMessage.createdAt,
        responseId: savedMessage.id,
      });
      setMessages((current) => mergeMessages(current, [savedMessage]));
      updateConversationPreview(savedMessage);
      return true;
    } catch (error) {
      setMessageError(error.message || "Unable to send message");
      return false;
    } finally {
      setSending(false);
    }
  }, [recordCompletedResponse, selectedCustomer, selectedStore, updateConversationPreview]);

  const handleUpload = useCallback(async (file) => {
    if (!selectedStore || !selectedCustomer) return false;
    setSending(true);
    setMessageError("");
    try {
      const savedMessage = await uploadConversationMedia({
        store: selectedStore,
        conversationId: selectedCustomer.conversationId,
        file,
      });
      const localPreviewUrl = URL.createObjectURL(file);
      const previewMessage = {
        ...savedMessage,
        imageUrl: file.type.toLowerCase().startsWith("image/") ? localPreviewUrl : savedMessage.imageUrl,
        videoUrl: file.type.toLowerCase().startsWith("video/") ? localPreviewUrl : savedMessage.videoUrl,
      };
      recordCompletedResponse({
        conversationId: previewMessage.conversationId || selectedCustomer.conversationId,
        responseAt: previewMessage.createdAt,
        responseId: previewMessage.id,
      });
      setMessages((current) => mergeMessages(current, [previewMessage]));
      updateConversationPreview(previewMessage);
      return true;
    } catch (error) {
      setMessageError(error.message || "Unable to upload media");
      return false;
    } finally {
      setSending(false);
    }
  }, [recordCompletedResponse, selectedCustomer, selectedStore, updateConversationPreview]);

  const handleViewOrder = useCallback((order) => {
    if (!order?.rawId) return;
    const routeId = `tiktok:${order.rawId}`;
    setStoredOrderContext(order.storeContext || {});
    setCachedOrderDetailForId(routeId, order);
    navigate(`/warehouse_management/orders/detail/${encodeURIComponent(routeId)}`);
  }, [navigate]);

  const handleViewReturn = useCallback((returnOrder) => {
    if (!returnOrder?.id) return;
    navigate(`/warehouse_management/orders/processing/return_order?returnId=${encodeURIComponent(returnOrder.id)}`);
  }, [navigate]);

  const notRespondCount = useMemo(() => (
    conversations.filter(isAwaitingSellerResponse).length
  ), [conversations]);

  const totalResponse = useMemo(
    () => formatResponseDuration(totalResponseSeconds),
    [totalResponseSeconds]
  );

  const metrics = useMemo(() => [
    [chatT(t, "todaysReception", "Today's Reception"), String(conversations.length)],
    [chatT(t, "notRespond", "Not Respond"), String(notRespondCount)],
    [chatT(t, "lateResponse", "Late Response"), "0"],
    [chatT(t, "totalResponse", "Total Response"), totalResponse],
    [chatT(t, "customerSatisfiedRate", "Customer Satisfied Rate"), "0"],
  ], [conversations.length, notRespondCount, t, totalResponse]);

  if (settingsView) return <SettingsView onBack={() => setSettingsView(false)} t={t} />;

  return (
    <div className="space-y-6 font-body text-slate-800">
      <Topbar PageTitle="Chat" />
      <div className="overflow-x-auto overflow-y-hidden">
        <div
          className="grid h-[calc(100vh-250px)] min-h-[560px] min-w-[1260px] gap-3"
          style={{ gridTemplateColumns: "320px minmax(480px, 1fr) 320px" }}
        >
          <div className="flex h-full min-h-0 flex-col gap-5">
            <section className="grid min-h-[118px] shrink-0 grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-white p-5">
              <SelectBox label={chatT(t, "supportStatus", "Support Status")} options={[chatT(t, "online", "Online"), chatT(t, "offline", "Offline")]} />
              <SelectBox label={chatT(t, "selectPlatform", "Select Platform")} value="TikTok" disabled options={["TikTok"]} />
              <SelectBox
                label={chatT(t, "selectStore", "Select Store")}
                value={selectedStoreId}
                onChange={handleStoreChange}
                disabled={!stores.length}
                options={stores.length
                  ? stores.map((store) => ({
                    value: store.id,
                    label: store.disabled ? `${store.label} (credentials unavailable)` : store.label,
                    disabled: store.disabled,
                  }))
                  : [{ value: "", label: chatT(t, "store", "Store") }]}
              />
            </section>
            <div className="min-h-0 flex-1">
              <ChatHistory
                conversations={conversations}
                selected={selectedCustomer}
                onSelect={handleSelectCustomer}
                unreadCounts={unreadCounts}
                setShowTransfer={setTransferModal}
                setShowMark={setMarkCustomer}
                loading={conversationsLoading}
                error={conversationError}
                t={t}
              />
            </div>
          </div>
          <div className="flex h-full min-h-0 flex-col gap-5">
            <section className="grid min-h-[118px] shrink-0 grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-5">
              {metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
            </section>
            <div className="relative min-h-0 flex-1">
              <Conversation
                key={selectedConversationId || "no-conversation"}
                selected={selectedCustomer}
                messages={messages}
                loading={messagesLoading}
                error={messageError}
                sending={sending}
                onSend={handleSend}
                onUpload={handleUpload}
                commerceContexts={commerceContexts}
                onViewOrder={handleViewOrder}
                t={t}
              />
            </div>
          </div>
          <RightPanel
            key={selectedConversationId || "quick-messages"}
            setShowQuickModal={setQuickModal}
            selected={selectedCustomer}
            onSend={handleSend}
            sending={sending}
            commerceContexts={commerceContexts}
            onViewOrder={handleViewOrder}
            onViewReturn={handleViewReturn}
            t={t}
          />
        </div>
      </div>
      {quickModal && <AddQuickMessageModal onClose={() => setQuickModal(false)} t={t} />}
      {markCustomer && <MarkCustomerModal customer={markCustomer} onClose={() => setMarkCustomer(null)} t={t} />}
      {transferModal && <TransferModal onClose={() => setTransferModal(false)} t={t} />}
    </div>
  );
}
