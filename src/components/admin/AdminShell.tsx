"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/event-types", label: "Event Types", icon: "event_note" },
  { href: "/meetings", label: "Meetings", icon: "schedule" },
  { href: "/availability", label: "Availability", icon: "calendar_today" },
];

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  // Mobile drawer state. Defaults closed so the content fills the screen
  // on phones. On md+ the sidebar is always visible and this state is a
  // no-op (CSS handles that with `md:translate-x-0`).
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer on navigation — otherwise it stays open covering the
  // page the user just navigated to.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Lock body scroll while the drawer is open so the page behind doesn't
  // scroll along with drag/swipe gestures on mobile.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile backdrop — rendered only when the drawer is open. */}
      {mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40 animate-in fade-in"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-[240px] bg-surface-container-low flex flex-col z-50",
          "transition-transform duration-200 ease-out",
          // On mobile: slide off-screen when closed. On md+: always visible.
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0",
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary">
                <Icon name="event_note" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-on-surface leading-tight">Scheduler</h1>
                <p className="text-[10px] uppercase tracking-wider text-outline font-bold">Admin Console</p>
              </div>
            </div>
            {/* Close button inside the drawer — mobile only. */}
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="md:hidden text-outline hover:text-on-surface p-1 -mr-1"
            >
              <Icon name="close" />
            </button>
          </div>
          <nav className="space-y-1">
            {nav.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "/");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 font-semibold",
                    active ? "text-primary bg-surface-container-lowest" : "text-on-surface-variant hover:bg-surface-container-lowest/60",
                  )}
                >
                  <Icon name={n.icon} /> <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-6 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-lowest/60 rounded-lg transition-colors">
            <Icon name="account_circle" /><span className="text-sm font-medium">Account</span>
          </button>
        </div>
      </aside>

      {/* Main column — only offsets on md+ where the sidebar is always shown. */}
      <div className="md:ml-[240px] min-h-screen">
        <header className="fixed top-0 left-0 right-0 md:left-[240px] h-16 bg-surface-container-lowest/80 backdrop-blur-md z-30">
          <div className="flex justify-between items-center px-4 md:px-8 h-full max-w-[1200px] mx-auto w-full">
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger — mobile only. */}
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="md:hidden text-on-surface-variant hover:text-primary transition -ml-1 p-1"
              >
                <Icon name="menu" className="text-2xl" />
              </button>
              <div className="text-lg md:text-xl font-bold tracking-tight text-on-surface truncate">{title}</div>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
              <div className="hidden sm:flex items-center gap-4 text-outline">
                <button className="hover:text-primary transition-all"><Icon name="notifications" /></button>
                <button className="hover:text-primary transition-all"><Icon name="help" /></button>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm font-medium text-on-surface-variant">Fhd</span>
                <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary font-bold text-sm">F</div>
              </div>
            </div>
          </div>
        </header>
        <main className="pt-24 px-4 md:px-8 pb-16 max-w-[1200px] mx-auto">{children}</main>
      </div>
    </>
  );
}
