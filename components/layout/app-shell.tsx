import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Dumbbell,
  FileText,
  LogOut,
  RotateCw,
  Sigma,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/daily", key: "daily", icon: CalendarDays, onPhone: true },
  { href: "/learn", key: "learn", icon: BookOpen, onPhone: false },
  { href: "/practice", key: "practice", icon: Dumbbell, onPhone: true },
  { href: "/exam", key: "exam", icon: FileText, onPhone: false },
  { href: "/review", key: "review", icon: RotateCw, onPhone: true },
  { href: "/stats", key: "stats", icon: BarChart3, onPhone: true },
  { href: "/rules", key: "formulas", icon: Sigma, onPhone: false },
] as const;

/**
 * The frame every signed-in page sits in.
 *
 * On a laptop the destinations are a row in the header. On a phone they are a
 * bottom bar, where a thumb can reach them - the app has to be usable on a
 * phone, and a hidden hamburger is not the same thing (PROMPT.md §10).
 */
export async function AppShell({
  locale,
  user,
  children,
}: {
  locale: Locale;
  user: SessionUser;
  children: React.ReactNode;
}) {
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tApp = await getTranslations("app");

  const phoneNav = NAV.filter((item) => item.onPhone);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            {/*
              `priority` because this is above the fold on every page in the
              app, and the header reflowing after it arrives is the kind of
              small lurch that makes a site feel cheap.
            */}
            <Image
              src="/brand/mark.png"
              alt=""
              width={28}
              height={28}
              priority
              className="h-7 w-7 shrink-0"
            />
            {/*
              The tagline tucks under the wordmark and aligns to its right
              edge, so the two read as one lockup rather than as two separate
              things sitting side by side. Stacked it also costs no horizontal
              space, which is why it no longer has to hide on a phone the way
              it did when it sat alongside.
            */}
            <span className="flex flex-col justify-center">
              <span className="text-base font-semibold leading-tight tracking-tight">
                {tApp("name")}
              </span>
              <span className="self-end text-[10px] leading-tight text-muted">
                {tApp("tagline")}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded px-2 py-1 text-muted hover:bg-surface-2 hover:text-fg"
              >
                {t(item.key)}
              </Link>
            ))}
            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="rounded px-2 py-1 text-muted hover:bg-surface-2 hover:text-fg"
              >
                {t("admin")}
              </Link>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <LocaleSwitch />
            <ThemeToggle label={tCommon("theme")} />
            {user.role === "admin" ? (
              <Link
                href="/admin"
                className="rounded px-2 py-1 text-sm text-muted hover:text-fg lg:hidden"
              >
                {t("admin")}
              </Link>
            ) : null}
            <form action={logoutAction}>
              <input type="hidden" name="locale" value={locale} />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                title={t("logout")}
                aria-label={t("logout")}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Between phone and laptop, a scrolling strip beats a hidden menu. */}
        <nav className="mx-auto hidden w-full max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm sm:flex lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded px-2 py-1 text-muted hover:bg-surface-2 hover:text-fg"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:pb-8">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface sm:hidden">
        <ul className="flex">
          {phoneNav.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className="flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted active:text-accent"
                >
                  <Icon className="h-5 w-5" />
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
