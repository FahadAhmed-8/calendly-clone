"use client";
import { cn } from "@/lib/cn";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "ghost" | "subtle" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary hover:bg-primary-container text-on-primary shadow-lg shadow-primary/20",
  ghost: "bg-transparent text-primary hover:bg-surface-container-low",
  subtle: "bg-surface-container-high text-on-surface hover:bg-surface-container",
  danger: "bg-error hover:bg-error/90 text-on-error",
  icon: "bg-transparent text-outline hover:text-primary",
};
const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded",
  md: "h-10 px-5 text-sm rounded-lg",
  lg: "h-12 px-6 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", className, loading, disabled, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        variant !== "icon" && sizes[size],
        className,
      )}
      {...rest}
    >
      {loading ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span> : children}
    </button>
  );
});
