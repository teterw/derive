import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("block text-sm font-medium text-fg", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg",
        "placeholder:text-muted disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Checkbox({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 rounded border-border accent-accent",
        className,
      )}
      {...props}
    />
  );
}

export function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-xs text-muted", className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  // The label wraps the control, so no id/htmlFor pair to keep in sync.
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-fg">{label}</span>
      {children}
      {hint ? <FieldHint>{hint}</FieldHint> : null}
    </label>
  );
}
