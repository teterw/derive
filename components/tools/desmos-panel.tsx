"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The Desmos graphing calculator, loaded only when it is first opened - it is
 * a third-party script and has no business on the critical path of a practice
 * session that may never graph anything.
 */
declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (
        element: HTMLElement,
        options?: Record<string, unknown>,
      ) => { destroy: () => void };
    };
  }
}

const API_VERSION = "v1.11";

export function DesmosPanel({
  apiKey,
  labels,
  /**
   * In the docked rail the panel is given a share of the viewport height and
   * has to fill it. A viewport-relative height would overflow its own slot.
   */
  fill = false,
}: {
  apiKey: string;
  labels: { missingKey: string; loading: string; failed: string };
  fill?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    if (!apiKey) return;
    let calculator: { destroy: () => void } | null = null;
    let cancelled = false;

    function mount() {
      if (cancelled || !container.current || !window.Desmos) return;
      calculator = window.Desmos.GraphingCalculator(container.current, {
        expressions: true,
        settingsMenu: false,
        zoomButtons: true,
        border: false,
        lockViewport: false,
      });
      setState("ready");
    }

    if (window.Desmos) {
      mount();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        "script[data-desmos]",
      );
      const script = existing ?? document.createElement("script");
      script.dataset.desmos = "true";
      script.src = `https://www.desmos.com/api/${API_VERSION}/calculator.js?apiKey=${encodeURIComponent(apiKey)}`;
      script.async = true;
      script.addEventListener("load", mount);
      script.addEventListener("error", () => {
        if (!cancelled) setState("failed");
      });
      if (!existing) document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      calculator?.destroy();
    };
  }, [apiKey]);

  if (!apiKey) {
    return <p className="text-sm text-muted">{labels.missingKey}</p>;
  }

  return (
    <div className={fill ? "flex h-full flex-col gap-2" : "space-y-2"}>
      <div
        ref={container}
        className={
          fill
            ? "min-h-0 w-full flex-1 rounded-md border border-border"
            : "h-[60dvh] w-full rounded-md border border-border sm:h-[70dvh]"
        }
      />
      {state !== "ready" ? (
        <p className="text-xs text-muted">
          {state === "failed" ? labels.failed : labels.loading}
        </p>
      ) : null}
    </div>
  );
}
