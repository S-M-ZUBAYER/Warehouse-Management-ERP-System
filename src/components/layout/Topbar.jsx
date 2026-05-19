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

// import { useState, useRef, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Bell, ChevronRight, User, KeyRound, Lock, LogOut } from "lucide-react";
// import { useAuthStore } from "../../stores/authStore";

// // ─────────────────────────────────────────────────────────────────────────────
// // Topbar — matches Figma design:
// //   - Page title (passed as prop or from store)
// //   - Bell notification icon
// //   - Avatar + Name + Chevron dropdown
// //   - Dropdown items: Profile Info, Reset Password, Set Password, Log Out
// // ─────────────────────────────────────────────────────────────────────────────

// export default function Topbar({ PageTitle }) {
//   const navigate = useNavigate();
//   const [showDropdown, setShowDropdown] = useState(false);
//   const dropdownRef = useRef(null);

//   const user = useAuthStore((state) => state.user);
//   const userFulInfo = useAuthStore((state) => state.token);
//   const logout = useAuthStore((state) => state.logout);
//   // const unreadCount = useNotificationStore((state) => state.unreadCount);

//   // Close dropdown on outside click
//   useEffect(() => {
//     const handler = (e) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//         setShowDropdown(false);
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, []);

//   const handleLogout = () => {
//     logout();
//     navigate("/warehouse_management/login");
//   };

//   const initials = userFulInfo?.fullName
//     ? userFulInfo.fullName
//         .split(" ")
//         .map((n) => n[0])
//         .join("")
//         .toUpperCase()
//         .slice(0, 2)
//     : "WM";

//   // ── Dropdown menu items (matches Figma exactly) ───────────────────────────
//   const dropdownItems = [
//     {
//       icon: User,
//       label: "Profile Info",
//       onClick: () => {
//         navigate("/warehouse_management/settings/profile");
//         setShowDropdown(false);
//       },
//     },
//     {
//       icon: KeyRound,
//       label: "Reset Password",
//       onClick: () => {
//         navigate("/warehouse_management/forgotpassword");
//         setShowDropdown(false);
//       },
//     },
//     {
//       icon: Lock,
//       label: "Set Password",
//       onClick: () => {
//         navigate("/warehouse_management/settings/password");
//         setShowDropdown(false);
//       },
//     },
//     {
//       icon: LogOut,
//       label: "Log Out",
//       onClick: handleLogout,
//       danger: true,
//     },
//   ];

//   return (
//     <header
//       className="flex items-center justify-between  flex-shrink-0"
//       style={{
//         height: "64px",
//       }}
//     >
//       {/* Page Title */}
//       <h1 className="text-[28px] font-semibold font-display text-primary-text">
//         {PageTitle}
//       </h1>

//       {/* Right side */}
//       <div className="flex items-center gap-3">
//         {/* Bell */}
//         <button className="relative w-11 h-11 flex items-center justify-center rounded-full transition-colors bg-white cursor-pointer hover:bg-slate-200">
//           <Bell size={18} className="text-primary" strokeWidth={1.8} />
//           {/* {unreadCount > 0 && (
//             <span
//               className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
//               style={{ background: "#EF4444" }}
//             />
//           )} */}
//         </button>

//         {/* Profile dropdown */}
//         <div className="relative bg-white rounded-3xl" ref={dropdownRef}>
//           <button
//             onClick={() => setShowDropdown((p) => !p)}
//             className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors cursor-pointer"
//           >
//             {/* Avatar circle */}
//             <div
//               className="w-10 h-10 font-display border-2 border-primary rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold"
//               style={{
//                 background: userFulInfo?.image ? "none" : "#1E3A5F",
//                 color: "#F59E0B",
//               }}
//             >
//               {userFulInfo?.image ? (
//                 <img
//                   src={
//                     userFulInfo.image?.startsWith("data:image")
//                       ? userFulInfo.image
//                       : `data:image/jpeg;base64,${userFulInfo.image}`
//                   }
//                   alt="user"
//                 />
//               ) : (
//                 initials
//               )}
//             </div>

//             {/* Name */}
//             <span
//               className="text-sm max-w-36 pr-5 overflow-hidden whitespace-nowrap font-semibold font-body hidden sm:block"
//               style={{
//                 color: "#0F172A",
//               }}
//             >
//               {userFulInfo?.fullName}
//             </span>

//             {/* Chevron */}
//             <ChevronRight
//               size={14}
//               color="#94A3B8"
//               style={{
//                 transform: showDropdown ? "rotate(90deg)" : "rotate(0deg)",
//                 transition: "transform 0.2s",
//               }}
//             />
//           </button>

