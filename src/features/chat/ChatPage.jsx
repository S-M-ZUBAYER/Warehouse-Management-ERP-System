import { useMemo, useState } from "react";
import {
  Bell,
  Bot,
  Check,
  ChevronDown,
  Edit2,
  ExternalLink,
  FileUp,
  Filter,
  Hexagon,
  ImageUp,
  Menu,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings,
  UserRound,
  X,
} from "lucide-react";

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
  { name: "Esther Howard", time: "8 minutes ago", avatar: avatars[0], active: true, category: "Bad Review", issue: "Printhead Issue" },
  { name: "Ralph Edwards", time: "15 minutes ago", avatar: avatars[1], active: true, category: "No Rating", issue: "Paper Jam" },
  { name: "Jenny Wilson", time: "1 hour ago", avatar: avatars[2], active: true, category: "5 Star", issue: "Connectivity" },
  { name: "Eleanor Pena", time: "2 hours ago", avatar: avatars[3], active: true, category: "4 Star", issue: "Ink Smudge" },
  { name: "Cameron Williamson", time: "30 minutes ago", avatar: avatars[4], active: false, category: "3 Star", issue: "Slow Printing" },
  { name: "Savannah Nguyen", time: "5 minutes ago", avatar: avatars[5], active: true, category: "2 Star", issue: "Printer Error" },
  { name: "Marvin McKinney", time: "yesterday", avatar: avatars[6], active: true, category: "1 Star", issue: "Low Ink" },
  { name: "Dianne Russell", time: "10 minutes ago", avatar: avatars[7], active: true, category: "Bad Review", issue: "Paper Jam" },
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

