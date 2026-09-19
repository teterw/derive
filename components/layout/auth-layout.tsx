import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LocaleSwitch } from "./locale-switch";
import { ThemeToggle } from "./theme-toggle";

export async function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const tApp = await getTranslations("app");
  const tAuth = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-md items-center justify-end gap-2 px-4 pt-4">
        <LocaleSwitch />
        <ThemeToggle label={tCommon("theme")} />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        {/*
          The one place the full lockup gets to be the hero. Everywhere else
          the mark rides in a 28px header slot, where the wordmark under it
          would be illegible anyway.

          The name stays in the markup as the h1, visually hidden: the logo is
          an image of a word, and a screen reader and a search engine both need
          the word itself.
        */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/brand/logo.png"
            alt=""
            width={200}
            height={195}
            priority
            className="h-auto w-40"
          />
          <h1 className="sr-only">{tApp("name")}</h1>
          <p className="mt-2 text-sm text-muted">{tApp("tagline")}</p>
        </div>

        <Card className="space-y-6">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          {children}
        </Card>

        <p className="mt-6 text-center text-xs text-muted">
          {tAuth("inviteOnly")}
        </p>
      </div>
    </div>
  );
}
