/** DockPass application config — central constants */

export const APP_CONFIG = {
  name: "DockPass",
  tagline: "Your charter trip, all in one link",
  domain: "dockpass.io",
  company: "Oakmont Logic LLC",

  // Design tokens (also in globals.css)
  colors: {
    navy: "#0C447C",
    midBlue: "#1A6FB5",
    lightBlue: "#E8F2FB",
    white: "#FFFFFF",
    offWhite: "#F5F8FC",
    darkText: "#0D1B2A",
    greyText: "#6B7C93",
    border: "#D0E2F3",
    successBg: "#E8F9F4",
    successText: "#1D9E75",
    warningBg: "#FEF3DC",
    warningText: "#E5910A",
    errorBg: "#FDEAEA",
    errorText: "#D63B3B",
  },

  // Pricing tiers
  tiers: {
    solo: { boats: 1, price: 4900, label: "Solo" },
    captain: { boats: 3, price: 8900, label: "Captain" },
    fleet: { boats: 10, price: 17900, label: "Fleet" },
    marina: { boats: Infinity, price: 34900, label: "Marina" },
  },

  // Supported languages
  languages: ["en", "es", "pt", "fr", "de", "it", "ru"] as const,

  // Revenue
  addonCommissionRate: 0.08, // 8%
} as const;

export type SubscriptionTier = keyof typeof APP_CONFIG.tiers;
export type SupportedLanguage = (typeof APP_CONFIG.languages)[number];
