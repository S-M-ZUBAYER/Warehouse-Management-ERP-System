// import { CheckCircle2, Loader2 } from "lucide-react";
// import { useEffect, useMemo, useState } from "react";
// import api from "@/lib/api";
// import { useInitShopPlatform } from "@/stores/useInitShopPlatform";
// import { useShopPlatformStore } from "@/stores/shopPlatformStore";
// import { toast } from "sonner";

// const CHECKOUT_ENDPOINT = "/subscription/checkout";
// const FALLBACK_PLATFORMS = ["TikTok", "Shopee", "Lazada"];
// const FALLBACK_STORES = ["TIMOZIA", "Grozziie", "Printer Noble", "Easy Parcel"];
// const PLATFORM_UNASSIGNED = "unassigned";

// const plans = [
//   {
//     packageName: "Basic",
//     amount: 3,
//     duration: "03 Months",
//     facilities: [
//       "3-months subscription duration",
//       "Access to all current TikTok orders",
//       "Package and ship orders directly",
//       "Process multiple orders at once",
//       "Customer support available",
//     ],
//   },
//   {
//     packageName: "Standard",
//     amount: 5,
//     duration: "06 Months",
//     facilities: [
//       "6-months subscription duration",
//       "Access to all current TikTok orders",
//       "Package and ship orders directly",
//       "Process multiple orders at once",
//       "Customer support available",
//     ],
//   },
//   {
//     packageName: "Pro",
//     amount: 9,
//     duration: "12 Months",
//     facilities: [
//       "12-months subscription duration",
//       "Access to all current TikTok orders",
//       "Package and ship orders directly",
//       "Process multiple orders at once",
//       "Customer support available",
//     ],
//   },
//   {
//     packageName: "Ultimate",
//     amount: 16,
//     duration: "24 Months",
//     facilities: [
//       "24-months subscription duration",
//       "Access to all current TikTok orders",
//       "Package and ship orders directly",
//       "Process multiple orders at once",
//       "Customer support available",
//     ],
//   },
// ];

// function toPlural(count) {
//   return count === 1 ? "store" : "stores";
// }

// function cleanLabel(value) {
//   return String(value || "").trim();
// }

// function normalizeCaseInsensitive(value) {
//   return cleanLabel(value).toLowerCase();
// }

// function uniquePreserveFirst(items) {
//   const seen = new Set();
//   return items.filter((item) => {
//     const key = normalizeCaseInsensitive(item);
//     if (!key || seen.has(key)) return false;
//     seen.add(key);
//     return true;
//   });
// }

// function toCanonicalSelection(values, allowedValues) {
//   const canonicalLookup = new Map(
//     allowedValues.map((value) => [normalizeCaseInsensitive(value), value]),
//   );
//   return values
//     .map((value) => canonicalLookup.get(normalizeCaseInsensitive(value)))
//     .filter(Boolean);
// }

// function sameItemsAsSet(left, right) {
//   if (left.length !== right.length) return false;

//   const leftSet = new Set(left);
//   const rightSet = new Set(right);

//   if (leftSet.size !== rightSet.size) return false;

//   for (const item of leftSet) {
//     if (!rightSet.has(item)) return false;
//   }

//   return true;
// }

// function extractPlatformOptions(platformRows) {
//   return uniquePreserveFirst(
//     (platformRows ?? [])
//       .map((row) => cleanLabel(row?.label || row?.value || row?.name || row?.platform || row))
//       .filter(Boolean),
//   );
// }

// function parseStorePlatform(row) {
//   return cleanLabel(
//     row?.platform ??
//       row?.platform_name ??
//       row?.platformName ??
//       row?.marketplace ??
//       row?.channel ??
//       row?.market ??
//       row?.store_platform,
//   );
// }

// function extractStoreOptions(storeRows, fallbackPlatforms = FALLBACK_PLATFORMS) {
//   const rows = Array.isArray(storeRows) ? storeRows : [];

//   if (!rows.length) {
//     const fallbackPlatform = fallbackPlatforms[0] || FALLBACK_PLATFORMS[0];
//     return FALLBACK_STORES.map((store) => ({
//       label: cleanLabel(store),
//       platform: normalizeCaseInsensitive(fallbackPlatform) || PLATFORM_UNASSIGNED,
//       platformLabel: cleanLabel(fallbackPlatform),
//     }));
//   }

//   const seen = new Set();
//   const normalizedRows = rows
//     .map((row) => {
//       const label = cleanLabel(
//         row?.label ||
//           row?.store_name ||
//           row?.external_store_name ||
//           row?.name ||
//           row?.nickname ||
//           row?.shop_name ||
//           row,
//       );
//       if (!label) return null;

//       const platformLabel = parseStorePlatform(row);
//       const platform = normalizeCaseInsensitive(platformLabel) || PLATFORM_UNASSIGNED;

//       return {
//         label,
//         platform,
//         platformLabel: platformLabel || platform,
//       };
//     })
//     .filter(Boolean);

//   const filteredRows = normalizedRows.filter((row) => {
//     const key = `${row.platform}|${normalizeCaseInsensitive(row.label)}`;
//     if (seen.has(key)) return false;
//     seen.add(key);
//     return true;
//   });

//   if (!filteredRows.length) {
//     return FALLBACK_STORES.map((store) => ({
//       label: cleanLabel(store),
//       platform: PLATFORM_UNASSIGNED,
//       platformLabel: "Other",
//     }));
//   }

//   return filteredRows;
// }

// function platformLabelForKey(platformKey, platformOptions = []) {
//   const normalized = normalizeCaseInsensitive(platformKey);
//   const platform = platformOptions.find(
//     (value) => normalizeCaseInsensitive(value) === normalized,
//   );

//   return platform || cleanLabel(platformKey) || "Other";
// }

// function getSentenceLabel(items) {
//   if (items.length <= 1) return items[0] || "";
//   const clone = [...items];
//   const last = clone.pop();
//   return `${clone.join(", ")} and ${last}`;
// }

// function toggleValue(currentValues, value) {
//   if (currentValues.includes(value)) {
//     return currentValues.filter((item) => item !== value);
//   }

//   return [...currentValues, value];
// }

// function pluralize(count, singularLabel, pluralLabel) {
//   return count === 1 ? singularLabel : pluralLabel;
// }

// function SelectionCheckbox({ checked, label, onChange, disabled = false }) {
//   return (
//     <label
//       className={`flex h-8 items-center gap-2 rounded-md border border-transparent px-3 text-[14px] font-medium ${
//         disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
//       } text-[#1f2937]`}
//     >
//       <input
//         type="checkbox"
//         checked={checked}
//         onChange={onChange}
//         disabled={disabled}
//         className="checkbox checkbox-sm border-[#9ca3af] checked:border-[#004368] checked:bg-[#004368] checked:text-white"
//       />
//       <span>{label}</span>
//     </label>
//   );
// }

// function PlanCard({
//   plan,
//   activePlan,
//   setActivePlan,
//   storeCount,
//   isSelectionReady,
//   isCheckoutLoading,
//   anyCheckoutLoading,
//   onChoosePlan,
// }) {
//   const isActive = activePlan === plan.packageName;
//   const price = plan.amount * storeCount;
//   const durationParts = plan.duration.split(" ");

//   return (
//     <article
//       className={`relative flex h-[523px] w-[300px] flex-col items-center px-6 py-7 transition-all duration-300 ${
//         isActive
//           ? "z-20 scale-[1.03] rounded-full border-2 border-[#004368] bg-[#004368] text-white shadow-2xl ring-8 ring-[#004368] ring-opacity-20"
//           : "z-10 rounded-full border-2 border-[#CBD5E1] bg-white text-black"
//       }`}
//       onMouseEnter={() => setActivePlan(plan.packageName)}
//     >
//       <span
//         className={`badge px-5 py-[14px] text-lg font-medium ${
//           isActive ? "bg-white/15 text-white" : "bg-[#edf2f5] text-[#004368]"
//         }`}
//       >
//         {plan.packageName}
//       </span>

