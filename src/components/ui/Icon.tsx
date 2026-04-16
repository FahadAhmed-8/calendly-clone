import { cn } from "@/lib/cn";

/**
 * Material Symbols icon. The `filled` prop switches the FILL axis from 0
 * to 1 for a bolder, Calendly-style look. Use `filled` on active nav
 * items; leave it off for inactive ones so they read as softer.
 */
export function Icon({
  name,
  className,
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      className={cn(
        "material-symbols-outlined",
        filled && "material-symbols-filled",
        className,
      )}
    >
      {name}
    </span>
  );
}
