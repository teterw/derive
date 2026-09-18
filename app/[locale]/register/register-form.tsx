"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { registerAction, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/card";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {label}
    </Button>
  );
}

export function RegisterForm({
  locale,
  code,
}: {
  locale: string;
  code: string;
}) {
  const t = useTranslations("auth");
  const [state, formAction] = useActionState<AuthState, FormData>(
    registerAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <Field label={t("inviteCode")}>
        <Input
          name="inviteCode"
          defaultValue={code}
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono tracking-widest"
          required
          autoFocus={!code}
        />
      </Field>

      <Field label={t("username")} hint={t("usernameHint")}>
        <Input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          autoFocus={Boolean(code)}
        />
      </Field>

      <Field label={t("displayName")}>
        <Input name="displayName" autoComplete="nickname" required />
      </Field>

      <Field label={t("password")} hint={t("passwordHint")}>
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <Field label={t("confirmPassword")}>
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      {state?.error ? <FormError>{t(`errors.${state.error}`)}</FormError> : null}

      <SubmitButton label={t("register")} />
    </form>
  );
}