//       <div className="my-12 flex items-center justify-center">
//         <span
//           className={`text-[32px] font-bold leading-none ${
//             isActive ? "text-white" : "text-[#004368]"
//           }`}
//         >
//           ${price}
//         </span>
//         <span
//           className={`mb-0.5 ml-1 text-[14px] leading-none ${
//             isActive ? "text-white" : "text-black"
//           }`}
//         >
//           /{durationParts[0]} {durationParts[1]}
//         </span>
//       </div>

//       <div className="mb-10 mt-2 w-full space-y-[20px]">
//         {plan.facilities.map((facility) => (
//           <p
//             key={facility}
//             className="flex items-center gap-x-2 text-sm font-light"
//           >
//             <CheckCircle2
//               size={15}
//               strokeWidth={1.6}
//               className={isActive ? "text-white" : "text-[#004368]"}
//             />
//             <span>{facility}</span>
//           </p>
//         ))}
//       </div>

//       <button
//         type="button"
//         onClick={() => onChoosePlan(plan)}
//         onMouseEnter={() => setActivePlan(plan.packageName)}
//         className={`mt-auto h-10 w-[180px] rounded-full px-2 py-2 text-center text-lg font-medium transition-colors ${
//           isActive && isSelectionReady
//             ? "bg-[#004368] text-white"
//             : isSelectionReady
//               ? "bg-white text-[#004368] ring-1 ring-[#004368]"
//               : "bg-slate-300 text-white"
//         }`}
//         disabled={anyCheckoutLoading || !isSelectionReady}
//       >
//         {isCheckoutLoading ? (
//           <span className="inline-flex items-center gap-2">
//             <Loader2 size={16} className="animate-spin" />
//             Processing
//           </span>
//         ) : (
//           "Choose Plan"
//         )}
//       </button>
//     </article>
//   );
// }

// export default function PricingPage() {
//   useInitShopPlatform();
//   const dropdownPlatforms = useShopPlatformStore((state) => state.platforms);
//   const dropdownStores = useShopPlatformStore((state) => state.stores);
//   const hasDropdownsLoaded = useShopPlatformStore((state) => state.dropdownsLoaded);

//   const platformOptions = useMemo(
//     () => extractPlatformOptions(dropdownPlatforms),
//     [dropdownPlatforms],
//   );
//   const availablePlatforms = platformOptions.length
//     ? platformOptions
//     : FALLBACK_PLATFORMS;
//   const storeOptions = useMemo(
//     () => extractStoreOptions(dropdownStores, availablePlatforms),
//     [dropdownStores, availablePlatforms],
//   );
//   const availableStores = storeOptions.length
//     ? storeOptions.map((store) => store.label)
//     : FALLBACK_STORES;

//   const [selectedPlatforms, setSelectedPlatforms] = useState([]);
//   const [selectedStores, setSelectedStores] = useState([]);
//   const [activePlan, setActivePlan] = useState("Standard");
//   const [isCheckingOut, setIsCheckingOut] = useState(false);
//   const [checkingPlan, setCheckingPlan] = useState(null);

//   useEffect(() => {
//     if (selectedPlatforms[0]) {
//       localStorage.setItem("SelectedPlatform", selectedPlatforms[0]);
//     } else {
//       localStorage.removeItem("SelectedPlatform");
//     }

//     if (selectedStores[0]) {
//       localStorage.setItem("SelectedStore", selectedStores[0]);
//     } else {
//       localStorage.removeItem("SelectedStore");
//     }

//     localStorage.setItem("SelectedPlatforms", JSON.stringify(selectedPlatforms));
//     localStorage.setItem("SelectedStores", JSON.stringify(selectedStores));
//   }, [selectedPlatforms, selectedStores]);

//   useEffect(() => {
//     if (!hasDropdownsLoaded) return;

//     const canonicalPlatforms = toCanonicalSelection(selectedPlatforms, availablePlatforms);
//     if (!sameItemsAsSet(selectedPlatforms, canonicalPlatforms)) {
//       setSelectedPlatforms(canonicalPlatforms);
//       return;
//     }

//     const selectedPlatformSet = new Set(
//       canonicalPlatforms.map((platform) => normalizeCaseInsensitive(platform)),
//     );
//     const allowedStoreLabels = storeOptions
//       .filter((store) => selectedPlatformSet.has(store.platform))
//       .map((store) => store.label);

//     setSelectedStores((current) => {
//       const canonical = toCanonicalSelection(current, availableStores);
//       const restricted = canonical.filter((store) =>
//         allowedStoreLabels.includes(store),
//       );

//       if (!restricted.length) return [];

//       return !sameItemsAsSet(current, restricted) ? restricted : current;
//     });
//   }, [
//     hasDropdownsLoaded,
//     availablePlatforms,
//     availableStores,
//     storeOptions,
//     selectedPlatforms,
//   ]);

//   const selectedPlatformSet = useMemo(
//     () => new Set(selectedPlatforms.map(normalizeCaseInsensitive)),
//     [selectedPlatforms],
//   );

//   const groupedStoreOptions = useMemo(() => {
//     const groupsMap = new Map();

//     availablePlatforms.forEach((platform) => {
//       const key = normalizeCaseInsensitive(platform);
//       groupsMap.set(key, {
//         key,
//         platformLabel: platform,
//         stores: [],
//       });
//     });

//     storeOptions.forEach((store) => {
//       const key = normalizeCaseInsensitive(store.platform || PLATFORM_UNASSIGNED);
//       const label = platformLabelForKey(key, availablePlatforms);
//       if (!groupsMap.has(key)) {
//         groupsMap.set(key, {
//           key,
//           platformLabel: label,
//           stores: [],
//         });
//       }
//       groupsMap.get(key).stores.push(store);
//     });

//     return Array.from(groupsMap.values()).filter((group) => group.stores.length > 0);
//   }, [availablePlatforms, storeOptions]);

//   const selectedStoreDetails = useMemo(() => {
//     const labelToStoreMap = new Map();
//     const selectedPlatformSet = new Set(
//       selectedPlatforms.map((platform) => normalizeCaseInsensitive(platform)),
//     );

//     storeOptions.forEach((store) => {
//       const key = normalizeCaseInsensitive(store.label);
//       if (!labelToStoreMap.has(key)) {
//         labelToStoreMap.set(key, store);
//       }
//     });

//     return selectedStores.map((storeLabel) => {
//       const normalizedLabel = normalizeCaseInsensitive(storeLabel);
//       const storeCandidates = storeOptions.filter(
//         (store) => normalizeCaseInsensitive(store.label) === normalizedLabel,
//       );
//       const storeMeta =
//         storeCandidates.find((store) =>
//           selectedPlatformSet.has(normalizeCaseInsensitive(store.platform)),
//         ) || storeCandidates[0] || labelToStoreMap.get(normalizedLabel);
//       if (!storeMeta) return { label: storeLabel, platformLabel: "" };

//       return {
//         label: storeLabel,
//         platformLabel: platformLabelForKey(storeMeta.platform, availablePlatforms),
//       };
//     });
//   }, [storeOptions, selectedStores, selectedPlatforms, availablePlatforms]);

//   const handlePlatformToggle = (platform) => {
//     setSelectedPlatforms((current) => toggleValue(current, platform));
//   };

//   const handleStoreToggle = (storeLabel, platform) => {
//     if (!selectedPlatformSet.has(normalizeCaseInsensitive(platform))) return;
//     setSelectedStores((current) => toggleValue(current, storeLabel));
//   };

