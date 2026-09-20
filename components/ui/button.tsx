import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:opacity-90",
        secondary: "bg-surface-2 text-fg hover:bg-border",
        outline:
          "border border-border bg-transparent text-fg hover:bg-surface-2",
        ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-fg",
        danger: "bg-wrong text-bg hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /**
     * Something is in flight because of this button.
     *
     * Submitting an answer writes several rows and waits for the database, so
     * there is a real pause between the press and the verdict. The button was
     * already disabled for it - and a disabled button is indistinguishable
     * from a page that has stopped responding. A turning spinner is the whole
     * difference between "working" and "broken".
     *
     * `aria-busy` says the same thing to a screen reader, which otherwise gets
     * only "dimmed" out of the same moment.
     */
    busy?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  busy,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? busy}
      aria-busy={busy || undefined}
      {...props}
    >
      {busy ? (
        <span
          /*
           * `border-current` so it takes the button's own text colour and
           * works on every variant. Reduced motion stops it turning: the
           * spinner is then a static ring, which still reads as "not ready"
           * beside a dimmed label.
           */
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}
