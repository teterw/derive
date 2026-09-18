"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { loginAction, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/card";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {label}
    </Button>
  );
}

export function LoginForm({ locale, next }: { locale: string; next: string }) {
  const t = useTranslations("auth");
  const [state, formAction] = useActionState<AuthState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />

      <Field label={t("username")}>
        <Input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus
        />
      </Field>

      <Field label={t("password")}>
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
        <Checkbox name="remember" defaultChecked />
        {t("rememberMe")}
      </label>

      {state?.error ? <FormError>{t(`errors.${state.error}`)}</FormError> : null}

      <SubmitButton label={t("login")} />
    </form>
  );
}