//   const platformDetail = useMemo(
//     () => getSentenceLabel(selectedPlatforms).toLowerCase(),
//     [selectedPlatforms],
//   );
//   const storeDetail = useMemo(
//     () =>
//       getSentenceLabel(
//         selectedStoreDetails.map((store) =>
//           store.platformLabel ? `${store.platformLabel}: ${store.label}` : store.label,
//         ),
//       ) || getSentenceLabel(selectedStores),
//     [selectedStoreDetails, selectedStores],
//   );
//   const storeCount = selectedStores.length;
//   const isSelectionReady = selectedPlatforms.length > 0 && selectedStores.length > 0;
//   const displayStoreCount = isSelectionReady ? selectedStores.length : 1;

//   const platformLabel = useMemo(
//     () => pluralize(selectedPlatforms.length, "platform", "platforms"),
//     [selectedPlatforms.length],
//   );
//   const storeLabel = useMemo(
//     () => pluralize(selectedStores.length, "store name", "store names"),
//     [selectedStores.length],
//   );

//   const activePlanData = useMemo(
//     () => plans.find((plan) => plan.packageName === activePlan) || plans[0],
//     [activePlan],
//   );
//   const activePlanAmount = useMemo(
//     () => (activePlanData?.amount || 0) * displayStoreCount,
//     [activePlanData, displayStoreCount],
//   );

//   const handleCheckout = async (plan) => {
//     if (!isSelectionReady) return;
//     const totalAmount = plan.amount * storeCount;
//     setCheckingPlan(plan.packageName);
//     setIsCheckingOut(true);

//     const payload = {
//       planName: plan.packageName,
//       planPrice: totalAmount,
//       perStoreAmount: plan.amount,
//       period: plan.duration,
//       durationMonths: Number(plan.duration?.split(" ")[0] || 0),
//       platform: selectedPlatforms,
//       stores: selectedStores,
//       storeCount,
//       totalAmount,
//     };

//     try {
//       const checkoutResponse = await api.post(CHECKOUT_ENDPOINT, payload);
//       const checkoutUrl =
//         checkoutResponse?.checkoutUrl ||
//         checkoutResponse?.paymentUrl ||
//         checkoutResponse?.url;

//       if (checkoutUrl) {
//         window.location.href = checkoutUrl;
//         return;
//       }

//       toast.success(
//         `Plan ${plan.packageName} selected for ${storeCount} ${toPlural(storeCount)}. Total amount: $${totalAmount.toFixed(
//           2,
//         )}.`,
//       );
//     } catch (error) {
//       if (error?.response?.status === 404) {
//         toast.error(
//           "Checkout endpoint is not available yet. Please connect the server route first.",
//         );
//       } else {
//         toast.error(
//           error?.response?.data?.message ||
//             error?.message ||
//             "Unable to initiate checkout. Please try again.",
//         );
//       }
//       console.error("Checkout failed:", error);
//     } finally {
//       setIsCheckingOut(false);
//       setCheckingPlan(null);
//     }
//   };

//   return (
//     <main className="min-h-screen bg-[#004368] bg-opacity-5">
//       <section className="mx-auto min-h-screen max-w-[1440px] px-[86px] pb-[70px] pt-[50px]">
//         <div className="flex flex-col items-center">
//           <h2 className="text-[34px] font-bold leading-none text-[#004368]">
//             Grozziie ERP
//           </h2>
//           <h1 className="mt-8 text-[38px] font-bold leading-none text-[#1f2937]">
//             Purchase subscription
//           </h1>

//           <div className="mt-7 flex w-full max-w-[760px] flex-col items-center gap-3">
//             <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
//               <span className="text-[14px] font-semibold text-[#64748b]">
//                 Platform
//               </span>
//               {availablePlatforms.map((platform) => (
//                 <SelectionCheckbox
//                   key={platform}
//                   label={platform}
//                   checked={selectedPlatforms.includes(platform)}
//                   onChange={() => handlePlatformToggle(platform)}
//                 />
//               ))}
//             </div>

//             <div className="w-full space-y-3">
//               <span className="text-[14px] font-semibold text-[#64748b]">
//                 Store
//               </span>
//               <div className="space-y-2">
//               {groupedStoreOptions.map((group) => {
//                 const isPlatformSelected = selectedPlatformSet.has(group.key);
//                 return (
//                     <div
//                         key={group.key}
//                         className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3"
//                       >
//                       <div className="mb-2 flex items-center justify-between">
//                         <span className="text-sm font-semibold text-[#334155]">
//                           {group.platformLabel}
//                         </span>
//                         {!isPlatformSelected && (
//                           <span className="text-xs text-[#94A3B8]">
//                             Select this platform first
//                           </span>
//                         )}
//                       </div>
//                       <div className="flex flex-wrap gap-x-3 gap-y-2">
//                         {group.stores.map((store) => (
//                           <SelectionCheckbox
//                             key={`${group.key}-${store.label}`}
//                             label={store.label}
//                             checked={selectedStores.includes(store.label)}
//                             onChange={() =>
//                               handleStoreToggle(store.label, group.key)
//                             }
//                             disabled={!isPlatformSelected}
//                           />
//                         ))}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           </div>

//           <p className="mt-5 text-center text-[17px] font-normal leading-none text-[#64748b]">
//             {selectedPlatforms.length && selectedStores.length
//               ? (
//                 <>
//                   Your purchased plan for the{" "}
//                   <span className="font-bold">{platformDetail}</span> {platformLabel} and
//                   the <span className="font-bold">{storeDetail}</span> {storeLabel}.
//                 </>
//               )
//               : "Select platform and store to see plan summary."}
//           </p>
//           <p className="mt-3 text-center text-sm text-[#64748b]">
//             Amount for this selection:{" "}
//             <span className="font-semibold text-[#004368]">
//               ${activePlanAmount.toFixed(2)}
//             </span>{" "}
//             ({toPlural(displayStoreCount)}: {displayStoreCount})
//           </p>

//           <div className="mt-[76px]">
//             <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 justify-center">
//               {plans.map((plan) => (
//                 <div key={plan.packageName} className="relative overflow-visible">
//                   <PlanCard
//                     plan={plan}
//                     activePlan={activePlan}
//                     setActivePlan={setActivePlan}
//                     storeCount={displayStoreCount}
//                     isSelectionReady={isSelectionReady}
//                     isCheckoutLoading={
//                       isCheckingOut && checkingPlan === plan.packageName
//                     }
//                     anyCheckoutLoading={isCheckingOut}
//                     onChoosePlan={handleCheckout}
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </section>
//     </main>
//   );
// }


