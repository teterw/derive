"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * The last line of defence. It is deliberately plain: if something in the
 * shell is what broke, a fancy error page breaks with it.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    /*
     * `data-error-boundary` is what `pnpm render-check` looks for.
     *
     * It used to look for the strings Next.js puts on its *own* error page -
     * "Application error", a `digest` attribute - and this page is neither: it
     * is ours, and its text is a translated message. So a page that was
     * nothing but this rendered, returned 200, contained the shell, shipped
     * KaTeX's stylesheet and was reported `ok`. An attribute cannot be
     * translated away, and cannot rot when the copy changes.
     */
    <div
      data-error-boundary
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h1 className="text-xl font-semibold">{t("errorTitle")}</h1>
      <p className="text-sm text-muted">{t("errorBody")}</p>
      {error.digest ? (
        <p className="font-mono text-xs text-muted">{error.digest}</p>
      ) : null}
      <Button onClick={reset}>{t("tryAgain")}</Button>
    </div>
  );
}
