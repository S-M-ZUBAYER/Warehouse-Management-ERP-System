// import { Bell, Search, User } from "lucide-react";
// import { useAuthStore } from "@/stores/authStore";
// import { useNotificationStore } from "@/stores/notificationStore";

// export default function Topbar() {
//   const user = useAuthStore((s) => s.user);
//   const unreadCount = useNotificationStore((s) => s.unreadCount);

//   return (
//     <header
//       className="h-16 bg-white border-b border-slate-200 flex items-center
//       justify-between px-6 flex-shrink-0 shadow-sm"
//     >
//       {/* Search */}
//       <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 w-72">
//         <Search size={16} className="text-slate-400" />
//         <input
//           type="text"
//           placeholder="Search anything..."
//           className="bg-transparent text-sm outline-none w-full text-slate-700
//             placeholder:text-slate-400"
//         />
//         <kbd className="text-xs text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
//           ⌘K
//         </kbd>
//       </div>

//       {/* Right side */}
//       <div className="flex items-center gap-3">
//         {/* Notifications */}
//         <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
//           <Bell size={18} className="text-slate-600" />
//           {unreadCount > 0 && (
//             <span
//               className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white
//               text-[10px] font-bold rounded-full flex items-center justify-center"
//             >
//               {unreadCount > 9 ? "9+" : unreadCount}
//             </span>
//           )}
//         </button>

//         {/* User Avatar */}
//         <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
//           <div
//             className="w-8 h-8 bg-primary rounded-full flex items-center
//             justify-center text-white text-sm font-semibold"
//           >
//             {user?.name?.[0]?.toUpperCase() || "A"}
//           </div>
//           <div className="hidden sm:block">
//             <p className="text-sm font-medium text-slate-800 leading-none">
//               {user?.name || "Admin"}
//             </p>
//             <p className="text-xs text-slate-500 mt-0.5">
//               {user?.role || "Warehouse Manager"}
//             </p>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronRight, User, KeyRound, Lock, LogOut } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";

// ─────────────────────────────────────────────────────────────────────────────
// Topbar — matches Figma design:
//   - Page title (passed as prop or from store)
//   - Bell notification icon
//   - Avatar + Name + Chevron dropdown
//   - Dropdown items: Profile Info, Reset Password, Set Password, Log Out
// ─────────────────────────────────────────────────────────────────────────────

export default function Topbar({ PageTitle }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const user = useAuthStore((state) => state.user);
  const userFulInfo = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  // const unreadCount = useNotificationStore((state) => state.unreadCount);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = userFulInfo?.fullName
    ? userFulInfo.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "WM";

  // ── Dropdown menu items (matches Figma exactly) ───────────────────────────
  const dropdownItems = [
    {
      icon: User,
      label: "Profile Info",
      onClick: () => {
        navigate("/settings/profile");
        setShowDropdown(false);
      },
    },
    {
      icon: KeyRound,
      label: "Reset Password",
      onClick: () => {
        navigate("/forgotpassword");
        setShowDropdown(false);
      },
    },
    {
      icon: Lock,
      label: "Set Password",
      onClick: () => {
        navigate("/settings/password");
        setShowDropdown(false);
      },
    },
    {
      icon: LogOut,
      label: "Log Out",
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <header
      className="flex items-center justify-between  flex-shrink-0"
      style={{
        height: "64px",
      }}
    >
      {/* Page Title */}
      <h1 className="text-2xl font-bold font-display text-primary">
        {PageTitle}
      </h1>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Bell */}
        <button className="relative w-11 h-11 flex items-center justify-center rounded-full transition-colors bg-white cursor-pointer hover:bg-slate-200">
          <Bell size={18} className="text-primary" strokeWidth={1.8} />
          {/* {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "#EF4444" }}
            />
          )} */}
        </button>

        {/* Profile dropdown */}
        <div className="relative bg-white rounded-3xl" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown((p) => !p)}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors cursor-pointer"
          >
            {/* Avatar circle */}
            <div
              className="w-10 h-10 font-display border-2 border-primary rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold"
              style={{
                background: userFulInfo?.image ? "none" : "#1E3A5F",
                color: "#F59E0B",
              }}
            >
              {userFulInfo?.image ? (
                <img
                  src={userFulInfo.image}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {/* Name */}
            <span
              className="text-sm max-w-36 pr-5 overflow-hidden whitespace-nowrap font-semibold font-body hidden sm:block"
              style={{
                color: "#0F172A",
              }}
            >
              {userFulInfo?.fullName}
            </span>

            {/* Chevron */}
            <ChevronRight
              size={14}
              color="#94A3B8"
              style={{
                transform: showDropdown ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {/* ── Dropdown Menu ── */}
          {showDropdown && (
            <div
              className="absolute right-0 top-full mt-2 rounded-2xl py-2 z-50"
              style={{
                width: "180px",
                background: "#FFFFFF",
                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                border: "1px solid #F1F5F9",
              }}
            >
              {dropdownItems.map(({ icon: Icon, label, onClick, danger }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className="flex items-center gap-3 w-full px-4 py-2.5 font-body text-sm transition-colors"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: danger ? "#EF4444" : "#374151",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = danger
                      ? "#FEF2F2"
                      : "#F8FAFC")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "none")
                  }
                >
                  <Icon size={14} strokeWidth={1.8} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