//           {/* ── Dropdown Menu ── */}
//           {showDropdown && (
//             <div
//               className="absolute right-0 top-full mt-2 rounded-2xl py-2 z-50"
//               style={{
//                 width: "180px",
//                 background: "#FFFFFF",
//                 boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
//                 border: "1px solid #F1F5F9",
//               }}
//             >
//               {dropdownItems.map(({ icon: Icon, label, onClick, danger }) => (
//                 <button
//                   key={label}
//                   onClick={onClick}
//                   className="flex items-center gap-3 w-full px-4 py-2.5 font-body text-sm transition-colors"
//                   style={{
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     color: danger ? "#EF4444" : "#374151",
//                     textAlign: "left",
//                   }}
//                   onMouseEnter={(e) =>
//                     (e.currentTarget.style.background = danger
//                       ? "#FEF2F2"
//                       : "#F8FAFC")
//                   }
//                   onMouseLeave={(e) =>
//                     (e.currentTarget.style.background = "none")
//                   }
//                 >
//                   <Icon size={14} strokeWidth={1.8} />
//                   {label}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }

// src/components/layout/Topbar.jsx
// ─────────────────────────────────────────────────────────────────────────────
// CHANGES FROM ORIGINAL:
//   - PageTitle prop is now optional. When AppShell renders this inline with
//     ShopPlatformSelector, PageTitle is passed from the individual page
//     (same as before via prop). If omitted it shows nothing.
//   - No other logic changes — user menu, logout, etc. unchanged.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, ChevronRight, User, KeyRound, Lock, LogOut, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const parseJson = (value) => {
    try { return value ? JSON.parse(value) : null; } catch { return null; }
};

const getFirstValue = (...values) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== '');

const normalizeImageSrc = (image) => {
    if (!image) return '';
    const src = String(image);
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:image')) return src;
    return `data:image/jpeg;base64,${src}`;
};

