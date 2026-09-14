import api from "../../lib/api";
import { fetchOrders } from "../orderManagement/shared/utils/orderApi";

const CHAT_REST_PREFIX = "/api/tiktok/customer-service";
const CHAT_LOCAL_STORAGE_PREFIX = "warehouse-chat";

const trimSlash = (value = "") => String(value || "").replace(/\/+$/, "");

const getJavaBaseUrl = () =>
  trimSlash(import.meta.env.VITE_TIKTOK_CHAT_API_BASE_URL || import.meta.env.VITE_ORDER_PLATFORM_BASE_URL || window.location.origin);

export const getChatWebSocketUrl = () => {
  const configured = import.meta.env.VITE_TIKTOK_CHAT_WS_URL;
  if (configured) return configured;

  const base = getJavaBaseUrl();
  try {
    const url = new URL(base, window.location.origin);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = "/ws";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "ws://localhost:8686/ws";
  }
};

const buildJavaUrl = (path, params = {}) => {
  const url = new URL(`${getJavaBaseUrl()}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const requestJson = async (path, { method = "GET", params, body } = {}) => {
  const response = await fetch(buildJavaUrl(path, params), {
    method,
    headers: body ? { "Content-Type": "application/json", Accept: "application/json" } : { Accept: "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed (${response.status})`);
  }
  return data;
};

const safeJsonGet = (key, fallback) => {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const value = localStorage.getItem(`${CHAT_LOCAL_STORAGE_PREFIX}:${key}`);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const safeJsonSet = (key, value) => {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(`${CHAT_LOCAL_STORAGE_PREFIX}:${key}`, JSON.stringify(value));
  } catch {
    // Local chat helpers should never break the live support screen.
  }
};

export const getStoredChatValue = safeJsonGet;
export const setStoredChatValue = safeJsonSet;

export const normalizeChatStore = (store = {}) => {
  const platform = String(store.platform || "").toLowerCase();
  const openId = store.store_open_id || store.openId || store.open_id || store.platform_open_id || "";
  const cipher = store.store_cipher || store.cipher || store.platform_cipher || "";
  const storeName =
    store.store_name ||
    store.external_store_name ||
    store.storeName ||
    store.name ||
    store.external_store_id ||
    `Store #${store.id || "-"}`;

  return {
    id: String(store.id ?? store.platform_store_id ?? store.store_id ?? ""),
    platform,
    label: storeName,
    openId,
    cipher,
    shopId: store.store_shop_id || store.shop_id || store.external_store_id || "",
    region: store.region || store.country || "",
    raw: store,
    disabled: !openId || !cipher || !platform.includes("tik"),
  };
};