import { CheckCircle2, Crown, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import Topbar from "@/components/layout/Topbar";
import api from "@/lib/api";
import { useInitShopPlatform } from "@/stores/useInitShopPlatform";
import { useShopPlatformStore } from "@/stores/shopPlatformStore";
import { getStoredWarehouseUser, isOwnerUser } from "@/utils/permissions";
import { savePricingCheckout } from "./pricingCheckoutStorage";

const PRICING_ENDPOINT = "/pricing";
const FALLBACK_PLATFORMS = ["TikTok", "Shopee", "Lazada"];
const FALLBACK_STORES = ["TIMOZIA", "Grozziie", "Printer Noble", "Easy Parcel"];
const PLATFORM_UNASSIGNED = "unassigned";
const COUNTRY_OPTIONS = [
  { label: "United States", value: "US", currency: "USD" },
  { label: "China", value: "CN", currency: "CNY" },
  { label: "Singapore", value: "SG", currency: "SGD" },
  { label: "Malaysia", value: "MY", currency: "MYR" },
  { label: "Thailand", value: "TH", currency: "THB" },
  { label: "Philippines", value: "PH", currency: "PHP" },
  { label: "Indonesia", value: "ID", currency: "IDR" },
  { label: "Vietnam", value: "VN", currency: "VND" },
];
const CURRENCY_OPTIONS = ["USD", "CNY", "SGD", "MYR", "THB", "PHP", "IDR", "VND"];
const CURRENCY_SYMBOLS = {
  USD: "$",
  SGD: "S$",
  MYR: "RM",
  THB: "฿",
  PHP: "₱",
  IDR: "Rp",
  VND: "₫",
  CNY: "¥",
  RMB: "¥",
};
const ZERO_DECIMAL_CURRENCIES = new Set(["IDR", "VND"]);

const FALLBACK_FEATURE_TRANSLATIONS = {
  en: {
    duration: (days) => `${days} days subscription duration`,
    marketplaceSupport: "Support for Shopee & TikTok",
    unlimitedOrders: "Unlimited order processing",
    inventorySync: "Inventory synchronisation",
    bulkOrders: "Bulk order management",
    shipmentTracking: "Shipment tracking",
    customerSupport: "Customer support available",
    mobileApp: "Free Mobile app",
  },
  zh: {
    duration: (days) => `${days} 天订阅时长`,
    marketplaceSupport: "支持 Shopee 和 TikTok",
    unlimitedOrders: "无限订单处理",
    inventorySync: "库存同步",
    bulkOrders: "批量订单管理",
    shipmentTracking: "物流追踪",
    customerSupport: "提供客户支持",
    mobileApp: "免费移动应用",
  },
  fil: {
    duration: (days) => `${days} araw na tagal ng subscription`,
    marketplaceSupport: "Suporta sa Shopee at TikTok",
    unlimitedOrders: "Walang limitasyong pagproseso ng order",
    inventorySync: "Pagsi-sync ng imbentaryo",
    bulkOrders: "Pamamahala ng maramihang order",
    shipmentTracking: "Pagsubaybay ng shipment",
    customerSupport: "Available ang customer support",
    mobileApp: "Libreng mobile app",
  },
  id: {
    duration: (days) => `${days} hari durasi langganan`,
    marketplaceSupport: "Dukungan untuk Shopee & TikTok",
    unlimitedOrders: "Pemrosesan pesanan tanpa batas",
    inventorySync: "Sinkronisasi inventaris",
    bulkOrders: "Manajemen pesanan massal",
    shipmentTracking: "Pelacakan pengiriman",
    customerSupport: "Dukungan pelanggan tersedia",
    mobileApp: "Aplikasi mobile gratis",
  },
  ms: {
    duration: (days) => `${days} hari tempoh langganan`,
    marketplaceSupport: "Sokongan untuk Shopee & TikTok",
    unlimitedOrders: "Pemprosesan pesanan tanpa had",
    inventorySync: "Penyegerakan inventori",
    bulkOrders: "Pengurusan pesanan pukal",
    shipmentTracking: "Penjejakan penghantaran",
    customerSupport: "Sokongan pelanggan tersedia",
    mobileApp: "Aplikasi mudah alih percuma",
  },
  vi: {
    duration: (days) => `${days} ngày thời hạn đăng ký`,
    marketplaceSupport: "Hỗ trợ Shopee & TikTok",
    unlimitedOrders: "Xử lý đơn hàng không giới hạn",
    inventorySync: "Đồng bộ tồn kho",
    bulkOrders: "Quản lý đơn hàng hàng loạt",
    shipmentTracking: "Theo dõi lô hàng",
    customerSupport: "Có hỗ trợ khách hàng",
    mobileApp: "Ứng dụng di động miễn phí",
  },
  th: {
    duration: (days) => `ระยะเวลาสมัครสมาชิก ${days} วัน`,
    marketplaceSupport: "รองรับ Shopee และ TikTok",
    unlimitedOrders: "ประมวลผลคำสั่งซื้อไม่จำกัด",
    inventorySync: "ซิงค์สินค้าคงคลัง",
    bulkOrders: "จัดการคำสั่งซื้อแบบกลุ่ม",
    shipmentTracking: "ติดตามการจัดส่ง",
    customerSupport: "มีบริการสนับสนุนลูกค้า",
    mobileApp: "แอปมือถือฟรี",
  },
};

const getBaseLanguage = (language = "en") =>
  String(language || "en").toLowerCase().split(/[-_]/)[0] || "en";

const getFallbackFacilities = (durationDays, language = "en") => {
  const translations =
    FALLBACK_FEATURE_TRANSLATIONS[getBaseLanguage(language)] ||
    FALLBACK_FEATURE_TRANSLATIONS.en;

  return [
    translations.duration(durationDays),
    translations.marketplaceSupport,
    translations.unlimitedOrders,
    translations.inventorySync,
    translations.bulkOrders,
    translations.shipmentTracking,
    translations.customerSupport,
    translations.mobileApp,
  ];
};

const getFallbackPlans = (language = "en") => [
  {
    packageName: "Basic",
      amount: 3,
      currency: "USD",
      code: "basic",
      durationDays: 90,
      duration: "03 Months",
    facilities: getFallbackFacilities(90, language),
  },
  {
    packageName: "Standard",
      amount: 5,
      currency: "USD",
      code: "standard",
      durationDays: 180,
      duration: "06 Months",
    facilities: getFallbackFacilities(180, language),
  },
  {
    packageName: "Pro",
      amount: 9,
      currency: "USD",
      code: "pro",
      durationDays: 365,
      duration: "12 Months",
    facilities: getFallbackFacilities(365, language),
  },
  {
    packageName: "Ultimate",
      amount: 16,
      currency: "USD",
      code: "ultimate",
      durationDays: 730,
      duration: "24 Months",
    facilities: getFallbackFacilities(730, language),
  },
];

const plans = getFallbackPlans();

function toPlural(count) {
  return count === 1 ? "store" : "stores";
}

function cleanLabel(value) {
  return String(value || "").trim();
}

function normalizeCaseInsensitive(value) {
  return cleanLabel(value).toLowerCase();
}

function uniquePreserveFirst(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeCaseInsensitive(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toCanonicalSelection(values, allowedValues) {
  const canonicalLookup = new Map(
    allowedValues.map((value) => [normalizeCaseInsensitive(value), value]),
  );
  return values
    .map((value) => canonicalLookup.get(normalizeCaseInsensitive(value)))
    .filter(Boolean);
}

function sameItemsAsSet(left, right) {
  if (left.length !== right.length) return false;

  const leftSet = new Set(left);
  const rightSet = new Set(right);

  if (leftSet.size !== rightSet.size) return false;

  for (const item of leftSet) {
    if (!rightSet.has(item)) return false;
  }

  return true;
}

function extractPlatformOptions(platformRows) {
  return uniquePreserveFirst(
    (platformRows ?? [])
      .map((row) => cleanLabel(row?.label || row?.value || row?.name || row?.platform || row))
      .filter(Boolean),
  );
}

function parseStorePlatform(row) {
  return cleanLabel(
    row?.platform ??
      row?.platform_name ??
      row?.platformName ??
      row?.marketplace ??
      row?.channel ??
      row?.market ??
      row?.store_platform,
  );
}

function extractStoreOptions(storeRows, fallbackPlatforms = FALLBACK_PLATFORMS) {
  const rows = Array.isArray(storeRows) ? storeRows : [];

  if (!rows.length) {
    const fallbackPlatform = fallbackPlatforms[0] || FALLBACK_PLATFORMS[0];
    return FALLBACK_STORES.map((store) => ({
      id: null,
      label: cleanLabel(store),
      platform: normalizeCaseInsensitive(fallbackPlatform) || PLATFORM_UNASSIGNED,
      platformLabel: cleanLabel(fallbackPlatform),
    }));
  }

  const seen = new Set();
  const normalizedRows = rows
    .map((row) => {
      const label = cleanLabel(
        row?.label ||
          row?.store_name ||
          row?.external_store_name ||
          row?.name ||
          row?.nickname ||
          row?.shop_name ||
          row,
      );
      if (!label) return null;

      const platformLabel = parseStorePlatform(row);
      const platform = normalizeCaseInsensitive(platformLabel) || PLATFORM_UNASSIGNED;

      return {
        id: row?.id ?? row?.value ?? row?.store_id ?? row?.platform_store_id ?? null,
        label,
        platform,
        platformLabel: platformLabel || platform,
      };
    })
    .filter(Boolean);

  const filteredRows = normalizedRows.filter((row) => {
    const key = `${row.platform}|${normalizeCaseInsensitive(row.label)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (!filteredRows.length) {
    return FALLBACK_STORES.map((store) => ({
      id: null,
      label: cleanLabel(store),
      platform: PLATFORM_UNASSIGNED,
      platformLabel: "Other",
    }));
  }

  return filteredRows;
}

function platformLabelForKey(platformKey, platformOptions = []) {
  const normalized = normalizeCaseInsensitive(platformKey);
  const platform = platformOptions.find(
    (value) => normalizeCaseInsensitive(value) === normalized,
  );

  return platform || cleanLabel(platformKey) || "Other";
}

function getSentenceLabel(items) {
  if (items.length <= 1) return items[0] || "";
  const clone = [...items];
  const last = clone.pop();
  return `${clone.join(", ")} and ${last}`;
}

function toggleValue(currentValues, value) {
  if (currentValues.includes(value)) {
    return currentValues.filter((item) => item !== value);
  }

  return [...currentValues, value];
}

function pluralize(count, singularLabel, pluralLabel) {
  return count === 1 ? singularLabel : pluralLabel;
}

function formatPlanMoney(amount, currency = "USD") {
  const code = String(currency || "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || code;
  const spacer = symbol.length > 1 ? " " : "";
  return `${symbol}${spacer}${formatCurrencyNumber(amount, code)}`;
}

function formatCurrencyNumber(amount, currency = "USD") {
  const code = String(currency || "USD").toUpperCase();
  const hasDecimals = Number(amount) % 1 !== 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 0,
    maximumFractionDigits: ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : hasDecimals ? 2 : 0,
  }).format(Number(amount || 0));
}

function getCurrencySymbol(currency = "USD") {
  const code = String(currency || "USD").toUpperCase();
  return CURRENCY_SYMBOLS[code] || code;
}

function durationMonthsFromDays(durationDays) {
  const days = Number(durationDays || 0);
  if (!days) return 0;
  if (days >= 365) return Math.round((days / 365) * 12);
  return Math.max(1, Math.round(days / 30));
}

function formatDurationFromDays(durationDays) {
  const months = durationMonthsFromDays(durationDays);
  return months ? `${String(months).padStart(2, "0")} Months` : "0 Months";
}

function mapApiPlans(apiPlans = []) {
  return apiPlans.map((plan) => ({
    packageName: plan.name,
    code: plan.code,
    amount: Number(plan.amount || 0),
    currency: plan.currency || "USD",
    country: plan.country || "US",
    durationDays: Number(plan.durationDays || 0),
    duration: formatDurationFromDays(plan.durationDays),
    facilities: (plan.features || [])
      .sort((left, right) => Number(left.serialNo || 0) - Number(right.serialNo || 0))
      .map((feature) => feature.title)
      .filter(Boolean),
    badgeLabel: plan.badgeLabel,
  })).filter((plan) => plan.packageName && plan.code);
}

function isReferralEligiblePlan(plan) {
  const durationDays = Number(plan?.durationDays || 0);
  const durationText = String(plan?.duration || "").toLowerCase();
  return [365, 730].includes(durationDays) || durationText.includes("12") || durationText.includes("24");
}

function extractRows(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.rows)) return response.data.rows;
  if (Array.isArray(response?.rows)) return response.rows;
  return [];
}

function ReferralCodePrompt({ code, setCode, onClose, onSkip, onContinue }) {
  const { t } = useTranslation();
  const inputRefs = useRef([]);
  const values = Array.from({ length: 6 }, (_, index) => code[index] || "");
  const isContinueEnabled = /^\d{6}$/.test(code);

  const updateCode = (index, value) => {
    const cleanValue = String(value || "").replace(/\D/g, "");
    if (cleanValue.length > 1) {
      setCode(cleanValue.slice(0, 6));
      const nextIndex = Math.min(cleanValue.length, 6) - 1;
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const nextValues = [...values];
    nextValues[index] = cleanValue;
    setCode(nextValues.join("").slice(0, 6));
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace" && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pastedCode = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedCode) return;
    setCode(pastedCode);
    const nextIndex = Math.min(pastedCode.length, 6) - 1;
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/25 px-4 backdrop-blur-[6px]">
      <section className="relative w-full max-w-[430px] rounded-xl bg-white px-7 py-8 text-center shadow-[0_18px_45px_rgba(15,23,42,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={t("topbar.close")}
        >
          <X size={16} />
        </button>
        <h2 className="text-[20px] font-bold text-[#333333]">{t("pricing.useReferralCode")}</h2>
        <p className="mt-2 text-[12px] font-medium text-[#667085]">{t("pricing.enterReferralCode")}</p>

        <div className="mt-6 flex justify-center gap-3">
          {values.map((value, index) => (
            <input
              key={index}
              ref={(node) => {
                inputRefs.current[index] = node;
              }}
              value={value}
              onChange={(event) => updateCode(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              maxLength={1}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="h-9 w-9 rounded-md border border-[#9dc0d6] text-center text-base font-bold text-[#004368] outline-none focus:border-[#004368] focus:ring-1 focus:ring-[#004368]"
            />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="h-11 rounded-md border border-[#d8dee6] px-2 text-[12px] font-medium text-[#222]"
          >
            {t("pricing.dontHaveCode")}
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!isContinueEnabled}
            className="h-11 rounded-md bg-[#004b70] px-2 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:bg-[#b7c7d1]"
          >
            {t("pricing.continue")}
          </button>
        </div>
      </section>
    </div>
  );
}

function OwnerOnlyWarningModal({ onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/25 px-4 backdrop-blur-[6px]">
      <section className="relative w-full max-w-[420px] rounded-lg bg-white px-6 py-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.25)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label={t("topbar.close")}
        >
          <X size={16} />
        </button>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4df] text-[#b76b00]">
          <Crown size={22} />
        </div>
        <h2 className="mt-4 text-[19px] font-bold text-[#111827]">
          {t("pricing.ownerRequired")}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#64748b]">
          {t("pricing.ownerRequiredMessage")}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-10 w-full rounded-md bg-[#004b70] text-sm font-semibold text-white hover:bg-[#003255]"
        >
          {t("pricing.gotIt")}
        </button>
      </section>
    </div>
  );
}

function SelectionCheckbox({ checked, label, onChange, disabled = false }) {
  return (
    <label
      className={`flex h-8 items-center gap-2 rounded-md border border-transparent px-3 text-[14px] font-medium ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } text-[#1f2937]`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="checkbox checkbox-sm border-[#9ca3af] checked:border-[#004368] checked:bg-[#004368] checked:text-white"
      />
      <span>{label}</span>
    </label>
  );
}

function PlatformStoreSelectionSkeleton() {
  return (
    <div className="mt-7 flex w-full max-w-[760px] flex-col items-center gap-3">
      <div className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <div className="h-5 w-20 animate-pulse rounded bg-[#dce6ee]" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex h-8 items-center gap-2 px-3">
            <span className="h-4 w-4 animate-pulse rounded border border-[#cbd5e1] bg-white" />
            <span className="h-4 w-20 animate-pulse rounded bg-[#dce6ee]" />
          </div>
        ))}
      </div>

      <div className="w-full space-y-3">
        <div className="h-4 w-14 animate-pulse rounded bg-[#dce6ee]" />
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-[#dce6ee]" />
            <div className="h-3 w-32 animate-pulse rounded bg-[#e6edf3]" />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="h-4 w-4 animate-pulse rounded border border-[#cbd5e1] bg-white" />
                <span className="h-4 w-24 animate-pulse rounded bg-[#dce6ee]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  activePlan,
  setActivePlan,
  storeCount,
  isSelectionReady,
  isCheckoutLoading,
  anyCheckoutLoading,
  onChoosePlan,
}) {
  const { t } = useTranslation();
  const isActive = activePlan === plan.packageName;
  const price = plan.amount * storeCount;
  const currencyCode = plan.currency || "USD";
  const currencySymbol = getCurrencySymbol(currencyCode);
  const durationParts = plan.duration.split(" ");
  const monthLabel = t("pricing.months", { defaultValue: durationParts[1] || "Months" });

  return (
    <article
      className={`relative flex h-[523px] w-full min-w-0 flex-col items-center px-6 pt-7 transition-all duration-300 ease-out ${
        isActive
          ? "z-20 rounded-[18px] bg-[#004b70] pb-[29px] text-white shadow-[0_18px_38px_rgba(0,67,104,0.22)] ring-[8px] ring-[#c8d8e1] xl:-translate-y-3"
          : "z-10 bg-transparent pb-[52px] text-[#111827]"
      }`}
      onMouseEnter={() => setActivePlan(plan.packageName)}
      onFocus={() => setActivePlan(plan.packageName)}
    >
      <span
        className={`inline-flex h-[33px] items-center justify-center rounded-full px-5 text-[18px] font-semibold leading-none ${
          isActive
            ? "border border-white bg-transparent text-white"
            : "bg-[#edf2f5] text-[#004368]"
        }`}
      >
        {plan.packageName}
      </span>

      <div
        className={`flex items-end justify-center ${
          isActive ? "mt-[52px]" : "mt-[55px]"
        }`}
      >
        <span
          className={`mb-[2px] mr-1 text-[22px] font-bold leading-none ${
            isActive ? "text-white" : "text-[#004b70]"
          }`}
        >
          {currencySymbol}
        </span>
        <span
          className={`text-[34px] font-bold leading-none ${
            isActive ? "text-white" : "text-[#004b70]"
          }`}
        >
          {formatCurrencyNumber(price, currencyCode)}
        </span>
        <span
          className={`mb-[3px] ml-1 text-[14px] font-semibold leading-none ${
            isActive ? "text-white" : "text-black"
          }`}
        >
          /{durationParts[0]} {monthLabel}
        </span>
      </div>

      <div
        className={`w-full space-y-[14px] ${
          isActive ? "mt-[24px]" : "mt-[24px]"
        }`}
      >
        {plan.facilities.map((facility) => (
          <p
            key={facility}
            className="flex items-center gap-x-[9px] text-[15px] font-normal leading-[18px]"
          >
            <CheckCircle2
              size={14}
              strokeWidth={1.5}
              className={`shrink-0 ${
                isActive ? "text-white" : "text-[#00628f]"
              }`}
            />
            <span>{facility}</span>
          </p>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChoosePlan(plan)}
        onMouseEnter={() => setActivePlan(plan.packageName)}
        onFocus={() => setActivePlan(plan.packageName)}
        className={`mt-auto inline-flex h-[42px] w-[190px] items-center justify-center rounded-[6px] px-3 text-[17px] font-medium transition-colors ${
          isActive
            ? "bg-white text-[#004368] hover:bg-[#f8fafc]"
            : "bg-[#d2dce6] text-[#004368] hover:bg-[#c5d1dd]"
        } ${
          anyCheckoutLoading || !isSelectionReady
            ? "cursor-not-allowed"
            : "cursor-pointer"
        }`}
        disabled={anyCheckoutLoading || !isSelectionReady}
      >
        {isCheckoutLoading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {t("pricing.processing")}
          </span>
        ) : (
          t("pricing.choosePlan")
        )}
      </button>
    </article>
  );
}

function PricingCardSkeleton({ active = false }) {
  return (
    <article
      className={`relative flex h-[523px] w-full min-w-0 flex-col items-center px-6 pt-7 ${
        active
          ? "z-20 rounded-[18px] bg-[#004b70] pb-[29px] shadow-[0_18px_38px_rgba(0,67,104,0.22)] ring-[8px] ring-[#c8d8e1] xl:-translate-y-3"
          : "z-10 bg-transparent pb-[52px]"
      }`}
    >
      <div
        className={`h-[33px] w-[112px] animate-pulse rounded-full ${
          active ? "bg-white/20" : "bg-[#edf2f5]"
        }`}
      />
      <div
        className={`mt-[52px] h-10 w-[142px] animate-pulse rounded-md ${
          active ? "bg-white/20" : "bg-[#e2e8f0]"
        }`}
      />
      <div className="mt-6 w-full space-y-[14px]">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center gap-x-[9px]">
            <span
              className={`h-[14px] w-[14px] shrink-0 animate-pulse rounded-full ${
                active ? "bg-white/30" : "bg-[#d9e5ec]"
              }`}
            />
            <span
              className={`h-[18px] animate-pulse rounded ${
                active ? "bg-white/20" : "bg-[#e2e8f0]"
              } ${index % 3 === 0 ? "w-[86%]" : index % 3 === 1 ? "w-[72%]" : "w-[64%]"}`}
            />
          </div>
        ))}
      </div>
      <div
        className={`mt-auto h-[42px] w-[190px] animate-pulse rounded-[6px] ${
          active ? "bg-white/70" : "bg-[#d2dce6]"
        }`}
      />
    </article>
  );
}

