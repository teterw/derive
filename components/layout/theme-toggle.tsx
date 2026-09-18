"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "derive-theme";
const ORDER: Theme[] = ["system", "light", "dark"];
const ICONS = { system: Monitor, light: Sun, dark: Moon } as const;

/**
 * localStorage is the source of truth (the inline script in the layout reads
 * it before paint), so the component subscribes to it rather than keeping a
 * second copy in React state that would go stale across tabs.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function writeTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "system") {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    root.classList.add(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }
  for (const listener of listeners) listener();
}

export function ThemeToggle({ label }: { label: string }) {
  const theme = useSyncExternalStore<Theme>(
    subscribe,
    readTheme,
    () => "system",
  );
  const Icon = ICONS[theme];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => writeTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]!)}
      title={label}
      aria-label={label}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
