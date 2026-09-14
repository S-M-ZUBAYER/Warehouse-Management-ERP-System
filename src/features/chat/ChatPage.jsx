import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bot,
  ChevronDown,
  Edit2,
  ExternalLink,
  FileUp,
  Filter,
  ImageUp,
  Menu,
  Plus,
  Search,
  Send,
} from "lucide-react";
import Topbar from "../../components/layout/Topbar";

const chatT = (t, key, defaultValue, options = {}) =>
  t(`chatPage.${key}`, { defaultValue, ...options });

const avatars = [
  "https://i.pravatar.cc/96?img=32",
  "https://i.pravatar.cc/96?img=12",
  "https://i.pravatar.cc/96?img=47",
  "https://i.pravatar.cc/96?img=5",
  "https://i.pravatar.cc/96?img=18",
  "https://i.pravatar.cc/96?img=26",
  "https://i.pravatar.cc/96?img=40",
  "https://i.pravatar.cc/96?img=9",
];

const customers = [
  { name: "Esther Howard", timeKey: "minutesAgo", timeCount: 8, avatar: avatars[0], active: true, category: "Bad Review", issue: "Printhead Issue" },
  { name: "Ralph Edwards", timeKey: "minutesAgo", timeCount: 15, avatar: avatars[1], active: true, category: "No Rating", issue: "Paper Jam" },
  { name: "Jenny Wilson", timeKey: "hoursAgo", timeCount: 1, avatar: avatars[2], active: true, category: "5 Star", issue: "Connectivity" },
  { name: "Eleanor Pena", timeKey: "hoursAgo", timeCount: 2, avatar: avatars[3], active: true, category: "4 Star", issue: "Ink Smudge" },
  { name: "Cameron Williamson", timeKey: "minutesAgo", timeCount: 30, avatar: avatars[4], active: false, category: "3 Star", issue: "Slow Printing" },
  { name: "Savannah Nguyen", timeKey: "minutesAgo", timeCount: 5, avatar: avatars[5], active: true, category: "2 Star", issue: "Printer Error" },
  { name: "Marvin McKinney", timeKey: "yesterday", avatar: avatars[6], active: true, category: "1 Star", issue: "Low Ink" },
  { name: "Dianne Russell", timeKey: "minutesAgo", timeCount: 10, avatar: avatars[7], active: true, category: "Bad Review", issue: "Paper Jam" },
];

const orderItems = Array.from({ length: 3 }, (_, index) => ({
  title: "Ergonomic wireless mouse with 3k...",
  sku: "WM124",
  model: "Evo 124",
  price: "$35.00",
  image: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=160&q=80",
  shipping: "Ship before 21:41 on December 14",
  id: index,
}));

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
  return chatT(t, `time.${customer.timeKey}`, customer.timeKey, { count: customer.timeCount });
}

function SelectBox({ label, options }) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[11px] font-medium text-slate-700">{label}</span>
      <span className="relative block">
        <select className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs text-slate-500 outline-none focus:border-primary">
          {options.map((option) => <option key={option}>{option}</option>)}
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

