import { create } from "zustand";
import { persist } from "zustand/middleware";
import { queryClient } from "@/lib/queryClient";

export const DASHBOARD_TAB_ID = "/warehouse_management";

const dashboardTab = {
  id: DASHBOARD_TAB_ID,
  path: "/warehouse_management",
  search: "",
  reloadKey: 0,
  pinned: true,
  createdAt: Date.now(),
};

const normalizeTab = (tab) => {
  const path = typeof tab?.path === "string" && tab.path.startsWith("/")
    ? tab.path
    : "/warehouse_management";
  const search = typeof tab?.search === "string" ? tab.search : "";

  return {
    id: tab?.id || `${path}${search}`,
    path,
    search,
    reloadKey: Number(tab?.reloadKey) || 0,
    pinned: Boolean(tab?.pinned || path === "/warehouse_management"),
    createdAt: Number(tab?.createdAt) || Date.now(),
  };
};

const sanitizeTabs = (tabs) => {
  const seen = new Set();
  const safeTabs = [dashboardTab, ...(Array.isArray(tabs) ? tabs : [])]
    .map(normalizeTab)
    .filter((tab) => tab.path.startsWith("/warehouse_management"))
    .filter((tab) => {
      if (seen.has(tab.id)) return false;
      seen.add(tab.id);
      return true;
    });

  return safeTabs.length ? safeTabs : [dashboardTab];
};

export const useWorkspaceTabsStore = create(
  persist(
    (set, get) => ({
      tabs: [dashboardTab],
      activeTabId: DASHBOARD_TAB_ID,

      openTab: (tab) => {
        const normalized = normalizeTab(tab);
        set((state) => {
          const tabs = sanitizeTabs(state.tabs);
          const exists = tabs.some((item) => item.id === normalized.id);

          return {
            tabs: exists ? tabs : [...tabs, normalized],
            activeTabId: normalized.id,
          };
        });
      },

      setActiveTab: (tabId) => {
        const found = get().tabs.find((tab) => tab.id === tabId);
        if (found) set({ activeTabId: tabId });
      },

      closeTab: (tabId) => {
        const tabs = sanitizeTabs(get().tabs);
        const targetIndex = tabs.findIndex((tab) => tab.id === tabId);
        const target = tabs[targetIndex];

        if (!target || target.pinned) {
          return { nextTab: null, closedActive: false };
        }

        const nextTabs = tabs.filter((tab) => tab.id !== tabId);
        const closedActive = get().activeTabId === tabId;
        const fallbackTab =
          nextTabs[Math.max(0, targetIndex - 1)] ||
          nextTabs[targetIndex] ||
          nextTabs[0] ||
          dashboardTab;

        set({
          tabs: nextTabs,
          activeTabId: closedActive ? fallbackTab.id : get().activeTabId,
        });

        return { nextTab: closedActive ? fallbackTab : null, closedActive };
      },

      reloadTab: (tabId) => {
        let reloadedTab = null;

        set((state) => {
          const tabs = sanitizeTabs(state.tabs).map((tab) => {
            if (tab.id !== tabId) return tab;
            reloadedTab = { ...tab, reloadKey: tab.reloadKey + 1 };
            return reloadedTab;
          });

          return { tabs };
        });

        if (reloadedTab) {
          void queryClient.invalidateQueries({ refetchType: "active" });
          window.dispatchEvent(
            new CustomEvent("workspace-tab-reload", {
              detail: { path: reloadedTab.path, search: reloadedTab.search },
            })
          );
        }
      },
    }),
    {
      name: "warehouseWorkspaceTabs",
      partialize: (state) => ({
        tabs: sanitizeTabs(state.tabs),
        activeTabId: state.activeTabId,
      }),
      merge: (persistedState, currentState) => {
        const tabs = sanitizeTabs(persistedState?.tabs);
        const activeTabId = tabs.some((tab) => tab.id === persistedState?.activeTabId)
          ? persistedState.activeTabId
          : DASHBOARD_TAB_ID;

        return {
          ...currentState,
          tabs,
          activeTabId,
        };
      },
    }
  )
);
