import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  params,
  searchParams,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const { next } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <AuthLayout title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      <LoginForm locale={locale} next={typeof next === "string" ? next : ""} />
      <p className="text-center text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/register" className="text-accent hover:underline">
          {t("register")}
        </Link>
      </p>
    </AuthLayout>
  );
}
