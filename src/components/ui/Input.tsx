"use client";
import { cn } from "@/lib/cn";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: string }>(
  function Input({ className, error, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-10 px-3 text-sm rounded bg-surface-container-lowest ghost-border focus-ring transition placeholder:text-outline",
          error && "shadow-[inset_0_0_0_1px_#ba1a1a]",
          className,
        )}
        {...rest}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }>(
  function Textarea({ className, error, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full min-h-[96px] p-3 text-sm rounded bg-surface-container-lowest ghost-border focus-ring transition placeholder:text-outline",
          error && "shadow-[inset_0_0_0_1px_#ba1a1a]",
          className,
        )}
        {...rest}
      />
    );
  },
);

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2", className)}>{children}</label>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-error mt-1 font-medium">{message}</p>;
}