function SupportAssignPopover({ t }) {
  const teams = [
    ["Customer Support 1", "Pre Sale", chatT(t, "activeCount", "Active (16)", { count: 16 }), chatT(t, "assign", "Assign"), "emerald"],
    ["Customer Support 2", "Aftersales", chatT(t, "activeCount", "Active (05)", { count: 5 }), chatT(t, "reassign", "Reassign"), "emerald"],
    ["Customer Support 3", "Technical Support", chatT(t, "activeCount", "Active (02)", { count: 2 }), chatT(t, "assign", "Assign"), "emerald"],
    ["Customer Support 4", "Aftersales", chatT(t, "offlineCount", "Offline (01)", { count: 1 }), chatT(t, "unableToAssign", "Unable to Assign"), "rose"],
  ];
  return (
    <div className="absolute right-12 top-14 z-20 w-72 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-slate-100">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="h-9 w-full rounded-lg border border-slate-200 pl-9 text-sm outline-none" placeholder={chatT(t, "search", "Search")} />
      </div>
      <div className="mt-4 space-y-4">
        {teams.map(([name, team, status, action, color]) => (
          <div key={name} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-slate-700">{name}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                <span>{team}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${color === "rose" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>{status}</span>
              </div>
            </div>
            <button className={`rounded-full px-2 py-1 text-[10px] ${color === "rose" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>{action}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatHistory({ selected, onSelect, setShowTransfer, setShowMark, t }) {
  const [bulkMode, setBulkMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-800">{chatT(t, "chatHistory", "Chat History")}</h2>
      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="h-9 w-full rounded-lg border border-slate-100 bg-white pl-9 text-xs outline-none" placeholder={chatT(t, "search", "Search")} />
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
        {customers.map((customer) => (
          <button
            key={customer.name}
            onClick={() => onSelect(customer)}
            className={`mb-2 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left ${selected?.name === customer.name ? "bg-slate-100" : "hover:bg-slate-50"}`}
          >
            {bulkMode && <input type="checkbox" defaultChecked className="accent-primary" onClick={(event) => event.stopPropagation()} />}
            <Avatar src={customer.avatar} online={customer.active} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-800">{customer.name}</span>
              <span className="block truncate text-[11px] text-slate-400">{chatT(t, "lastConnect", "Last connect {{time}}", { time: customerTime(t, customer) })}</span>
            </span>
            <Edit2 size={15} onClick={(event) => { event.stopPropagation(); setShowMark(customer); }} className="text-slate-400" />
          </button>
        ))}
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

function Conversation({ selected, setShowAssign, t }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  if (!selected) {
    return (
      <section className="flex h-full min-h-[520px] items-center justify-center rounded-xl border border-slate-200 bg-white">
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
    <section className="relative flex h-full min-h-[520px] flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={selected.avatar} />
          <div>
            <h2 className="font-bold text-slate-800">{selected.name}</h2>
            <p className="text-[11px] text-slate-400">{chatT(t, "lastConnect", "Last connect {{time}}", { time: customerTime(t, selected) })}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-slate-500">
          <button><ExternalLink size={18} /></button>
          <button onClick={setShowAssign}><Menu size={20} /></button>
        </div>
      </div>
      <div className="mt-7 flex-1 space-y-8 overflow-y-auto pr-2">
        <div className="flex items-start gap-3">
          <Avatar src={selected.avatar} size="h-8 w-8" />
          <div>
            <p className="mb-1 text-[11px] text-slate-400">2026-07-08 09:22:05</p>
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-700">{chatT(t, "sampleCustomerMessage1", "Hello ! Help me about the thermal printer")}</p>
          </div>
        </div>
        <div className="ml-auto max-w-xs text-right">
          <p className="mb-1 text-[11px] text-slate-400">2026-07-08 09:23:05</p>
          <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-700">{chatT(t, "sampleAgentMessage", "Hello sir, Let me know how can I help you?")}</p>
        </div>
        <div className="flex max-w-xs items-start gap-3">
          <Avatar src={selected.avatar} size="h-8 w-8" />
          <div>
            <p className="mb-1 text-[11px] text-slate-400">2026-07-08 09:22:05</p>
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-700">
              {chatT(t, "sampleCustomerMessage2", "Hello! I am having a serious issue with my thermal printer. It keeps jamming and the print quality is terrible, which is causing major delays in my work.")}
            </p>
          </div>
        </div>
        <div className="ml-auto flex max-w-[210px] items-center justify-end gap-2 rounded-full bg-sky-50 px-4 py-2 text-xs text-slate-500">
          <span className="flex gap-1"><i className="h-1.5 w-1.5 rounded-full bg-primary" /><i className="h-1.5 w-1.5 rounded-full bg-primary" /><i className="h-1.5 w-1.5 rounded-full bg-primary" /></span>
          {chatT(t, "typing", "Typing")}
        </div>
      </div>
      <div className="relative mt-4 flex h-11 items-center rounded-full bg-slate-100 pl-3 pr-2">
        {uploadOpen && (
          <div className="absolute bottom-12 left-1 rounded-lg bg-slate-500 p-2 text-xs text-white shadow-lg">
            <button className="flex w-28 items-center gap-2 rounded px-2 py-1 hover:bg-white/10"><ImageUp size={13} /> {chatT(t, "uploadImage", "Upload Image")}</button>
            <button className="flex w-28 items-center gap-2 rounded px-2 py-1 hover:bg-white/10"><FileUp size={13} /> {chatT(t, "uploadFiles", "Upload Files")}</button>
          </div>
        )}
        <button onClick={() => setUploadOpen((value) => !value)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600"><Plus size={18} /></button>
        <input className="min-w-0 flex-1 bg-transparent px-3 text-xs outline-none" placeholder={chatT(t, "messagePlaceholder", "You can solve this problem with")} />
        <button className="flex h-8 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white">{chatT(t, "send", "Send")} <Send size={15} /></button>
      </div>
    </section>
  );
}

function RightPanel({ setShowQuickModal, t }) {
  return (
    <aside className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-800">{chatT(t, "orderDetails", "Order Details")}</h2>
        <div className="mt-5 space-y-4">
          {orderItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              <img src={item.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <div className="min-w-0 text-xs text-slate-500">
                <p className="truncate text-slate-700">{item.title}</p>
                <p>{chatT(t, "sku", "SKU")}: {item.sku} <span className="ml-6 text-orange-500">{chatT(t, "price", "Price")}: {item.price}</span></p>
                <p>{chatT(t, "modelName", "Model Name")}: <span className="text-slate-700">{item.model}</span></p>
                <p>{chatT(t, "shippingTime", "Shipping time")}: <span className="text-slate-700">{item.shipping}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{chatT(t, "quickMessages", "Quick Messages")}</h2>
          <button onClick={() => setShowQuickModal(true)}><Plus size={18} /></button>
        </div>
        <div className="space-y-4">
          {quickMessages.map(([title, text], index) => {
            const [titleKey, textKey] = quickMessageKeys[index] || [];
            return (
              <div key={title} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-800">{chatT(t, titleKey, title)}</p>
                  <p className="mt-1 text-xs text-slate-500">{chatT(t, textKey, text)}</p>
                </div>
                <Edit2 size={15} className="mt-1 flex-shrink-0 text-slate-400" />
              </div>
            );
          })}
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

export default function ChatPage() {
  const { t } = useTranslation();
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);
  const [quickModal, setQuickModal] = useState(false);
  const [markCustomer, setMarkCustomer] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [settingsView, setSettingsView] = useState(false);

  const metrics = useMemo(() => [
    [chatT(t, "todaysReception", "Today's Reception"), "0"],
    [chatT(t, "notRespond", "Not Respond"), "0"],
    [chatT(t, "lateResponse", "Late Response"), "0"],
    [chatT(t, "totalResponse", "Total Response"), "0h 0m 0s"],
    [chatT(t, "customerSatisfiedRate", "Customer Satisfied Rate"), "0"],
  ], [t]);

  if (settingsView) return <SettingsView onBack={() => setSettingsView(false)} t={t} />;

  return (
    <div className="space-y-6 font-body text-slate-800">
      <Topbar PageTitle="Chat" />
      <div className="overflow-x-auto">
        <div
          className="grid min-h-[calc(100vh-150px)] min-w-[1260px] gap-3"
          style={{ gridTemplateColumns: "320px minmax(480px, 1fr) 300px" }}
        >
          <div className="flex min-h-[calc(100vh-150px)] flex-col gap-5">
            <section className="grid min-h-[118px] grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-white p-5">
              <SelectBox label={chatT(t, "supportStatus", "Support Status")} options={[chatT(t, "online", "Online"), chatT(t, "offline", "Offline")]} />
              <SelectBox label={chatT(t, "selectPlatform", "Select Platform")} options={[chatT(t, "platform", "Platform"), "Shopee", "TikTok"]} />
              <SelectBox label={chatT(t, "selectStore", "Select Store")} options={[chatT(t, "store", "Store"), "Grozziie TH", "Grozziie MY"]} />
            </section>
            <div className="min-h-0 flex-1">
              <ChatHistory
                selected={selectedCustomer}
                onSelect={setSelectedCustomer}
                setShowTransfer={setTransferModal}
                setShowMark={setMarkCustomer}
                t={t}
              />
            </div>
          </div>
          <div className="flex min-h-[calc(100vh-150px)] flex-col gap-5">
            <section className="grid min-h-[118px] grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-5">
              {metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
            </section>
            <div className="relative min-h-0 flex-1">
              <Conversation selected={selectedCustomer} setShowAssign={() => setAssignOpen((value) => !value)} t={t} />
              {assignOpen && <SupportAssignPopover t={t} />}
            </div>
          </div>
          <RightPanel setShowQuickModal={setQuickModal} t={t} />
        </div>
      </div>
      {quickModal && <AddQuickMessageModal onClose={() => setQuickModal(false)} t={t} />}
      {markCustomer && <MarkCustomerModal customer={markCustomer} onClose={() => setMarkCustomer(null)} t={t} />}
      {transferModal && <TransferModal onClose={() => setTransferModal(false)} t={t} />}
    </div>
  );
}
