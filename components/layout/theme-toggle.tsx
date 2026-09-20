"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const STORAGE_KEY = "derive-theme";

/**
 * Two states, not three.
 *
 * It used to cycle system → light → dark, which meant a third icon nobody
 * recognised and two presses to get from the theme you were looking at to the
 * other one. "System" is still what an account gets before it has ever
 * chosen - the inline script in the layout stamps no class and the media
 * query decides - but it stops being somewhere the button can land you.
 *
 * So the *effective* theme is what the button reflects: whatever the page is
 * actually wearing, whether that came from a stored choice or from the
 * operating system. Pressing it writes the opposite, which turns an
 * inherited preference into a chosen one. There is no way back to "follow the
 * system" from here, and that is the trade: it costs an option almost nobody
 * used and buys a button that does the obvious thing.
 *
 * localStorage is the source of truth (the inline script reads it before
 * paint), so this subscribes to it rather than keeping a second copy in React
 * state that would go stale across tabs. The media query is subscribed to as
 * well, because with nothing stored it is what decides.
 */
const listeners = new Set<() => void>();

function darkQuery(): MediaQueryList | null {
  return typeof window === "undefined"
    ? null
    : window.matchMedia("(prefers-color-scheme: dark)");
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  const query = darkQuery();
  query?.addEventListener("change", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
    query?.removeEventListener("change", onChange);
  };
}

/** What the page is wearing right now, chosen or inherited. */
function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* private mode, blocked storage: fall through to the system answer */
  }
  return darkQuery()?.matches ? "dark" : "light";
}

function writeTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* the class is still stamped, so the choice holds for this page at least */
  }
  for (const listener of listeners) listener();
}

export function ThemeToggle({ label }: { label: string }) {
  /*
   * The server cannot know which theme the browser will resolve to, so it
   * renders the light icon and the first client render corrects it. That is a
   * single icon swap on a 16px glyph, which is why this does not go to the
   * lengths the *page* does - there the inline script stamps the class before
   * paint, because a whole page flashing the wrong colour is another matter.
   */
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "light");
  const Icon = theme === "dark" ? Moon : Sun;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => writeTheme(theme === "dark" ? "light" : "dark")}
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
