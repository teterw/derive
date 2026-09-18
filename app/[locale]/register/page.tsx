import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { AuthLayout } from "@/components/layout/auth-layout";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  params,
  searchParams,
}: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  // An admin can hand out /register?code=ABCD-EFGH-JKMN and skip a retype.
  const { code } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <AuthLayout title={t("registerTitle")} subtitle={t("registerSubtitle")}>
      <RegisterForm locale={locale} code={typeof code === "string" ? code : ""} />
      <p className="text-center text-sm text-muted">
        {t("haveAccount")}{" "}
        <Link href="/login" className="text-accent hover:underline">
          {t("login")}
        </Link>
      </p>
    </AuthLayout>
  );
}
