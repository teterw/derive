"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A panel that slides in from the right and never covers the question.
 *
 * On a phone it becomes a bottom sheet, because a side panel on a 390px screen
 * is the whole screen anyway.
 */
export function SlideOver({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    if (open) panel.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-label="close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/20"
      />
      <div
        ref={panel}
        role="dialog"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "absolute right-0 flex flex-col border-border bg-surface shadow-xl outline-none",
          "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-xl border-t",
          "sm:inset-y-0 sm:left-auto sm:max-h-none sm:rounded-none sm:border-l",
          wide ? "sm:w-[36rem]" : "sm:w-96",
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="close">
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
