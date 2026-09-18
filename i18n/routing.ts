import { defineRouting } from "next-intl/routing";

export const locales = ["th", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "th";

/**
 * Thai is the default locale and the source of truth for terminology
 * (PROMPT.md §10). `localePrefix: "always"` keeps /th and /en symmetrical so a
 * language toggle is a pure path swap and never loses the current page.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
});