function AddQuickMessageModal({ onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl">
        <h2 className="text-center text-xl font-bold text-slate-800">Add Quick Message</h2>
        <p className="mx-auto mt-2 max-w-xs text-center text-xs text-slate-500">
          Create a quick message for faster replies. Type your message and press Enter to send it instantly.
        </p>
        <label className="mt-7 block text-xs font-semibold text-slate-700">Enter Quick Message</label>
        <input className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary" placeholder="Hello" />
        <label className="mt-5 block text-xs font-semibold text-slate-700">Enter Full Message</label>
        <input className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary" placeholder="Hello boss, How can I you?" />
        <div className="mt-7 grid grid-cols-2 gap-4">
          <button onClick={onClose} className="h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">Cancel</button>
          <button onClick={onClose} className="h-11 rounded-lg bg-primary text-sm font-semibold text-white">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function MarkCustomerModal({ customer, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-7 shadow-2xl">
        <h2 className="text-center text-xl font-bold text-slate-800">Mark the customer</h2>
        <p className="mt-2 text-center text-xs text-slate-500">Mark the customer to Prioritize easily</p>
        <div className="mt-7">
          <p className="mb-2 text-xs font-semibold text-slate-700">Customer Name</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={customer.avatar} />
              <span className="text-sm font-bold text-slate-800">{customer.name}</span>
            </div>
            <Edit2 size={15} className="text-slate-400" />
          </div>
        </div>
        <SelectBox label="Select Customer's Category" options={["Bad Review", "5 Star", "4 Star", "No Rating"]} />
        <div className="mt-5">
          <SelectBox label="Select Issue" options={["Printhead Issue", "Paper Jam", "Connectivity", "Low Ink"]} />
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4">
          <button onClick={onClose} className="h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">Cancel</button>
          <button onClick={onClose} className="h-11 rounded-lg bg-primary text-sm font-semibold text-white">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function TransferModal({ onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white p-7 shadow-2xl">
        <h2 className="text-center text-xl font-bold text-slate-800">Transfer Customer</h2>
        <p className="mt-2 text-center text-xs text-slate-500">Select a support team to transfer the customers</p>
        <div className="mt-7 space-y-4 text-sm font-semibold text-slate-700">
          <label className="flex items-center gap-3"><input type="radio" name="team" /> Pre Sale Support</label>
          <label className="flex items-center gap-3"><input type="radio" name="team" /> After Sale Support</label>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-4">
          <button onClick={onClose} className="h-11 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">Cancel</button>
          <button onClick={onClose} className="h-11 rounded-lg bg-primary text-sm font-semibold text-white">Transfer</button>
        </div>
      </div>
    </Modal>
  );
}

function SupportAssignPopover() {
  const teams = [
    ["Customer Support 1", "Pre Sale", "Active (16)", "Assign", "emerald"],
    ["Customer Support 2", "Aftersales", "Active (05)", "Reassign", "emerald"],
    ["Customer Support 3", "Technical Support", "Active (02)", "Assign", "emerald"],
    ["Customer Support 4", "Aftersales", "Offline(01)", "Unable to Assign", "rose"],
  ];
  return (
    <div className="absolute right-12 top-14 z-20 w-72 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-slate-100">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="h-9 w-full rounded-lg border border-slate-200 pl-9 text-sm outline-none" placeholder="Search" />
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

function ChatHistory({ selected, onSelect, showTransfer, setShowTransfer, setShowMark }) {
  const [bulkMode, setBulkMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-800">Chat History</h2>
      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="h-9 w-full rounded-lg border border-slate-100 bg-white pl-9 text-xs outline-none" placeholder="Search" />
        </div>
        <button onClick={() => setFiltersOpen((value) => !value)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <Filter size={16} />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
        {["All", "Unread", "Starred", "Not Responded"].map((tab, index) => (
          <button key={tab} className={`h-8 rounded-full px-4 ${index === 0 ? "bg-primary font-semibold text-white" : ""}`}>{tab}</button>
        ))}
      </div>
      {filtersOpen && (
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white p-2 shadow-lg ring-1 ring-slate-100">
          <SelectBox label="Select Time" options={["Today", "Week", "Month"]} />
          <SelectBox label="Customer Category" options={["Good Review", "Bad Review"]} />
          <SelectBox label="Issue Category" options={["Print head", "Paper Jam"]} />
        </div>
      )}
      {bulkMode && (
        <label className="mt-3 flex items-center gap-2 text-xs text-primary">
          <input type="checkbox" defaultChecked /> Select All
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
              <span className="block truncate text-[11px] text-slate-400">Last connect {customer.time}</span>
            </span>
            <Edit2 size={15} onClick={(event) => { event.stopPropagation(); setShowMark(customer); }} className="text-slate-400" />
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        {bulkMode ? (
          <button onClick={() => setShowTransfer(true)} className="flex h-9 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white">
            Transfer <Send size={14} />
          </button>
        ) : (
          <button onClick={() => setBulkMode(true)} className="text-xs font-semibold text-primary">Select customers</button>
        )}
      </div>
    </section>
  );
}

function Conversation({ selected, setSelected, setShowAssign }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  if (!selected) {
    return (
      <section className="flex min-h-[520px] items-center justify-center rounded-xl border border-slate-200 bg-white">
        <div className="text-center">
          <div className="mx-auto grid h-48 w-64 grid-cols-2 place-items-center gap-3">
            <div className="h-24 w-32 rounded-lg border border-primary/60 bg-blue-50" />
            <div className="mt-16 h-24 w-32 rounded-lg border border-primary/60 bg-blue-50" />
            <div className="-mt-14 h-24 w-32 rounded-lg border border-primary/60 bg-blue-50" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-sky-900/40">No Selected Customer Message Found</h2>
        </div>
      </section>
    );
  }
  return (
    <section className="relative flex min-h-[520px] flex-col rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar src={selected.avatar} />
          <div>
            <h2 className="font-bold text-slate-800">{selected.name}</h2>
            <p className="text-[11px] text-slate-400">Last connect {selected.time}</p>
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
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-700">Hello ! Help me about the thermal printer</p>
          </div>
        </div>
        <div className="ml-auto max-w-xs text-right">
          <p className="mb-1 text-[11px] text-slate-400">2026-07-08 09:23:05</p>
          <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-700">Hello sir, Let me know how can I help you?</p>
        </div>
        <div className="flex max-w-xs items-start gap-3">
          <Avatar src={selected.avatar} size="h-8 w-8" />
          <div>
            <p className="mb-1 text-[11px] text-slate-400">2026-07-08 09:22:05</p>
            <p className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-700">
              Hello! I am having a serious issue with my thermal printer. It keeps jamming and the print quality is terrible, which is causing major delays in my work.
            </p>
          </div>
        </div>
        <div className="ml-auto flex max-w-[210px] items-center justify-end gap-2 rounded-full bg-sky-50 px-4 py-2 text-xs text-slate-500">
          <span className="flex gap-1"><i className="h-1.5 w-1.5 rounded-full bg-primary" /><i className="h-1.5 w-1.5 rounded-full bg-primary" /><i className="h-1.5 w-1.5 rounded-full bg-primary" /></span>
          Typing
        </div>
      </div>
      <div className="relative mt-4 flex h-11 items-center rounded-full bg-slate-100 pl-3 pr-2">
        {uploadOpen && (
          <div className="absolute bottom-12 left-1 rounded-lg bg-slate-500 p-2 text-xs text-white shadow-lg">
            <button className="flex w-28 items-center gap-2 rounded px-2 py-1 hover:bg-white/10"><ImageUp size={13} /> Upload Image</button>
            <button className="flex w-28 items-center gap-2 rounded px-2 py-1 hover:bg-white/10"><FileUp size={13} /> Upload Files</button>
          </div>
        )}
        <button onClick={() => setUploadOpen((value) => !value)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-600"><Plus size={18} /></button>
        <input className="min-w-0 flex-1 bg-transparent px-3 text-xs outline-none" placeholder="You can solve this problem with" />
        <button className="flex h-8 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white">Send <Send size={15} /></button>
      </div>
    </section>
  );
}

function RightPanel({ setShowQuickModal }) {
  return (
    <aside className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-800">Order Details</h2>
        <div className="mt-5 space-y-4">
          {orderItems.map((item) => (
            <div key={item.id} className="flex gap-4">
              <img src={item.image} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <div className="min-w-0 text-xs text-slate-500">
                <p className="truncate text-slate-700">{item.title}</p>
                <p>SKU: {item.sku} <span className="ml-6 text-orange-500">Price: {item.price}</span></p>
                <p>Model Name: <span className="text-slate-700">{item.model}</span></p>
                <p>Shipping time: <span className="text-slate-700">{item.shipping}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Quick Messages</h2>
          <button onClick={() => setShowQuickModal(true)}><Plus size={18} /></button>
        </div>
        <div className="space-y-4">
          {quickMessages.map(([title, text]) => (
            <div key={title} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-800">{title}</p>
                <p className="mt-1 text-xs text-slate-500">{text}</p>
              </div>
              <Edit2 size={15} className="mt-1 flex-shrink-0 text-slate-400" />
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}

function SettingsView({ onBack }) {
  const [tab, setTab] = useState("general");
  const rows = tab === "general" ? settingsIssues : customerCategories;
  return (
    <div className="min-h-full bg-[#F7F7F7] p-2">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <button onClick={onBack} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary">Back to Chat</button>
      </div>
      <div className="mb-5 flex gap-4 text-sm">
        {[
          ["general", "General Settings"],
          ["time", "Time Management"],
          ["ai", "Train AI Assistant"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`rounded-lg px-4 py-2 ${tab === key ? "bg-blue-50 font-semibold text-primary" : "text-slate-500"}`}>{label}</button>
        ))}
      </div>
      {tab === "time" ? (
        <div className="space-y-6">
          <section className="rounded-xl bg-white p-6">
            <h2 className="font-bold text-slate-800">Store Time Management</h2>
            <div className="mt-6 space-y-5 text-sm text-slate-700">
              <div className="flex justify-between"><span>Store Opening time</span><span className="rounded-lg border px-3 py-1 text-xs">07 : 00 am</span></div>
              <div className="flex justify-between"><span>Store closing time</span><span className="rounded-lg border px-3 py-1 text-xs">07 : 00 am</span></div>
            </div>
          </section>
          <section className="rounded-xl bg-white p-6">
            <h2 className="font-bold text-slate-800">Response Time Management</h2>
            <div className="mt-6 space-y-5 text-sm text-slate-700">
              <div className="flex justify-between"><span>Minimum Response time</span><span className="rounded-lg border px-3 py-1 text-xs">03 min</span></div>
              <div className="flex justify-between"><span>Set Auto transfer time</span><span className="rounded-lg border px-3 py-1 text-xs">02 min</span></div>
            </div>
          </section>
        </div>
      ) : tab === "ai" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl bg-white p-8">
            <div className="flex h-52 flex-col items-center justify-center rounded-xl border border-slate-200">
              <Bot size={30} className="text-primary" />
              <h2 className="mt-4 text-xl font-bold text-slate-800">Choose a file or drag & drop it here</h2>
              <p className="mt-2 text-xs text-slate-400">Pdf, Doc or Docx, less then 5MB</p>
              <button className="mt-5 h-10 w-full max-w-sm rounded-lg border text-sm">Browse File</button>
            </div>
            <div className="mt-6 rounded-xl border border-slate-200 p-5">
              <h2 className="font-bold">Add Question and Answers</h2>
              <input className="mt-4 h-9 w-full rounded border px-3 text-sm" placeholder="Add question here" />
              <textarea className="mt-4 h-28 w-full rounded border px-3 py-2 text-sm" placeholder="Add answer here" />
              <div className="mt-4 flex justify-end gap-4">
                <button className="h-10 w-32 rounded-full border">Reset</button>
                <button className="h-10 w-32 rounded-full bg-primary text-white">Save</button>
              </div>
            </div>
          </section>
          <section className="rounded-xl bg-white p-6">
            <h2 className="mb-5 font-bold">Added Question and Answers</h2>
            <div className="space-y-5">
              {trainingQuestions.map(([title, text]) => (
                <div key={title} className="flex justify-between gap-4">
                  <div><p className="font-semibold text-slate-800">{title}</p><p className="mt-1 text-xs text-slate-500">{text}</p></div>
                  <Edit2 size={15} className="text-slate-400" />
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <SettingsCard title="Categorized all issues" rows={rows} />
          <SettingsCard title="Add Customer Category" rows={customerCategories} />
          <SettingsCard title="Add Violence Keywords" rows={keywords} />
        </div>
      )}
    </div>
  );
}

function SettingsCard({ title, rows }) {
  return (
    <section className="rounded-xl bg-white p-6">
      <div className="mb-5 flex justify-between">
        <h2 className="font-bold text-slate-800">{title}</h2>
        <Plus size={18} />
      </div>
      <div className="space-y-5">
        {rows.map(([label, text]) => (
          <div key={`${title}-${label}`} className="flex justify-between gap-4">
            <div><p className="font-semibold text-slate-800">{label}</p><p className="mt-1 text-xs text-slate-500">{text}</p></div>
            <Edit2 size={15} className="text-slate-400" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ChatPage() {
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]);
  const [quickModal, setQuickModal] = useState(false);
  const [markCustomer, setMarkCustomer] = useState(null);
  const [transferModal, setTransferModal] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [settingsView, setSettingsView] = useState(false);

  const metrics = useMemo(() => [
    ["Today's Reception", "0"],
    ["Not Respond", "0"],
    ["Late Response", "0"],
    ["Total Response", "0h 0m 0s"],
    ["Customer Satisfied Rate", "0"],
  ], []);

  if (settingsView) return <SettingsView onBack={() => setSettingsView(false)} />;

  return (
    <div className="min-h-full bg-[#F7F7F7] text-slate-800">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
        <div className="flex items-center gap-4">
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary"><Bell size={18} /></button>
          <button onClick={() => setSettingsView(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary"><Settings size={18} /></button>
          <button className="flex h-11 items-center gap-3 rounded-full bg-white px-3">
            <Avatar src="https://i.pravatar.cc/96?img=13" size="h-8 w-8" />
            <span className="text-sm font-semibold">Md G R Pias</span>
            <ChevronDown size={15} />
          </button>
        </div>
      </div>
      <div className="grid min-h-[calc(100vh-150px)] grid-cols-1 gap-5 2xl:grid-cols-[280px_minmax(520px,1fr)_340px]">
        <div className="space-y-5">
          <section className="grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-white p-5">
            <SelectBox label="Support Status" options={["Online", "Offline"]} />
            <SelectBox label="Select Platform" options={["Platform", "Shopee", "TikTok"]} />
            <SelectBox label="Select Store" options={["Store", "Grozziie TH", "Grozziie MY"]} />
          </section>
          <ChatHistory
            selected={selectedCustomer}
            onSelect={setSelectedCustomer}
            showTransfer={transferModal}
            setShowTransfer={setTransferModal}
            setShowMark={setMarkCustomer}
          />
        </div>
        <div className="space-y-5">
          <section className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-5">
            {metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
          </section>
          <div className="relative">
            <Conversation selected={selectedCustomer} setSelected={setSelectedCustomer} setShowAssign={() => setAssignOpen((value) => !value)} />
            {assignOpen && <SupportAssignPopover />}
          </div>
        </div>
        <RightPanel setShowQuickModal={setQuickModal} />
      </div>
      {quickModal && <AddQuickMessageModal onClose={() => setQuickModal(false)} />}
      {markCustomer && <MarkCustomerModal customer={markCustomer} onClose={() => setMarkCustomer(null)} />}
      {transferModal && <TransferModal onClose={() => setTransferModal(false)} />}
    </div>
  );
}
