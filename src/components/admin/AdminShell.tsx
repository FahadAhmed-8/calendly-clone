"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

// Primary nav — the main workflow destinations. `comingSoon` surfaces a
// small "Soon" pill next to the label so users can see at a glance which
// destinations are wired up versus which are still placeholder screens.
const nav: Array<{ href: string; label: string; icon: string; comingSoon?: boolean }> = [
  { href: "/event-types", label: "Scheduling", icon: "event_note" },
  { href: "/meetings", label: "Meetings", icon: "schedule" },
  { href: "/availability", label: "Availability", icon: "calendar_today" },
  { href: "/contacts", label: "Contacts", icon: "contacts", comingSoon: true },
  { href: "/workflows", label: "Workflows", icon: "alt_route", comingSoon: true },
  { href: "/integrations", label: "Integrations", icon: "apps", comingSoon: true },
  { href: "/routing", label: "Routing", icon: "route", comingSoon: true },
];

// Secondary nav — grouped above the footer section, Calendly-style.
const secondaryNav: Array<{ href: string; label: string; icon: string; comingSoon?: boolean }> = [
  { href: "/analytics", label: "Analytics", icon: "bar_chart", comingSoon: true },
  { href: "/admin-center", label: "Admin center", icon: "admin_panel_settings", comingSoon: true },
];

const COLLAPSE_KEY = "scheduler.sidebar.collapsed";
const ACTIVE_BLUE = "#006bff"; // Calendly's action blue — matches primary-container.

// Single source of truth for the "not built yet" notice — reused by the
// Upgrade-plan pill and the Help-menu items. Keeps copy consistent.
const showUpgradeToast = () =>
  toast("Upgrade plan — coming soon", {
    description: "Analytics, workflows & premium integrations are on the roadmap.",
  });

