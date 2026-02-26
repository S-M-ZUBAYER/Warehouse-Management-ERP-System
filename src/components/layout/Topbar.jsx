import { Bell, Search, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";

export default function Topbar() {
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <header
      className="h-16 bg-white border-b border-slate-200 flex items-center
      justify-between px-6 flex-shrink-0 shadow-sm"
    >
      {/* Search */}
      <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-72">
        <Search size={16} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search anything..."
          className="bg-transparent text-sm outline-none w-full text-slate-700
            placeholder:text-slate-400"
        />
        <kbd className="text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell size={18} className="text-slate-600" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white
              text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div
            className="w-8 h-8 bg-primary rounded-full flex items-center
            justify-center text-white text-sm font-semibold"
          >
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-none">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.role || "Warehouse Manager"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
