import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";

/** Routes appear here as they land. Stats arrives in Phase 3. */
const NAV = [
  { href: "/learn", key: "learn" },
  { href: "/practice", key: "practice" },
  { href: "/exam", key: "exam" },
  { href: "/review", key: "review" },
  { href: "/rules", key: "formulas" },
] as const;

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

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-4 px-4">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight">
              {tApp("name")}
            </span>
            <span className="text-xs text-muted">{tApp("tagline")}</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
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
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