export default function PricingPage() {
  const { t, i18n } = useTranslation();
  useInitShopPlatform();
  const navigate = useNavigate();
  const location = useLocation();
  const preselectAppliedRef = useRef(false);
  const dropdownPlatforms = useShopPlatformStore((state) => state.platforms);
  const dropdownStores = useShopPlatformStore((state) => state.stores);
  const hasDropdownsLoaded = useShopPlatformStore((state) => state.dropdownsLoaded);

  const platformOptions = useMemo(
    () => extractPlatformOptions(dropdownPlatforms),
    [dropdownPlatforms],
  );
  const isSelectionDataLoading = !hasDropdownsLoaded;
  const availablePlatforms = hasDropdownsLoaded && platformOptions.length
    ? platformOptions
    : [];
  const storeOptions = useMemo(
    () =>
      hasDropdownsLoaded && Array.isArray(dropdownStores) && dropdownStores.length
        ? extractStoreOptions(dropdownStores, availablePlatforms)
        : [],
    [hasDropdownsLoaded, dropdownStores, availablePlatforms],
  );
  const availableStores = useMemo(
    () => storeOptions.map((store) => store.label),
    [storeOptions],
  );

  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [activePlan, setActivePlan] = useState("Basic");
  const [selectedCountry, setSelectedCountry] = useState("US");
  const resolvedLanguage = getBaseLanguage(i18n.resolvedLanguage || i18n.language || "en");
  const initialLanguage = resolvedLanguage;
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [pricingPlans, setPricingPlans] = useState([]);
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  const [referralPromptPlan, setReferralPromptPlan] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [showOwnerWarning, setShowOwnerWarning] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkingPlan, setCheckingPlan] = useState(null);
  const canPurchasePlan = useMemo(() => isOwnerUser(getStoredWarehouseUser()), []);

  useEffect(() => {
    const nextLanguage = getBaseLanguage(i18n.resolvedLanguage || i18n.language || "en");
    setSelectedLanguage(nextLanguage);
    setPricingPlans([]);
    setIsPricingLoading(true);
  }, [i18n.resolvedLanguage, i18n.language]);

  useEffect(() => {
    let isMounted = true;
    setIsPricingLoading(true);

    api
      .get(PRICING_ENDPOINT, {
        params: {
          country: selectedCountry,
          language: selectedLanguage,
          currency: selectedCurrency,
        },
      })
      .then((response) => {
        if (!isMounted) return;
        const nextPlans = mapApiPlans(response?.data?.plans || response?.plans || []);
        if (nextPlans.length) {
          setPricingPlans(nextPlans);
          setActivePlan((current) =>
            nextPlans.some((plan) => plan.packageName === current)
              ? current
              : nextPlans[0].packageName,
          );
        }
      })
      .catch((error) => {
        console.warn("Pricing API unavailable. Using fallback plans.", error);
        if (isMounted) setPricingPlans(getFallbackPlans(selectedLanguage));
      })
      .finally(() => {
        if (isMounted) setIsPricingLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCountry, selectedLanguage, selectedCurrency]);

  useEffect(() => {
    if (selectedPlatforms[0]) {
      localStorage.setItem("SelectedPlatform", selectedPlatforms[0]);
    } else {
      localStorage.removeItem("SelectedPlatform");
    }

    if (selectedStores[0]) {
      localStorage.setItem("SelectedStore", selectedStores[0]);
    } else {
      localStorage.removeItem("SelectedStore");
    }

    localStorage.setItem("SelectedPlatforms", JSON.stringify(selectedPlatforms));
    localStorage.setItem("SelectedStores", JSON.stringify(selectedStores));
  }, [selectedPlatforms, selectedStores]);

  useEffect(() => {
    if (!hasDropdownsLoaded) return;

    const canonicalPlatforms = toCanonicalSelection(selectedPlatforms, availablePlatforms);
    if (!sameItemsAsSet(selectedPlatforms, canonicalPlatforms)) {
      setSelectedPlatforms(canonicalPlatforms);
      return;
    }

    const selectedPlatformSet = new Set(
      canonicalPlatforms.map((platform) => normalizeCaseInsensitive(platform)),
    );
    const allowedStoreLabels = storeOptions
      .filter((store) => selectedPlatformSet.has(store.platform))
      .map((store) => store.label);

    setSelectedStores((current) => {
      const canonical = toCanonicalSelection(current, availableStores);
      const restricted = canonical.filter((store) =>
        allowedStoreLabels.includes(store),
      );

      if (!restricted.length) return current.length ? [] : current;

      return !sameItemsAsSet(current, restricted) ? restricted : current;
    });
  }, [
    hasDropdownsLoaded,
    availablePlatforms,
    availableStores,
    storeOptions,
    selectedPlatforms,
  ]);

  const selectedPlatformSet = useMemo(
    () => new Set(selectedPlatforms.map(normalizeCaseInsensitive)),
    [selectedPlatforms],
  );

  const groupedStoreOptions = useMemo(() => {
    const groupsMap = new Map();

    availablePlatforms.forEach((platform) => {
      const key = normalizeCaseInsensitive(platform);
      groupsMap.set(key, {
        key,
        platformLabel: platform,
        stores: [],
      });
    });

    storeOptions.forEach((store) => {
      const key = normalizeCaseInsensitive(store.platform || PLATFORM_UNASSIGNED);
      const label = platformLabelForKey(key, availablePlatforms);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          platformLabel: label,
          stores: [],
        });
      }
      groupsMap.get(key).stores.push(store);
    });

    return Array.from(groupsMap.values()).filter((group) => group.stores.length > 0);
  }, [availablePlatforms, storeOptions]);

  const selectedStoreDetails = useMemo(() => {
    const labelToStoreMap = new Map();
    const selectedPlatformSet = new Set(
      selectedPlatforms.map((platform) => normalizeCaseInsensitive(platform)),
    );

    storeOptions.forEach((store) => {
      const key = normalizeCaseInsensitive(store.label);
      if (!labelToStoreMap.has(key)) {
        labelToStoreMap.set(key, store);
      }
    });

    return selectedStores.map((storeLabel) => {
      const normalizedLabel = normalizeCaseInsensitive(storeLabel);
      const storeCandidates = storeOptions.filter(
        (store) => normalizeCaseInsensitive(store.label) === normalizedLabel,
      );
      const storeMeta =
        storeCandidates.find((store) =>
          selectedPlatformSet.has(normalizeCaseInsensitive(store.platform)),
        ) || storeCandidates[0] || labelToStoreMap.get(normalizedLabel);
      if (!storeMeta) return { id: null, label: storeLabel, platformLabel: "" };

      return {
        id: storeMeta.id,
        label: storeLabel,
        platformLabel: platformLabelForKey(storeMeta.platform, availablePlatforms),
      };
    });
  }, [storeOptions, selectedStores, selectedPlatforms, availablePlatforms]);

  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms((current) => toggleValue(current, platform));
  };

  const handleStoreToggle = (storeLabel, platform) => {
    if (!selectedPlatformSet.has(normalizeCaseInsensitive(platform))) return;
    setSelectedStores((current) => toggleValue(current, storeLabel));
  };

  useEffect(() => {
    const preselectStore = location.state?.preselectStore;
    if (preselectAppliedRef.current || !preselectStore || !storeOptions.length) return;

    const platform = availablePlatforms.find(
      (item) => normalizeCaseInsensitive(item) === normalizeCaseInsensitive(preselectStore.platform),
    );
    const store = storeOptions.find((item) => {
      const sameId = preselectStore.id && Number(item.id) === Number(preselectStore.id);
      const sameLabel =
        normalizeCaseInsensitive(item.label) === normalizeCaseInsensitive(preselectStore.label) &&
        normalizeCaseInsensitive(item.platform) === normalizeCaseInsensitive(preselectStore.platform);
      return sameId || sameLabel;
    });

    if (platform && store) {
      setSelectedPlatforms([platform]);
      setSelectedStores([store.label]);
      preselectAppliedRef.current = true;
    }
  }, [availablePlatforms, location.state?.preselectStore, storeOptions]);

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
  };

  const handleCurrencyChange = (event) => {
    setPricingPlans([]);
    setIsPricingLoading(true);
    setSelectedCurrency(event.target.value);
  };

  const platformDetail = useMemo(
    () => getSentenceLabel(selectedPlatforms).toLowerCase(),
    [selectedPlatforms],
  );
  const storeDetail = useMemo(
    () =>
      getSentenceLabel(
        selectedStoreDetails.map((store) =>
          store.platformLabel ? `${store.platformLabel}: ${store.label}` : store.label,
        ),
      ) || getSentenceLabel(selectedStores),
    [selectedStoreDetails, selectedStores],
  );
  const storeCount = selectedStores.length;
  const isSelectionReady = selectedPlatforms.length > 0 && selectedStores.length > 0;
  const displayStoreCount = isSelectionReady ? selectedStores.length : 1;

  const platformLabel = useMemo(
    () => pluralize(selectedPlatforms.length, "platform", "platforms"),
    [selectedPlatforms.length],
  );
  const storeLabel = useMemo(
    () => pluralize(selectedStores.length, "store name", "store names"),
    [selectedStores.length],
  );

  const isLanguageSyncing = selectedLanguage !== resolvedLanguage;
  const displayPricingPlans = isLanguageSyncing ? [] : pricingPlans;
  const activePlanData = useMemo(
    () => displayPricingPlans.find((plan) => plan.packageName === activePlan) || displayPricingPlans[0],
    [activePlan, displayPricingPlans],
  );
  const activePlanAmount = useMemo(
    () => (activePlanData?.amount || 0) * displayStoreCount,
    [activePlanData, displayStoreCount],
  );
  const isPricingCardLoading = isLanguageSyncing || (isPricingLoading && displayPricingPlans.length === 0);

  const buildCheckoutPayload = (plan, couponCode = "") => {
    const cleanCouponCode = couponCode.trim().toUpperCase();
    const totalAmount = plan.amount * storeCount;
    const storeIds = selectedStoreDetails
      .map((store) => Number(store.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    return {
      planCode: plan.code,
      planName: plan.packageName,
      planPrice: totalAmount,
      perStoreAmount: plan.amount,
      currency: plan.currency || selectedCurrency,
      country: plan.country || selectedCountry,
      period: plan.duration,
      durationDays: plan.durationDays,
      durationMonths: Number(plan.duration?.split(" ")[0] || 0),
      platform: selectedPlatforms,
      stores: selectedStoreDetails.map((store) => ({
        id: store.id,
        label: store.label,
        platformLabel: store.platformLabel,
      })),
      storeIds,
      storeCount,
      totalAmount,
      couponCode: cleanCouponCode || "",
      referralCouponLocked: Boolean(cleanCouponCode),
    };
  };

  const goToCheckout = (plan, couponCode = "") => {
    const payload = buildCheckoutPayload(plan, couponCode);

    savePricingCheckout(payload);
    navigate("/warehouse_management/pricing/checkout", {
      state: { checkoutPayload: payload },
    });
  };

  const canUseReferralForFirstPurchase = async (plan) => {
    const response = await api.post("/subscription/referral-eligibility", buildCheckoutPayload(plan));
    const payload = response?.data?.data || response?.data || response;
    return Boolean(payload?.eligible);
  };

  const handleCheckout = async (plan) => {
    if (!isSelectionReady) return;
    if (!canPurchasePlan) {
      setShowOwnerWarning(true);
      return;
    }

    setIsCheckingOut(true);
    setCheckingPlan(plan.packageName);
    try {
      if (isReferralEligiblePlan(plan) && await canUseReferralForFirstPurchase(plan)) {
        setReferralPromptPlan(plan);
        setReferralCode("");
        return;
      }

      goToCheckout(plan);
    } catch {
      goToCheckout(plan);
    } finally {
      setIsCheckingOut(false);
      setCheckingPlan(null);
    }
  };

  const closeReferralPrompt = () => {
    setReferralPromptPlan(null);
    setReferralCode("");
  };

  const continueReferralPrompt = (couponCode = referralCode) => {
    if (!referralPromptPlan) return;
    const plan = referralPromptPlan;
    setReferralPromptPlan(null);
    setReferralCode("");
    goToCheckout(plan, couponCode);
  };

  const handlePricingBack = () => {
    navigate("/warehouse_management/config/store_authorization");
  };

  return (
    <main className="min-h-screen bg-[#004368] bg-opacity-5">
      {showOwnerWarning ? (
        <OwnerOnlyWarningModal onClose={() => setShowOwnerWarning(false)} />
      ) : null}
      {referralPromptPlan ? (
        <ReferralCodePrompt
          code={referralCode}
          setCode={setReferralCode}
          onClose={closeReferralPrompt}
          onSkip={() => continueReferralPrompt("")}
          onContinue={() => continueReferralPrompt(referralCode)}
        />
      ) : null}
      <section className="mx-auto max-w-[1440px] px-6 pb-[70px] pt-5 lg:px-[86px]">
        <Topbar PageTitle="Pricing" showBack onBack={handlePricingBack} />
        <div className="flex flex-col items-center">
          <h2 className="text-[34px] font-bold leading-none text-[#004368]">
            {t("pricing.brand")}
          </h2>
          <h1 className="mt-5 text-[38px] font-bold leading-none text-[#1f2937]">
            {t("pricing.purchaseSubscription")}
          </h1>

          {isSelectionDataLoading ? (
            <PlatformStoreSelectionSkeleton />
          ) : (
            <div className="mt-7 flex w-full max-w-[760px] flex-col items-center gap-3">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                <span className="text-[16px] font-semibold text-[#64748b]">
                  {t("pricing.platform")}
                </span>
                {availablePlatforms.map((platform) => (
                  <SelectionCheckbox
                    key={platform}
                    label={platform}
                    checked={selectedPlatforms.includes(platform)}
                    onChange={() => handlePlatformToggle(platform)}
                  />
                ))}
              </div>

              <div className="w-full space-y-3">
                <span className="text-[14px] font-semibold text-[#64748b]">
                  {t("pricing.store")}
                </span>
                <div className="space-y-2">
                {groupedStoreOptions.map((group) => {
                  const isPlatformSelected = selectedPlatformSet.has(group.key);
                  return (
                      <div
                          key={group.key}
                          className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3"
                        >
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#334155]">
                            {group.platformLabel}
                          </span>
                          {!isPlatformSelected && (
                            <span className="text-xs text-[#94A3B8]">
                              {t("pricing.selectPlatformFirst")}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-2">
                          {group.stores.map((store) => (
                            <SelectionCheckbox
                              key={`${group.key}-${store.label}`}
                              label={store.label}
                              checked={selectedStores.includes(store.label)}
                              onChange={() =>
                                handleStoreToggle(store.label, group.key)
                              }
                              disabled={!isPlatformSelected}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <p className="mt-5 text-center text-[17px] font-normal leading-none text-[#64748b]">
            {selectedPlatforms.length && selectedStores.length
              ? (
                <>
                  {t("pricing.selectedPlanSummary", {
                    platformDetail,
                    platformLabel,
                    storeDetail,
                    storeLabel,
                  })}
                </>
              )
              : t("pricing.selectPlatformStore")}
          </p>
          <p className="mt-3 min-h-[20px] text-center text-sm text-[#64748b]">
            {isPricingCardLoading || !activePlanData ? (
              <span className="inline-flex items-center gap-2 font-semibold text-[#004368]">
                <Loader2 size={14} className="animate-spin" />
                {t("pricing.loadingLatestPricing")}
              </span>
            ) : (
              <>
                {t("pricing.amountForSelection")}{" "}
                <span className="font-semibold text-[#004368]">
                  {formatPlanMoney(activePlanAmount, activePlanData?.currency || selectedCurrency)}
                </span>{" "}
                ({toPlural(displayStoreCount)}: {displayStoreCount})
                {isPricingLoading ? ` · ${t("pricing.loadingLatestPricing")}` : ""}
              </>
            )}
          </p>

          <div className="mt-8 grid w-full max-w-[560px] grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-[#64748b]">
              {t("pricing.country")}
              <select
                value={selectedCountry}
                onChange={handleCountryChange}
                className="mt-1 h-10 w-full rounded-md border border-[#CBD5E1] bg-white px-3 text-sm font-semibold text-[#1f2937] outline-none"
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-[#64748b]">
              {t("pricing.currency")}
              <select
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                className="mt-1 h-10 w-full rounded-md border border-[#CBD5E1] bg-white px-3 text-sm font-semibold text-[#1f2937] outline-none"
              >
                {CURRENCY_OPTIONS.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-8 w-full">
            <div className="mx-auto w-full max-w-[1280px] overflow-visible rounded-[16px] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="grid grid-cols-1 gap-0 md:grid-cols-2 xl:grid-cols-4">
                {isPricingCardLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`pricing-loading-${index}`}
                      className="relative min-w-0 overflow-visible"
                    >
                      <PricingCardSkeleton active={index === 2} />
                    </div>
                  ))
                  : displayPricingPlans.map((plan) => (
                    <div
                      key={plan.packageName}
                      className="relative min-w-0 overflow-visible"
                    >
                      <PlanCard
                        plan={plan}
                        activePlan={activePlan}
                        setActivePlan={setActivePlan}
                        storeCount={displayStoreCount}
                        isSelectionReady={isSelectionReady}
                        isCheckoutLoading={
                          isCheckingOut && checkingPlan === plan.packageName
                        }
                        anyCheckoutLoading={isCheckingOut}
                        onChoosePlan={handleCheckout}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
