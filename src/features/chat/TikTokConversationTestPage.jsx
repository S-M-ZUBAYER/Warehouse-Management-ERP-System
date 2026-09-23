import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  Video,
} from "lucide-react";
import {
  createTikTokChatSocket,
  fetchConversationMessages,
  fetchConversations,
  getStoredChatValue,
  normalizeConversation,
  normalizeMessage,
  setStoredChatValue,
  uploadConversationMedia,
} from "./chatApi";

function mergeMessages(current, additions) {
  const messagesById = new Map(current.map((message) => [String(message.id), message]));
  additions.forEach((message) => {
    const existing = messagesById.get(String(message.id));
    const nextMessage = existing?.customerAuthored
      ? { ...message, direction: "INCOMING", incoming: true, customerAuthored: true }
      : message;
    messagesById.set(String(message.id), {
      ...nextMessage,
      imageUrl: existing?.imageUrl?.startsWith("blob:") ? existing.imageUrl : nextMessage.imageUrl,
      videoUrl: existing?.videoUrl?.startsWith("blob:") ? existing.videoUrl : nextMessage.videoUrl,
    });
  });
  return [...messagesById.values()].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
}

function messageTime(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function isGeneratedMediaMessage(value) {
  return ["image media", "video media", "image and video media"].includes(String(value || "").trim().toLowerCase());
}

function TestImageAttachment({ src }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">Image uploaded · preview unavailable</div>;
  return <img src={src} alt="Uploaded attachment" onError={() => setFailed(true)} className="max-h-64 max-w-full rounded-xl object-contain" />;
}

function TestVideoAttachment({ src }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">Video uploaded · preview unavailable</div>;
  return <video src={src} controls onError={() => setFailed(true)} className="max-h-64 max-w-full rounded-xl" />;
}

async function fetchAllConversations(store) {
  const conversations = [];
  const seenTokens = new Set();
  let pageToken = "";

  for (let page = 0; page < 20; page += 1) {
    const response = await fetchConversations({ store, pageSize: 100, pageToken });
    conversations.push(...response.conversations);
    const nextToken = response.nextPageToken;
    if (!nextToken || seenTokens.has(String(nextToken))) break;
    seenTokens.add(String(nextToken));
    pageToken = nextToken;
  }

  return conversations;
}

export default function TikTokConversationTestPage() {
  const storedTestStore = getStoredChatValue("test-store", {});
  const [openId, setOpenId] = useState(storedTestStore.openId || "");
  const [cipher, setCipher] = useState(storedTestStore.cipher || "");
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [sessionReady, setSessionReady] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [newOrderId, setNewOrderId] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const pendingCreateRef = useRef(null);
  const pendingOrderIdRef = useRef("");
  const credentialsRef = useRef(null);
  const conversationRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const renderedMessageIdsRef = useRef(new Set());
  const conversationId = conversation?.conversationId || "";

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

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

  useEffect(() => {
    const publishPendingConversation = () => {
      const request = pendingCreateRef.current;
      if (request && socketRef.current?.createConversation(request)) {
        pendingCreateRef.current = null;
      }
    };

    const socket = createTikTokChatSocket({
      onConnected: publishPendingConversation,
      onStatus: setSocketStatus,
      onError: (socketError) => {
        pendingCreateRef.current = null;
        pendingOrderIdRef.current = "";
        setError(socketError.message || "WebSocket connection failed");
        setCreating(false);
        setSending(false);
      },
      onEvent: ({ destination, body }) => {
        if (!body) return;
        const credentials = credentialsRef.current;
        if (!credentials || String(body.openId) !== String(credentials.openId) || String(body.cipher) !== String(credentials.cipher)) {
          return;
        }

        if (destination === "/topic/tiktok/customer-service/conversations") {
          const nextConversation = normalizeConversation(body, credentials);
          setConversations((current) => [
            nextConversation,
            ...current.filter((item) => item.conversationId !== nextConversation.conversationId),
          ]);
          setConversation(nextConversation);
          conversationRef.current = nextConversation;
          setMessages([]);
          setCreating(false);
          setSessionReady(true);
          setError("");
          const pendingOrderId = pendingOrderIdRef.current;
          if (pendingOrderId) {
            const published = socketRef.current?.sendCustomerMessage({
              openId: credentials.openId,
              cipher: credentials.cipher,
              conversationId: nextConversation.conversationId,
              message: `orderId :${pendingOrderId}`,
            });
            if (published) pendingOrderIdRef.current = "";
          }
          return;
        }

        if (destination === "/topic/tiktok/customer-service/messages") {
          const message = normalizeMessage(body);
          setConversations((current) => current.map((item) => (
            item.conversationId === message.conversationId
              ? { ...item, lastMessage: message.message, updatedAt: message.createdAt }
              : item
          )));
          if (message.conversationId !== conversationRef.current?.conversationId) return;
          setMessages((current) => mergeMessages(current, [message]));
          setSending(false);
          setError("");
        }
      },
    });

    socketRef.current = socket;
    socket.subscribe("/topic/tiktok/customer-service/conversations", "customer-conversations");
    socket.subscribe("/topic/tiktok/customer-service/messages", "customer-messages");
    socket.connect();
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!conversationId) return undefined;
    let active = true;
    let firstLoad = true;
    const refreshMessages = async () => {
      const credentials = credentialsRef.current;
      if (!credentials) return;
      if (firstLoad) setLoadingMessages(true);
      try {
        const response = await fetchConversationMessages({
          store: credentials,
          conversationId,
        });
        if (active) {
          setMessages((current) => mergeMessages(current, response.messages));
          setError("");
        }
      } catch (refreshError) {
        if (active) setError(refreshError.message || "Unable to refresh conversation messages");
      } finally {
        if (active && firstLoad) setLoadingMessages(false);
        firstLoad = false;
      }
    };
    refreshMessages();
    const intervalId = window.setInterval(refreshMessages, 2500);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [conversationId]);

  const loadConversations = async (event) => {
    event.preventDefault();
    const trimmedOpenId = openId.trim();
    const trimmedCipher = cipher.trim();
    if (!trimmedOpenId || !trimmedCipher) {
      setError("openId and cipher are required.");
      return;
    }

    const store = {
      id: `test-${trimmedOpenId}`,
      platform: "tiktok",
      label: `Test store (${trimmedOpenId})`,
      openId: trimmedOpenId,
      cipher: trimmedCipher,
      shopId: "",
      region: "",
    };
    setStoredChatValue("test-store", store);
    credentialsRef.current = store;
    setLoadingConversations(true);
    setError("");

    try {
      const rows = await fetchAllConversations(store);
      setConversations(rows);
      setConversation(rows[0] || null);
      conversationRef.current = rows[0] || null;
      setMessages([]);
      setSessionReady(true);
    } catch (loadError) {
      setError(loadError.message || "Unable to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  };

  const selectConversation = (nextConversation) => {
    if (nextConversation.conversationId === conversationRef.current?.conversationId) return;
    setMessages([]);
    setDraft("");
    setError("");
    setConversation(nextConversation);
    conversationRef.current = nextConversation;
  };

  const createConversation = (event) => {
    event.preventDefault();
    const credentials = credentialsRef.current;
    if (!credentials || creating) return;
    pendingOrderIdRef.current = newOrderId.trim();
    pendingCreateRef.current = { openId: credentials.openId, cipher: credentials.cipher };
    setCreating(true);
    setNewConversationOpen(false);
    setError("");

    if (socketStatus === "connected" && socketRef.current?.createConversation(pendingCreateRef.current)) {
      pendingCreateRef.current = null;
    } else {
      socketRef.current?.connect();
    }
  };

  const sendMessage = () => {
    const message = draft.trim();
    const credentials = credentialsRef.current;
    if (!message || !credentials || !conversation || sending) return;
    if (socketStatus !== "connected") {
      setError("Chat is reconnecting. Please try again in a moment.");
      return;
    }

    setSending(true);
    setError("");
    const published = socketRef.current?.sendCustomerMessage({
      openId: credentials.openId,
      cipher: credentials.cipher,
      conversationId: conversation.conversationId,
      message,
    });
    if (published) {
      setDraft("");
      setSending(false);
    } else {
      setSending(false);
      setError("Message could not be sent. Please try again.");
    }
  };

  const uploadMedia = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const credentials = credentialsRef.current;
    if (!file || !credentials || !conversation) return;

    setSending(true);
    setError("");
    try {
      const savedMessage = await uploadConversationMedia({
        store: credentials,
        conversationId: conversation.conversationId,
        file,
      });
      const localPreviewUrl = URL.createObjectURL(file);
      setMessages((current) => mergeMessages(current, [{
        ...savedMessage,
        imageUrl: file.type.toLowerCase().startsWith("image/") ? localPreviewUrl : savedMessage.imageUrl,
        videoUrl: file.type.toLowerCase().startsWith("video/") ? localPreviewUrl : savedMessage.videoUrl,
        direction: "INCOMING",
        incoming: true,
        customerAuthored: true,
      }]));
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload media");
    } finally {
      setSending(false);
    }
  };

  const changeCredentials = () => {
    credentialsRef.current = null;
    conversationRef.current = null;
    setSessionReady(false);
    setConversations([]);
    setConversation(null);
    setMessages([]);
    setDraft("");
    setNewConversationOpen(false);
    setNewOrderId("");
    setError("");
  };

  if (!sessionReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 font-body text-slate-800">
        <section className="w-full max-w-lg rounded-2xl border border-white/80 bg-white p-7 shadow-xl sm:p-9">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-blue-200">
            <MessageCircle size={28} />
          </div>
          <h1 className="mt-5 text-center text-2xl font-bold">Customer Service Test Chat</h1>
          <p className="mx-auto mt-2 max-w-sm text-center text-sm leading-6 text-slate-500">
            Enter the TikTok openId and cipher to load all existing conversations. No login is required.
          </p>

          <form onSubmit={loadConversations} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-700">openId</span>
              <input value={openId} onChange={(event) => setOpenId(event.target.value)} autoComplete="off" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="Enter TikTok openId" />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold text-slate-700">cipher</span>
              <input value={cipher} onChange={(event) => setCipher(event.target.value)} autoComplete="off" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="Enter TikTok cipher" />
            </label>

            {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

            <button type="submit" disabled={loadingConversations} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60">
              {loadingConversations ? <Loader2 size={17} className="animate-spin" /> : <MessageCircle size={17} />}
              {loadingConversations ? "Loading conversations..." : "Load Conversations"}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Connection: <span className={socketStatus === "connected" ? "font-medium text-emerald-600" : "font-medium text-amber-600"}>{socketStatus}</span>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-100 p-0 font-body text-slate-800 sm:p-5">
      <section className="mx-auto grid h-full w-full max-w-6xl min-h-0 overflow-hidden bg-white shadow-xl sm:grid-cols-[290px_minmax(0,1fr)] sm:rounded-2xl sm:border sm:border-slate-200">
        <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white sm:border-b-0 sm:border-r">
          <div className="shrink-0 border-b border-slate-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="font-bold text-slate-800">Conversations</h1>
                <p className="mt-0.5 text-xs text-slate-400">{conversations.length} found</p>
              </div>
              <button type="button" onClick={() => { setNewOrderId(""); setNewConversationOpen(true); }} disabled={creating} className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-white disabled:opacity-50">
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                New
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {conversations.length === 0 && (
              <div className="px-4 py-12 text-center">
                <MessageCircle size={28} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">No conversations found</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Use New to create the first conversation.</p>
              </div>
            )}
            {conversations.map((item) => {
              const selected = item.conversationId === conversationId;
              return (
                <button key={item.conversationId} type="button" onClick={() => selectConversation(item)} className={`mb-1 w-full rounded-xl px-3 py-3 text-left transition ${selected ? "bg-blue-50 ring-1 ring-blue-100" : "hover:bg-slate-50"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
                      {(item.customerName || item.conversationId).slice(-2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-700">{item.customerName || `Conversation ${item.conversationId}`}</p>
                        <span className="shrink-0 text-[9px] text-slate-400">{item.messageCount || 0}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-400">{item.lastMessage || "No messages yet"}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="shrink-0 border-t border-slate-100 p-3">
            <button type="button" onClick={changeCredentials} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
              <ArrowLeft size={14} /> Change credentials
            </button>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col bg-slate-50">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white"><MessageCircle size={20} /></div>
              <div className="min-w-0">
                <h2 className="truncate font-bold text-slate-800">{conversation ? (conversation.customerName || "Customer Support") : "Select a conversation"}</h2>
                <p className="truncate text-xs text-slate-400">{conversation ? `Conversation: ${conversation.conversationId}` : "Choose one from the list or create a new conversation"}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
              <span className={`h-2.5 w-2.5 rounded-full ${socketStatus === "connected" ? "bg-emerald-500" : "bg-amber-400"}`} />
              <span className="hidden sm:inline">{socketStatus}</span>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
            {!conversation && (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <MessageCircle size={40} className="mx-auto text-slate-300" />
                  <p className="mt-4 font-semibold text-slate-500">No conversation selected</p>
                  <p className="mt-1 text-sm text-slate-400">Select an existing conversation or create a new one.</p>
                </div>
              </div>
            )}
            {conversation && loadingMessages && messages.length === 0 && <p className="text-center text-xs text-slate-400">Loading messages...</p>}
            {conversation && !loadingMessages && messages.length === 0 && <p className="text-center text-xs text-slate-400">No messages yet. Send the first message below.</p>}
            {messages.map((message) => {
              const customerMessage = message.direction === "INCOMING";
              return (
                <div key={message.id} className={`flex ${customerMessage ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] ${customerMessage ? "text-right" : "text-left"}`}>
                    <p className="mb-1 text-[10px] text-slate-400">{customerMessage ? "You" : "Support"} · {messageTime(message.createdAt)}</p>
                    <div className={`space-y-2 rounded-2xl px-4 py-3 text-left text-sm shadow-sm ${customerMessage ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm bg-white text-slate-700"}`}>
                      {message.message && !isGeneratedMediaMessage(message.message) && <p className="whitespace-pre-wrap break-words">{message.message}</p>}
                      {message.imageUrl && <TestImageAttachment src={message.imageUrl} />}
                      {message.videoUrl && <TestVideoAttachment src={message.videoUrl} />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <footer className="shrink-0 border-t border-slate-100 bg-white p-4">
            {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}
            <input ref={imageInputRef} type="file" accept="image/*" onChange={uploadMedia} className="hidden" />
            <input ref={videoInputRef} type="file" accept="video/*" onChange={uploadMedia} className="hidden" />
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 focus-within:border-primary">
              <button type="button" onClick={() => imageInputRef.current?.click()} disabled={!conversation || sending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-primary disabled:opacity-30" title="Send image file"><Paperclip size={18} /></button>
              <button type="button" onClick={() => videoInputRef.current?.click()} disabled={!conversation || sending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-primary disabled:opacity-30" title="Send video"><Video size={18} /></button>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} disabled={!conversation || sending} className="h-9 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none disabled:cursor-not-allowed" placeholder={conversation ? "Type your message..." : "Select a conversation to send a message"} />
              <button type="button" onClick={sendMessage} disabled={!conversation || !draft.trim() || sending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-30" title="Send message">
                {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              </button>
            </div>
          </footer>
        </div>
      </section>

      {newConversationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewConversationOpen(false); }}>
          <form onSubmit={createConversation} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-primary"><MessageCircle size={21} /></div>
            <h2 className="mt-4 text-lg font-bold text-slate-800">Create New Conversation</h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">Optionally link a TikTok order. The order ID will be sent as the first customer message.</p>
            <label className="mt-5 block">
              <span className="mb-2 block text-xs font-semibold text-slate-700">Order ID <span className="font-normal text-slate-400">(optional)</span></span>
              <input value={newOrderId} onChange={(event) => setNewOrderId(event.target.value)} autoFocus className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-blue-100" placeholder="Example: 586038802860771002" />
            </label>
            <p className="mt-2 text-xs text-slate-400">Message format: <span className="font-semibold text-slate-500">orderId :{newOrderId.trim() || "123456"}</span></p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setNewConversationOpen(false)} className="h-10 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600">Cancel</button>
              <button type="submit" disabled={creating} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white disabled:opacity-50">
                {creating && <Loader2 size={15} className="animate-spin" />} Create
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
