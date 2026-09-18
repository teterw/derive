"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import {
  createInviteCodeAction,
  type AdminState,
} from "@/lib/admin/actions";
import { formatInviteCode } from "@/lib/auth/invite";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormError } from "@/components/ui/card";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {label}
    </Button>
  );
}

export function InviteCodeForm({ locale }: { locale: string }) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [state, formAction] = useActionState<AdminState, FormData>(
    createInviteCodeAction,
    null,
  );
  const [copied, setCopied] = useState(false);

  async function copy(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="locale" value={locale} />
        <div className="min-w-48 flex-1">
          <Field label={t("note")}>
            <Input name="note" placeholder={t("notePlaceholder")} />
          </Field>
        </div>
        <div className="w-28">
          <Field label={t("maxUses")}>
            <Input name="maxUses" type="number" min={1} max={100} defaultValue={1} />
          </Field>
        </div>
        <div className="w-36">
          <Field label={t("expiresInDays")} hint={t("neverExpires") + " = 0"}>
            <Input
              name="expiresInDays"
              type="number"
              min={0}
              max={365}
              defaultValue={14}
            />
          </Field>
        </div>
        <SubmitButton label={t("createCode")} />
      </form>

      {state?.error ? <FormError>{state.error}</FormError> : null}

      {state?.createdCode ? (
        <div className="flex items-center gap-3 rounded-md border border-accent/40 bg-accent/10 px-4 py-3">
          <code className="font-mono text-lg tracking-widest">
            {formatInviteCode(state.createdCode)}
          </code>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => copy(state.createdCode!)}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? tCommon("copied") : tCommon("copy")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
