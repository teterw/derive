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
  ShieldCheck,
  Sigma,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";
import { Avatar, avatarSeed, avatarUrl } from "@/components/profile/avatar";
import { BackLink } from "./back-link";
import { HeaderXp } from "@/components/profile/header-xp";
import { XpProvider } from "@/components/profile/xp-context";
import { getTotalXp } from "@/lib/profile/queries";
import { NavLink } from "./nav-link";
import { ProfileMenu } from "./profile-menu";
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
  back,
}: {
  locale: Locale;
  user: SessionUser;
  children: React.ReactNode;
  /**
   * Where "up" goes from this page, for pages you can be inside. Top-level
   * destinations pass nothing - see `BackLink` for why they should not.
   */
  back?: { href: string; label: string };
}) {
  const t = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tApp = await getTranslations("app");

  const phoneNav = NAV.filter((item) => item.onPhone);

  /*
   * One indexed sum over this learner's own day rows. It is on every page
   * because the level is, and a level that only appeared on some pages would
   * be worse than none.
   */
  const totalXp = await getTotalXp(user.id);

  return (
    <XpProvider initialXp={totalXp}>
      <div className="flex min-h-dvh flex-col">
        {/*
          `relative z-50` so the header owns a stacking context above the page
          for the profile menu to hang in.

          It is a guard rather than a fix: the menu already paints on top
          without it, because it is an absolutely-positioned child of a
          positioned wrapper and the content below is in normal flow. What it
          guards against is the content below acquiring a z-index or a
          stacking context of its own - `.page-enter` already animates a
          transform, which makes one - and quietly winning.
        */}
        <header className="relative z-50 border-b border-border">
          <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4">
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

            <nav className="hidden items-center gap-0.5 text-sm xl:flex">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.href} href={item.href} variant="header">
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {t(item.key)}
                  </NavLink>
                );
              })}
              {user.role === "admin" ? (
                <NavLink href="/admin" variant="header">
                  <ShieldCheck className="size-4 shrink-0" aria-hidden />
                  {t("admin")}
                </NavLink>
              ) : null}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {/*
                Your own face, and behind it the things that belong to your
                account rather than to the app. The header used to carry the
                avatar and a sign-out button as two separate icons beside the
                locale and theme controls, which mixed "you" in with "the
                site"; the five account destinations live together now.
              */}
              <ProfileMenu
                username={user.username}
                displayName={user.displayName}
                label={t("profile")}
                labels={{
                  stats: t("stats"),
                  people: t("people"),
                  profile: t("profile"),
                  settings: t("settings"),
                }}
                avatar={
                  <Avatar
                    seed={avatarSeed(user.username, user.avatarSlot)}
                    src={avatarUrl(user.username, user.avatarUpdatedAt)}
                    size={28}
                    className="h-7 w-7"
                  />
                }
                /*
                 * The form is built here, in the server component, so the
                 * action stays a server action and the menu never has to
                 * import one.
                 */
                signOut={
                  <form action={logoutAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      role="menuitem"
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-surface-2 hover:text-wrong focus-visible:bg-surface-2 focus-visible:text-wrong"
                    >
                      <LogOut className="size-4 shrink-0 text-muted" aria-hidden />
                      {t("logout")}
                    </button>
                  </form>
                }
              />
              {/*
              The level rides next to your own face, which is the only place it
              belongs - the alternative was a second profile card in the body of
              the page, and two faces on one screen saying the same thing.
            */}
              <HeaderXp />
              <LocaleSwitch />
              <ThemeToggle label={tCommon("theme")} />
            </div>
          </div>

          {/*
          A scrolling strip beats a hidden menu at any width below the laptop
          layout. On a phone it carries only what the bottom bar does not, so
          the two never repeat each other; from `sm` up, where there is no
          bottom bar, it carries everything.
        */}
          {/*
            `[scrollbar-width:none]` and the webkit rule: a horizontal
            scrollbar under a 32px row of chips is taller than the gap it sits
            in and makes the header look broken. The row still scrolls, and a
            chip cut off at the right edge is what says so.
          */}
          <nav className="mx-auto flex w-full max-w-7xl gap-1.5 overflow-x-auto px-4 pb-2.5 text-sm [-ms-overflow-style:none] [scrollbar-width:none] xl:hidden [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  variant="strip"
                  className={cn(item.onPhone && "hidden sm:inline-flex")}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {t(item.key)}
                </NavLink>
              );
            })}
            {/*
            Admin rides in the strip rather than the header below `lg`. In the
            header it was the item that pushed a 390px phone over the edge, and
            it is the least-used destination of the lot.
          */}
            {user.role === "admin" ? (
              <NavLink href="/admin" variant="strip">
                <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
                {t("admin")}
              </NavLink>
            ) : null}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:pb-8">
          {/*
          Above the transition, not inside it: the way out of a page should not
          fade in and out as the page changes, and on a slow render it is the
          one control that wants to be there immediately.
        */}
          {back ? (
            <div className="mb-4">
              <BackLink href={back.href} label={back.label} />
            </div>
          ) : null}
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
    </XpProvider>
  );
}
