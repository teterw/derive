import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-5xl text-muted">404</p>
      <h1 className="text-xl font-semibold">{t("notFoundTitle")}</h1>
      <Link href="/" className="text-sm text-accent hover:underline">
        {t("backHome")}
      </Link>
    </div>
  );
}
