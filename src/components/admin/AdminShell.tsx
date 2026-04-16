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
  { href: "/contacts", label: "Contacts", icon: "contacts" },
  { href: "/workflows", label: "Workflows", icon: "alt_route" },
  { href: "/integrations", label: "Integrations", icon: "apps" },
  { href: "/routing", label: "Routing", icon: "route" },
];

// Secondary nav — shown above the Account button in a separate section, the
// way Calendly groups "Analytics" and "Admin center" away from the primary
// workflow links.
const secondaryNav = [
  { href: "/analytics", label: "Analytics", icon: "bar_chart" },
  { href: "/admin-center", label: "Admin center", icon: "admin_panel_settings" },
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
        {/* Brand + close button (mobile). Fixed at the top — does NOT scroll. */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary">
                <Icon name="event_note" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-on-surface leading-tight">Scheduler</h1>
                <p className="text-[10px] uppercase tracking-wider text-outline font-bold">Admin Console</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="md:hidden text-outline hover:text-on-surface p-1 -mr-1"
            >
              <Icon name="close" />
            </button>
          </div>
        </div>

        {/* Primary nav — scrollable region between the brand and the footer
            section so tall sidebars on short viewports (e.g. landscape phone)
            don't clip nav items. */}
        <nav className="flex-1 overflow-y-auto px-6 pb-4 space-y-1">
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

        {/* Footer: secondary nav + Account. Sits below the scroll region. */}
        <div className="shrink-0 px-6 pb-6 pt-2 space-y-1 border-t border-outline-variant/20">
          {secondaryNav.map((n) => {
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
                <Icon name={n.icon} /> <span className="text-sm">{n.label}</span>
              </Link>
            );
          })}
          {(() => {
            const active = pathname === "/account" || pathname.startsWith("/account/");
            return (
              <Link
                href="/account"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-semibold",
                  active
                    ? "text-primary bg-surface-container-lowest"
                    : "text-on-surface-variant hover:bg-surface-container-lowest/60",
                )}
              >
                <Icon name="account_circle" /><span className="text-sm">Account</span>
              </Link>
            );
          })()}
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
              <Link
                href="/account"
                aria-label="Account"
                className="flex items-center gap-3 rounded-full pl-2 pr-1 py-1 -mr-1 hover:bg-surface-container-lowest/60 transition-colors group"
              >
                <span className="hidden sm:inline text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">Fhd</span>
                <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary font-bold text-sm ring-2 ring-transparent group-hover:ring-primary/30 transition">F</div>
              </Link>
            </div>
          </div>
        </header>
        <main className="pt-24 px-4 md:px-8 pb-16 max-w-[1200px] mx-auto">{children}</main>
      </div>
    </>
  );
}
