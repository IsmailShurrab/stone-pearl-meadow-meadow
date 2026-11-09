import { clsx, type ClassValue } from "clsx";
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet" | "danger" | "ghost";
};

export function Button({ variant = "quiet", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-fg hover:bg-primary/90",
        variant === "quiet" && "border border-border bg-surface text-fg hover:bg-ok-soft",
        variant === "danger" && "bg-danger-soft text-danger",
        variant === "ghost" && "bg-transparent text-muted hover:bg-surface hover:text-fg",
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({ className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-2xl text-muted transition-colors hover:bg-danger-soft hover:text-danger",
        className,
      )}
      {...props}
    />
  );
}

export function Sheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-fg/40 p-3 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-fg">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export function ReadingField({
  label,
  value,
  onChange,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input
        dir="ltr"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        placeholder="0.000"
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-14 w-full rounded-2xl border bg-bg px-3 text-left text-2xl font-medium text-fg tabular-nums outline-none focus:border-primary",
          invalid ? "border-danger" : "border-border",
        )}
      />
    </label>
  );
}
