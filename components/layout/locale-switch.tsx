"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = { th: "ไทย", en: "EN" };

/**
 * Switching language keeps you on the same page, with the same query string -
 * a translation must never cost you your place (PROMPT.md §10).
 */
export function LocaleSwitch() {
  const active = useLocale() as Locale;
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const router = useRouter();

  function switchTo(locale: Locale) {
    if (locale === active) return;
    // usePathname() from i18n/navigation is locale-stripped, so the same
    // string works for both locales.
    router.replace(search ? `${pathname}?${search}` : pathname, { locale });
  }

  return (
    <div className="flex items-center rounded-md border border-border p-0.5 text-xs">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => switchTo(locale)}
          aria-current={locale === active ? "true" : undefined}
          className={cn(
            "cursor-pointer rounded px-2 py-1 transition-colors",
            locale === active
              ? "bg-surface-2 font-medium text-fg"
              : "text-muted hover:text-fg",
          )}
        >
          {LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
