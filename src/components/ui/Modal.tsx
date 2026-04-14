"use client";
import { cn } from "@/lib/cn";
import { useEffect } from "react";
import { Icon } from "./Icon";

export function Modal({ open, onClose, title, children, size = "md" }: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-[480px]", md: "max-w-[640px]", lg: "max-w-[840px]" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm" onClick={onClose}>
      <div className={cn("w-full bg-surface-container-lowest rounded-xl shadow-elev-3 overflow-hidden", widths[size])} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-bold text-on-surface">{title}</h2>
          <button onClick={onClose} className="text-outline hover:text-primary" aria-label="Close"><Icon name="close" /></button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
