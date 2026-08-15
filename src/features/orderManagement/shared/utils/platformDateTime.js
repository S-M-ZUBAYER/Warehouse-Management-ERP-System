const REGION_DATE_FORMATS = {
  BD: { locale: "en-GB", timeZone: "Asia/Dhaka" },
  BN: { locale: "en-GB", timeZone: "Asia/Brunei" },
  CN: { locale: "en-GB", timeZone: "Asia/Shanghai" },
  HK: { locale: "en-GB", timeZone: "Asia/Hong_Kong" },
  ID: { locale: "en-GB", timeZone: "Asia/Jakarta" },
  KH: { locale: "en-GB", timeZone: "Asia/Phnom_Penh" },
  LA: { locale: "en-GB", timeZone: "Asia/Vientiane" },
  MM: { locale: "en-GB", timeZone: "Asia/Yangon" },
  MO: { locale: "en-GB", timeZone: "Asia/Macau" },
  MY: { locale: "en-GB", timeZone: "Asia/Kuala_Lumpur" },
  PH: { locale: "en-GB", timeZone: "Asia/Manila" },
  SG: { locale: "en-GB", timeZone: "Asia/Singapore" },
  TH: { locale: "en-GB", timeZone: "Asia/Bangkok" },
  TW: { locale: "en-GB", timeZone: "Asia/Taipei" },
  VN: { locale: "en-GB", timeZone: "Asia/Ho_Chi_Minh" },
};

const REGION_ALIASES = {
  BANGLADESH: "BD",
  BRUNEI: "BN",
  CAMBODIA: "KH",
  CHINA: "CN",
  HONGKONG: "HK",
  "HONG KONG": "HK",
  INDONESIA: "ID",
  LAOS: "LA",
  MACAU: "MO",
  MALAYSIA: "MY",
  MYANMAR: "MM",
  PHILIPPINES: "PH",
  SINGAPORE: "SG",
  THAILAND: "TH",
  TAIWAN: "TW",
  VIETNAM: "VN",
};

export const resolvePlatformRegion = (...values) => {
  for (const value of values) {
    const raw = String(value || "").trim();
    if (!raw || raw === "-") continue;

    const upper = raw.toUpperCase();
    const compact = upper.replace(/[^A-Z]/g, "");
    const code = REGION_DATE_FORMATS[upper]
      ? upper
      : REGION_ALIASES[upper] || REGION_ALIASES[compact] || "";

    if (code && REGION_DATE_FORMATS[code]) return code;
  }

  return "";
};

export const getPlatformDateFormat = (...regions) => {
  const region = resolvePlatformRegion(...regions);
  return region ? REGION_DATE_FORMATS[region] : null;
};

export const formatPlatformDateTime = (value, region, options = {}) => {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const regionFormat = getPlatformDateFormat(region);
  const locale = regionFormat?.locale || "en-GB";
  const formatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...options,
  };

  if (regionFormat?.timeZone) {
    formatOptions.timeZone = regionFormat.timeZone;
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
};
