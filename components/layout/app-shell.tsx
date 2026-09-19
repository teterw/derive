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
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, avatarSeed, avatarUrl } from "@/components/profile/avatar";
import { NavLink } from "./nav-link";
import { PageTransition } from "./page-transition";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";

/**
 * `onPhone` marks the five *modes* - the things you come here to do - which
 * get a thumb-reachable slot in the bottom bar.
 *
 * It does not mean "only these exist on a phone". It used to: the strip that
 * carried everything else was `hidden sm:flex`, so below 640px สอบ, เรียน and
 * สูตร had no route to them at all. Three destinations, unreachable on the
 * device most learners actually use. The strip below now carries whatever the
 * bottom bar does not.
 */
const NAV = [
  { href: "/daily", key: "daily", icon: CalendarDays, onPhone: true },
  { href: "/learn", key: "learn", icon: BookOpen, onPhone: false },
  { href: "/practice", key: "practice", icon: Dumbbell, onPhone: true },
  { href: "/exam", key: "exam", icon: FileText, onPhone: true },
  { href: "/review", key: "review", icon: RotateCw, onPhone: true },
  { href: "/stats", key: "stats", icon: BarChart3, onPhone: true },
  { href: "/rules", key: "formulas", icon: Sigma, onPhone: false },
  { href: "/people", key: "people", icon: Users, onPhone: false },
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
              width={40}
              height={40}
              priority
              className="h-9 w-9 shrink-0 sm:h-10 sm:w-10"
            />
            {/*
              The tagline tucks under the wordmark and aligns to its right
              edge, so the two read as one lockup rather than as two separate
              things sitting side by side. Stacked it also costs no horizontal
              space, which is why it no longer has to hide on a phone the way
              it did when it sat alongside.
            */}
            <span className="flex flex-col justify-center">
              {/*
                `whitespace-nowrap`: at 390px, with the avatar now in the
                header too, "Derive" was breaking across two lines mid-word.
              */}
              <span className="whitespace-nowrap text-base font-semibold leading-tight tracking-tight">
                {tApp("name")}
              </span>
              <span className="self-end whitespace-nowrap text-[10px] leading-tight text-muted">
                {tApp("tagline")}
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm lg:flex">
            {NAV.map((item) => (
              <NavLink key={item.href} href={item.href} variant="header">
                {t(item.key)}
              </NavLink>
            ))}
            {user.role === "admin" ? (
              <NavLink href="/admin" variant="header">
                {t("admin")}
              </NavLink>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/*
              Your own face is the way in to your profile - the convention
              everywhere, and it saves a word of chrome in a header that is
              already tight on a phone.
            */}
            {/*
              A ring rather than a bar: the avatar is round and an underline
              beneath a circle reads as a mistake. Same accent, same meaning.
            */}
            <NavLink
              href={`/u/${user.username}`}
              variant="avatar"
              title={t("profile")}
              aria-label={t("profile")}
            >
              <Avatar
                seed={avatarSeed(user.username, user.avatarSlot)}
                src={avatarUrl(user.username, user.avatarUpdatedAt)}
                size={28}
                className="h-7 w-7"
              />
            </NavLink>
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

        {/*
          A scrolling strip beats a hidden menu at any width below the laptop
          layout. On a phone it carries only what the bottom bar does not, so
          the two never repeat each other; from `sm` up, where there is no
          bottom bar, it carries everything.
        */}
        <nav className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 pb-2 text-sm lg:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              variant="strip"
              className={cn(item.onPhone && "hidden sm:block")}
            >
              {t(item.key)}
            </NavLink>
          ))}
          {/*
            Admin rides in the strip rather than the header below `lg`. In the
            header it was the item that pushed a 390px phone over the edge, and
            it is the least-used destination of the lot.
          */}
          {user.role === "admin" ? (
            <NavLink href="/admin" variant="strip">
              {t("admin")}
            </NavLink>
          ) : null}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:pb-8">
        <PageTransition>{children}</PageTransition>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface sm:hidden">
        <ul className="flex">
          {phoneNav.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <NavLink href={item.href} variant="tab">
                  <Icon className="h-5 w-5" />
                  {t(item.key)}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
