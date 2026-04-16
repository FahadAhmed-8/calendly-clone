import { cn } from "@/lib/cn";

/**
 * Three-dot loader matching Calendly's navigation loading animation.
 * Each dot pulses on a staggered delay.
 *
 * Use `fullscreen` to center it inside a flex-filled main column (e.g. when
 * a page is waiting on its primary query).
 */
export function PageLoader({
  fullscreen = true,
  className,
}: {
  fullscreen?: boolean;
  className?: string;
}) {
  const dots = (
    <div className={cn("flex items-center gap-2", className)} role="status" aria-label="Loading">
      <span className="block w-3 h-3 rounded-full bg-on-surface-variant/70 dot-pulse" style={{ animationDelay: "0ms" }} />
      <span className="block w-3 h-3 rounded-full bg-on-surface-variant/70 dot-pulse" style={{ animationDelay: "160ms" }} />
      <span className="block w-3 h-3 rounded-full bg-on-surface-variant/70 dot-pulse" style={{ animationDelay: "320ms" }} />
      <span className="sr-only">Loading…</span>
    </div>
  );

  if (!fullscreen) return dots;

  return (
    <div className="flex items-center justify-center min-h-[40vh] w-full">
      {dots}
    </div>
  );
}