export default function Topbar({ PageTitle, showBack = false, onBack }) {
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const dropdownRef = useRef(null);

    const authUser = useAuthStore((state) => state.user);
    const authTokenData = useAuthStore((state) => state.token);
    const logout = useAuthStore((state) => state.logout);

    const profile = useMemo(() => {
        const storedWarehouseUser = parseJson(localStorage.getItem('warehouseUser')) || {};
        const oldApiUser = typeof authTokenData === 'object' && authTokenData ? authTokenData : {};
        const zustandUser = typeof authUser === 'object' && authUser ? authUser : {};
        const email = typeof authUser === 'string' ? authUser : undefined;

        const fullName = getFirstValue(
            oldApiUser.fullName,
            oldApiUser.userName,
            oldApiUser.name,
            zustandUser.fullName,
            zustandUser.userName,
            zustandUser.name,
            storedWarehouseUser.fullName,
            storedWarehouseUser.userName,
            storedWarehouseUser.name,
            email,
            'User'
        );

        const image = getFirstValue(
            oldApiUser.image,
            oldApiUser.photo,
            oldApiUser.avatar,
            zustandUser.image,
            zustandUser.photo,
            zustandUser.avatar,
            storedWarehouseUser.image,
            storedWarehouseUser.photo,
            storedWarehouseUser.avatar,
            storedWarehouseUser.avatarUrl
        );

        const emailValue = getFirstValue(
            oldApiUser.email,
            oldApiUser.userEmail,
            zustandUser.email,
            zustandUser.userEmail,
            storedWarehouseUser.email,
            storedWarehouseUser.userEmail,
            email
        );
        const role = getFirstValue(
            oldApiUser.role,
            oldApiUser.roleName,
            oldApiUser.roleInfo?.name,
            zustandUser.role,
            zustandUser.roleName,
            zustandUser.roleInfo?.name,
            storedWarehouseUser.role,
            storedWarehouseUser.roleName,
            storedWarehouseUser.roleInfo?.name
        );
        const accountId = getFirstValue(
            oldApiUser.accountId,
            oldApiUser.account_id,
            oldApiUser.userId,
            zustandUser.accountId,
            zustandUser.account_id,
            zustandUser.userId,
            storedWarehouseUser.accountId,
            storedWarehouseUser.account_id,
            storedWarehouseUser.userId
        );
        const phone = getFirstValue(
            oldApiUser.phone,
            oldApiUser.phoneNumber,
            zustandUser.phone,
            zustandUser.phoneNumber,
            storedWarehouseUser.phone,
            storedWarehouseUser.phoneNumber
        );
        const department = getFirstValue(oldApiUser.department, zustandUser.department, storedWarehouseUser.department);
        const designation = getFirstValue(oldApiUser.designation, zustandUser.designation, storedWarehouseUser.designation);
        const warehouse = getFirstValue(
            oldApiUser.warehouse?.name,
            oldApiUser.warehouseName,
            zustandUser.warehouse?.name,
            zustandUser.warehouseName,
            storedWarehouseUser.warehouse?.name,
            storedWarehouseUser.warehouseName
        );

        return {
            fullName,
            image: normalizeImageSrc(image),
            email: emailValue,
            role,
            accountId,
            phone,
            department,
            designation,
            warehouse,
        };
    }, [authUser, authTokenData]);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/warehouse_management/login');
    };

    const initials = profile.fullName
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    const profileRows = [
        ['Name', profile.fullName],
        ['Email', profile.email],
        ['Account ID', profile.accountId],
        ['Role', profile.role],
        ['Phone', profile.phone],
        ['Department', profile.department],
        ['Designation', profile.designation],
        ['Warehouse', profile.warehouse],
    ];

    const dropdownItems = [
        {
            icon: User, label: 'Profile Info',
            onClick: () => { setShowProfileModal(true); setShowDropdown(false); },
        },
        // {
        //     icon: KeyRound, label: 'Reset Password',
        //     onClick: () => { navigate('/warehouse_management/forgotpassword'); setShowDropdown(false); },
        // },
        // {
        //     icon: Lock, label: 'Set Password',
        //     onClick: () => { navigate('/warehouse_management/settings/password'); setShowDropdown(false); },
        // },
        { icon: LogOut, label: 'Log Out', onClick: handleLogout, danger: true },
    ];

    return (
        <header className="flex items-center justify-between flex-shrink-0" style={{ height: '64px' }}>
            {PageTitle && (
                <div className="flex items-center gap-3">
                    {showBack ? (
                        <button
                            type="button"
                            onClick={onBack}
                            className="group flex items-center gap-3 rounded-lg text-primary-text transition-colors hover:text-primary"
                            aria-label={PageTitle}
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-white text-slate-600 transition-colors group-hover:bg-surface-card group-hover:text-primary">
                                <ArrowLeft size={18} />
                            </span>
                            <span className="text-[26px] font-semibold font-display">
                                {PageTitle}
                            </span>
                        </button>
                    ) : (
                        <h1 className="text-[26px] font-semibold font-display text-primary-text">
                            {PageTitle}
                        </h1>
                    )}
                </div>
            )}

            <div className="flex items-center gap-3 ml-auto">
                <button className="relative w-11 h-11 flex items-center justify-center rounded-full transition-colors bg-white cursor-pointer hover:bg-slate-200">
                    <Bell size={18} className="text-primary" strokeWidth={1.8} />
                </button>

                <div className="relative bg-white rounded-3xl" ref={dropdownRef}>
                    <button
                        onClick={() => setShowDropdown((p) => !p)}
                        className="flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors cursor-pointer"
                    >
                        <div
                            className="w-9 h-9 font-display border-2 border-primary rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 text-xs font-bold"
                            style={{ background: profile.image ? 'none' : '#1E3A5F', color: '#F59E0B' }}
                        >
                            {profile.image ? (
                                <img src={profile.image} alt="user" className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <span
                            className="text-sm max-w-36 pr-5 overflow-hidden whitespace-nowrap font-semibold font-body hidden sm:block"
                            style={{ color: '#0F172A' }}
                            title={profile.fullName}
                        >
                            {profile.fullName}
                        </span>
                        <ChevronRight
                            size={18}
                            color="#0F172A"
                            style={{ transform: showDropdown ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                        />
                    </button>

                    {showDropdown && (
                        <div
                            className="absolute right-0 top-full mt-2 rounded-2xl py-2 z-50"
                            style={{ width: '180px', background: '#FFFFFF', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', border: '1px solid #F1F5F9' }}
                        >
                            {dropdownItems.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={item.onClick}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 font-body text-sm transition-colors"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: item.danger ? '#EF4444' : '#374151', textAlign: 'left' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = item.danger ? '#FEF2F2' : '#F8FAFC')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                >
                                    <item.icon size={14} strokeWidth={1.8} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {showProfileModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                    <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-start justify-between px-6 py-4 border-b border-surface-border">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 font-display">Profile Info</h2>
                                <p className="text-xs text-slate-500 mt-1">Signed-in account details</p>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-5">
                                <div
                                    className="w-16 h-16 border-2 border-primary rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 text-base font-bold"
                                    style={{ background: profile.image ? 'none' : '#1E3A5F', color: '#F59E0B' }}
                                >
                                    {profile.image ? (
                                        <img src={profile.image} alt="user" className="w-full h-full object-cover" />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-slate-800 truncate">{profile.fullName}</p>
                                    <p className="text-xs text-slate-500 truncate">{profile.email || 'No email found'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                {profileRows.map(([label, value]) => (
                                    <div key={label} className="rounded-xl border border-surface-border bg-slate-50/70 px-4 py-3">
                                        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-1">{label}</p>
                                        <p className="text-sm text-slate-800 break-words">{value || '-'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end px-6 py-4 border-t border-surface-border">
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