const unwrapRows = (response) => {
  const payload = response?.data || response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const fetchChatStores = async () => {
  const response = await api.get("/platform-stores", { params: { page: 1, limit: 1000 } });
  return unwrapRows(response)
    .map(normalizeChatStore)
    .filter((store) => store.platform.includes("tik"));
};

export const normalizeConversation = (conversation = {}, store = {}) => {
  const conversationId = String(conversation.conversationId || conversation.conversation_id || conversation.id || "");
  const lastMessage = conversation.lastMessage || conversation.last_message || conversation.message || "";
  const updatedAt = conversation.updatedAt || conversation.updated_at || conversation.createdAt || conversation.created_at || "";
  const tags = safeJsonGet("conversation-tags", {});
  const assignments = safeJsonGet("conversation-assignments", {});
  return {
    ...conversation,
    id: conversationId,
    conversationId,
    openId: conversation.openId || store.openId || "",
    cipher: conversation.cipher || store.cipher || "",
    customerName: conversation.customerName || conversation.customer_name || tags[conversationId]?.customerName || `Customer ${conversationId.slice(-4) || ""}`.trim(),
    subject: conversation.subject || tags[conversationId]?.subject || "",
    lastMessage,
    messageCount: Number(conversation.messageCount || conversation.message_count || 0),
    lastMessageDirection: conversation.lastMessageDirection || conversation.last_message_direction || "",
    lastMessageSource: conversation.lastMessageSource || conversation.last_message_source || "",
    createdAt: conversation.createdAt || conversation.created_at || updatedAt,
    updatedAt,
    category: tags[conversationId]?.category || "",
    issue: tags[conversationId]?.issue || "",
    starred: Boolean(tags[conversationId]?.starred),
    assignedTo: assignments[conversationId] || "",
    store,
  };
};

export const normalizeMessage = (message = {}, fallback = {}) => {
  const source = message.savedMessage || message.saved_message || message;
  const id = source.id || message.id || `${source.conversationId || fallback.conversationId || "message"}-${source.createdAt || message.timestamp || Date.now()}`;
  const direction = String(source.direction || message.direction || fallback.direction || "INCOMING").toUpperCase();
  return {
    ...source,
    id: String(id),
    conversationId: String(source.conversationId || source.conversation_id || message.conversationId || fallback.conversationId || ""),
    openId: source.openId || message.openId || fallback.openId || "",
    cipher: source.cipher || message.cipher || fallback.cipher || "",
    message: source.message || message.message || "",
    imageUrl: source.imageUrl || source.image_url || message.imageUrl || "",
    videoUrl: source.videoUrl || source.video_url || message.videoUrl || "",
    fileUrl: source.fileUrl || source.file_url || message.fileUrl || "",
    fileName: source.fileName || source.file_name || message.fileName || source.originalFilename || "",
    mediaUrl: source.mediaUrl || source.media_url || message.mediaUrl || "",
    direction,
    incoming: direction !== "OUTGOING",
    source: source.source || message.source || "",
    status: message.status || source.status || "",
    createdAt: source.createdAt || source.created_at || message.createdAt || new Date(message.timestamp || Date.now()).toISOString(),
  };
};

export const fetchConversations = async ({ store, pageSize = 50, pageToken = "" }) => {
  if (!store?.openId || !store?.cipher) return { conversations: [], nextPageToken: null };
  const data = await requestJson(`${CHAT_REST_PREFIX}/conversations`, {
    params: {
      openId: store.openId,
      cipher: store.cipher,
      pageSize,
      pageToken,
    },
  });

  return {
    ...data,
    conversations: (data?.conversations || []).map((conversation) => normalizeConversation(conversation, store)),
    nextPageToken: data?.nextPageToken || data?.next_page_token || null,
  };
};

export const fetchConversationMessages = async ({ store, conversationId, pageSize = 100, pageToken = "" }) => {
  if (!store?.openId || !store?.cipher || !conversationId) return { messages: [], nextPageToken: null };
  const data = await requestJson(`${CHAT_REST_PREFIX}/conversations/${encodeURIComponent(conversationId)}/messages`, {
    params: {
      openId: store.openId,
      cipher: store.cipher,
      pageSize,
      pageToken,
    },
  });

  return {
    ...data,
    messages: (data?.messages || []).map((message) => normalizeMessage(message, {
      conversationId,
      openId: store.openId,
      cipher: store.cipher,
    })),
    nextPageToken: data?.nextPageToken || data?.next_page_token || null,
  };
};

export const sendConversationReply = async ({ store, conversationId, message }) => {
  const data = await requestJson(`${CHAT_REST_PREFIX}/conversations/${encodeURIComponent(conversationId)}/reply`, {
    method: "POST",
    params: {
      openId: store.openId,
      cipher: store.cipher,
    },
    body: { message },
  });
  return normalizeMessage(data?.savedMessage || data, {
    conversationId,
    openId: store.openId,
    cipher: store.cipher,
    direction: "OUTGOING",
  });
};

export const uploadConversationMedia = async ({ store, conversationId, file }) => {
  const formData = new FormData();
  formData.set("openId", store.openId);
  formData.set("cipher", store.cipher);
  formData.set("conversationId", conversationId);

  const type = String(file?.type || "").toLowerCase();
  if (type.startsWith("image/")) {
    formData.set("image", file);
  } else if (type.startsWith("video/")) {
    formData.set("video", file);
  } else {
    formData.set("file", file);
  }

  const response = await fetch(buildJavaUrl(`${CHAT_REST_PREFIX}/media/upload`), {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Upload failed (${response.status})`);
  }
  return normalizeMessage(data?.savedMessage || data, {
    conversationId,
    openId: store.openId,
    cipher: store.cipher,
    direction: "OUTGOING",
  });
};

const formatStompFrame = (command, headers = {}, body = "") => {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
  return `${command}\n${headerLines.join("\n")}\n\n${body}\u0000`;
};

const parseStompFrame = (frameText = "") => {
  const clean = frameText.split(String.fromCharCode(0)).join("");
  const [head, ...bodyParts] = clean.split("\n\n");
  const lines = head.split("\n").filter(Boolean);
  const command = lines.shift() || "";
  const headers = {};
  lines.forEach((line) => {
    const index = line.indexOf(":");
    if (index > -1) headers[line.slice(0, index)] = line.slice(index + 1);
  });
  const body = bodyParts.join("\n\n");
  return { command, headers, body };
};

const parseJsonBody = (body) => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

export function createTikTokChatSocket({ onConnected, onEvent, onError, onStatus } = {}) {
  let socket = null;
  let connected = false;
  let subscriptionId = 0;
  let pendingSubscriptions = [];

  const notifyStatus = (status) => onStatus?.(status);

  const sendRaw = (frame) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(frame);
    return true;
  };

  const subscribe = (destination, id = `sub-${subscriptionId += 1}`) => {
    const payload = { destination, id };
    if (!connected) {
      pendingSubscriptions.push(payload);
      return id;
    }
    sendRaw(formatStompFrame("SUBSCRIBE", { id, destination, ack: "auto" }));
    return id;
  };

  const unsubscribe = (id) => {
    pendingSubscriptions = pendingSubscriptions.filter((item) => item.id !== id);
    if (connected) sendRaw(formatStompFrame("UNSUBSCRIBE", { id }));
  };

  const flushSubscriptions = () => {
    pendingSubscriptions.forEach(({ destination, id }) => {
      sendRaw(formatStompFrame("SUBSCRIBE", { id, destination, ack: "auto" }));
    });
  };

  const connect = () => {
    if (socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(socket.readyState)) return;
    notifyStatus("connecting");
    socket = new WebSocket(getChatWebSocketUrl());
    socket.onopen = () => {
      sendRaw(formatStompFrame("CONNECT", {
        "accept-version": "1.2",
        host: window.location.hostname || "localhost",
        "heart-beat": "0,0",
      }));
    };
    socket.onmessage = (event) => {
      String(event.data || "")
        .split("\u0000")
        .filter(Boolean)
        .forEach((chunk) => {
          const frame = parseStompFrame(`${chunk}\u0000`);
          if (frame.command === "CONNECTED") {
            connected = true;
            notifyStatus("connected");
            flushSubscriptions();
            onConnected?.();
            return;
          }
          if (frame.command === "ERROR") {
            onError?.(new Error(frame.body || "WebSocket error"));
            return;
          }
          if (frame.command === "MESSAGE") {
            onEvent?.({
              destination: frame.headers.destination,
              body: parseJsonBody(frame.body),
              rawBody: frame.body,
            });
          }
        });
    };
    socket.onerror = () => {
      notifyStatus("error");
      onError?.(new Error("Chat WebSocket connection failed"));
    };
    socket.onclose = () => {
      connected = false;
      notifyStatus("disconnected");
    };
  };

  const disconnect = () => {
    if (connected) sendRaw(formatStompFrame("DISCONNECT"));
    connected = false;
    if (socket) socket.close();
    socket = null;
    pendingSubscriptions = [];
  };

  return { connect, disconnect, subscribe, unsubscribe };
}

export const buildOrderContextFromStore = (store = {}) => ({
  platform: "tiktok",
  store: store.label,
  platform_store_id: store.id,
  platform_open_id: store.openId,
  cipher: store.cipher,
  shop_id: store.shopId,
  external_store_id: store.shopId,
  external_store_name: store.label,
  region: store.region,
});

const extractReferenceTerms = (conversation, messages = []) => {
  const text = [
    conversation?.conversationId,
    conversation?.subject,
    conversation?.lastMessage,
    ...messages.map((message) => message.message),
  ].join(" ");
  const matches = text.match(/\b[A-Z0-9][A-Z0-9-]{5,}\b/gi) || [];
  return [...new Set(matches.map((value) => value.trim()).filter(Boolean))].slice(0, 6);
};

export const fetchConversationContext = async ({ store, conversation, messages }) => {
  const terms = extractReferenceTerms(conversation, messages);
  if (!store?.id || !terms.length) return { terms, orders: [], returns: [] };

  const orderContext = buildOrderContextFromStore(store);
  const [ordersResult, returnsResult] = await Promise.allSettled([
    Promise.all(
      terms.map((term) =>
        fetchOrders({
          context: orderContext,
          pageType: "all",
          search: term,
          searchType: "Single Search",
          skuType: "Order Number",
        })
      )
    ),
    Promise.all(
      terms.map((term) =>
        api.get("/return-orders", {
          params: {
            page: 1,
            limit: 5,
            platform: "tiktok",
            storeId: store.id,
            search: term,
            searchType: "Single Search",
            skuType: "Order Number",
          },
        })
      )
    ),
  ]);

  const orders = ordersResult.status === "fulfilled"
    ? ordersResult.value.flatMap((rows) => (Array.isArray(rows) ? rows : rows?.orders || [])).slice(0, 5)
    : [];
  const returns = returnsResult.status === "fulfilled"
    ? returnsResult.value.flatMap((response) => unwrapRows(response)).slice(0, 5)
    : [];

  return { terms, orders, returns };
};