const showComingSoonToast = (feature: string) =>
  toast(`${feature} — coming soon`, {
    description: "This corner of the product isn't wired up yet.",
  });

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Desktop collapse toggle — persists in localStorage so it survives reloads.
  const [collapsed, setCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement | null>(null);

  // Hydrate collapse state on mount (SSR-safe).
  useEffect(() => {
    try {
      const v = typeof window !== "undefined" ? window.localStorage.getItem(COLLAPSE_KEY) : null;
      if (v === "1") setCollapsed(true);
    } catch {
      /* ignore storage unavailable */
    }
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  // Close drawer / help popover on nav.
  useEffect(() => {
    setMobileOpen(false);
    setHelpOpen(false);
  }, [pathname]);

  // Close drawer on Escape.
  useEffect(() => {
    if (!mobileOpen && !helpOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMobileOpen(false);
      setHelpOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, helpOpen]);

  // Close help popover on outside click.
  useEffect(() => {
    if (!helpOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!helpRef.current) return;
      if (!helpRef.current.contains(e.target as Node)) setHelpOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [helpOpen]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[240px]";
  const mainOffset = collapsed ? "md:ml-[72px]" : "md:ml-[240px]";
  const headerOffset = collapsed ? "md:left-[72px]" : "md:left-[240px]";

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40 animate-in fade-in"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-white border-r border-outline-variant/30 flex flex-col z-50",
          "transition-[transform,width] duration-200 ease-out",
          sidebarWidth,
          // Mobile: slide off-screen when closed (and always full 240px wide
          // so content is readable when opened).
          mobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full",
          // Desktop: always visible; width is controlled by `collapsed`.
          "md:translate-x-0",
        )}
      >
        {/* Brand + collapse toggle */}
        <div className={cn("flex items-center shrink-0 pt-6 pb-4", collapsed ? "px-4 justify-center" : "px-6 justify-between")}>
          <Link href="/event-types" className="flex items-center gap-2 group" aria-label="Scheduler home">
            <div className="w-9 h-9 rounded-lg bg-primary-container flex items-center justify-center text-on-primary shadow-elev-1 shrink-0">
              <Icon name="event_note" filled className="text-xl" />
            </div>
            {!collapsed && (
              <span className="text-[22px] font-extrabold text-on-surface tracking-tight leading-none group-hover:text-primary-container transition-colors">
                Scheduler
              </span>
            )}
          </Link>
          {!collapsed && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="md:hidden text-outline hover:text-on-surface p-1"
              >
                <Icon name="close" />
              </button>
              <button
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                className="hidden md:inline-flex w-8 h-8 items-center justify-center rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition"
              >
                <Icon name="chevron_left" className="text-xl" />
              </button>
            </div>
          )}
        </div>

        {/* Collapsed-only expand button (replaces the hidden close/collapse row) */}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            aria-label="Expand sidebar"
            className="hidden md:flex mx-auto mb-2 w-8 h-8 items-center justify-center rounded-md text-outline hover:text-on-surface hover:bg-surface-container-low transition"
          >
            <Icon name="chevron_right" className="text-xl" />
          </button>
        )}

        {/* Create button — outlined pill, full width. Opens the event-types
            create modal via the ?new=1 URL param. */}
        <div className={cn("shrink-0 pb-3", collapsed ? "px-2" : "px-6")}>
          <Link
            href="/event-types?new=1"
            className={cn(
              "flex items-center justify-center gap-2 h-11 rounded-full font-semibold text-sm",
              "bg-white text-on-surface ghost-border hover:bg-surface-container-low transition-colors",
              collapsed && "px-0",
            )}
            aria-label="Create"
            title="Create"
          >
            <Icon name="add" className="text-xl" />
            {!collapsed && <span>Create</span>}
          </Link>
        </div>

        {/* Primary nav */}
        <nav className={cn("flex-1 overflow-y-auto pb-4 space-y-0.5", collapsed ? "px-2" : "px-3")}>
          {nav.map((n) => {
            const active = isActive(n.href);
            return (
              <NavLink
                key={n.href}
                href={n.href}
                icon={n.icon}
                label={n.label}
                active={active}
                collapsed={collapsed}
                comingSoon={n.comingSoon}
              />
            );
          })}
        </nav>

        {/* Footer: Upgrade plan + secondary nav + Help */}
        <div className={cn("shrink-0 pb-5 pt-3 border-t border-outline-variant/20 space-y-0.5", collapsed ? "px-2" : "px-3")}>
          {!collapsed && (
            <button
              type="button"
              onClick={showUpgradeToast}
              className="w-full text-left mx-1 mb-2 p-3 rounded-xl bg-gradient-to-br from-primary-fixed to-secondary-fixed relative overflow-hidden hover:shadow-elev-2 transition"
              aria-label="Upgrade plan — coming soon"
              title="Upgrade plan — coming soon"
            >
              <div
                className="absolute inset-0 opacity-50 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(0, 107, 255, 0.25) 1px, transparent 0)",
                  backgroundSize: "16px 16px",
                }}
                aria-hidden
              />
              <div className="relative flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-elev-1">
                  <Icon name="workspace_premium" filled className="text-lg text-on-primary-fixed-variant" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-on-primary-fixed leading-tight">Upgrade plan</p>
                    <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-white/70 text-on-primary-fixed-variant shrink-0">
                      Soon
                    </span>
                  </div>
                  <p className="text-[11px] text-on-primary-fixed-variant leading-tight mt-0.5">
                    Unlock analytics &amp; workflows
                  </p>
                </div>
              </div>
            </button>
          )}
          {collapsed && (
            <button
              type="button"
              onClick={showUpgradeToast}
              aria-label="Upgrade plan — coming soon"
              title="Upgrade plan — coming soon"
              className="mx-auto mb-2 w-10 h-10 rounded-lg bg-gradient-to-br from-primary-fixed to-secondary-fixed flex items-center justify-center shadow-elev-1 hover:shadow-elev-2 transition"
            >
              <Icon name="workspace_premium" filled className="text-lg text-on-primary-fixed-variant" />
            </button>
          )}

          {secondaryNav.map((n) => {
            const active = isActive(n.href);
            return (
              <NavLink
                key={n.href}
                href={n.href}
                icon={n.icon}
                label={n.label}
                active={active}
                collapsed={collapsed}
                comingSoon={n.comingSoon}
              />
            );
          })}

          {/* Help dropdown */}
          <div className="relative" ref={helpRef}>
            <button
              onClick={() => setHelpOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={helpOpen}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg transition-colors font-semibold text-sm",
                collapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 py-2.5",
                helpOpen
                  ? "text-on-surface bg-surface-container-low"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
              )}
              title="Help"
            >
              <Icon name="help" filled={helpOpen} className="text-xl shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Help</span>
                  <Icon
                    name={helpOpen ? "expand_less" : "expand_more"}
                    className="text-base text-outline"
                  />
                </>
              )}
            </button>
            {helpOpen && (
              <div
                role="menu"
                className={cn(
                  "absolute bottom-full mb-2 min-w-[200px] rounded-xl bg-white shadow-elev-3 ring-1 ring-outline-variant/50 py-2 z-50",
                  collapsed ? "left-full ml-2 bottom-0" : "left-0 right-0",
                )}
              >
                <HelpMenuItem icon="menu_book" label="Documentation" />
                <HelpMenuItem icon="chat" label="Contact support" />
                <HelpMenuItem icon="keyboard" label="Keyboard shortcuts" />
                <HelpMenuItem icon="campaign" label="What's new" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className={cn("min-h-screen transition-[margin] duration-200 ease-out", mainOffset)}>
        <header
          className={cn(
            "fixed top-0 left-0 right-0 h-16 bg-white/85 backdrop-blur-md z-30 border-b border-outline-variant/30 transition-[left] duration-200 ease-out",
            headerOffset,
          )}
        >
          <div className="flex justify-between items-center px-4 md:px-8 h-full max-w-[1200px] mx-auto w-full">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="md:hidden text-on-surface-variant hover:text-primary transition -ml-1 p-1"
              >
                <Icon name="menu" className="text-2xl" />
              </button>
              <div className="text-lg md:text-xl font-bold tracking-tight text-on-surface truncate">{title}</div>
            </div>
            <div className="flex items-center gap-3 md:gap-5">
              <div className="hidden sm:flex items-center gap-1 text-outline">
                <button aria-label="Notifications" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low hover:text-on-surface transition">
                  <Icon name="notifications" />
                </button>
                <button aria-label="Help" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-container-low hover:text-on-surface transition">
                  <Icon name="help" />
                </button>
              </div>
              <Link
                href="/account"
                aria-label="Account"
                className="flex items-center gap-3 rounded-full pl-2 pr-1 py-1 -mr-1 hover:bg-surface-container-low transition-colors group"
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

/**
 * One sidebar nav item. Active state = light-blue pill + Calendly blue text
 * + 3px left accent bar. Inactive = muted text, subtle hover. Items marked
 * `comingSoon` render a tiny Calendly-blue "Soon" pill next to the label
 * (hidden when the sidebar is collapsed to the 72px rail).
 */
function NavLink({
  href,
  icon,
  label,
  active,
  collapsed,
  comingSoon,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  comingSoon?: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? `${label}${comingSoon ? " — coming soon" : ""}` : undefined}
      className={cn(
        "group relative flex items-center rounded-lg transition-colors font-semibold text-sm",
        collapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 py-2.5 gap-3",
        active
          ? "bg-[#E6F0FF]"
          : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
      )}
      style={active ? { color: ACTIVE_BLUE } : undefined}
    >
      {active && !collapsed && (
        <span
          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
          style={{ backgroundColor: ACTIVE_BLUE }}
          aria-hidden
        />
      )}
      <Icon
        name={icon}
        filled={active}
        className="text-xl shrink-0"
        /* On inactive items, let the icon pick up hover color from the link. */
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {comingSoon && (
            <span
              className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-[#E6F0FF] shrink-0"
              style={{ color: ACTIVE_BLUE }}
            >
              Soon
            </span>
          )}
        </>
      )}
      {collapsed && comingSoon && (
        // On the 72px rail, a tiny dot in the top-right corner conveys the
        // same "not built yet" signal without reintroducing text.
        <span
          aria-hidden
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: ACTIVE_BLUE }}
        />
      )}
    </Link>
  );
}

function HelpMenuItem({ icon, label }: { icon: string; label: string }) {
  // Every Help destination is placeholder today — muted greys + "Soon" pill
  // makes the state obvious without hiding them. Click still fires a friendly
  // toast instead of navigating to a 404.
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => showComingSoonToast(label)}
      aria-disabled="true"
      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-outline cursor-not-allowed hover:bg-surface-container-low/50 transition-colors"
      title={`${label} — coming soon`}
    >
      <Icon name={icon} className="text-lg text-outline-variant" />
      <span className="flex-1 text-left">{label}</span>
      <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-surface-container-high text-outline shrink-0">
        Soon
      </span>
    </button>
  );
}
