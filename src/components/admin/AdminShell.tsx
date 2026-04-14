"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const nav = [
  { href: "/event-types", label: "Event Types", icon: "event_note" },
  { href: "/meetings", label: "Meetings", icon: "schedule" },
  { href: "/availability", label: "Availability", icon: "calendar_today" },
];

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  return (
    <>
      <aside className="fixed left-0 top-0 h-full w-[240px] bg-surface-container-low flex flex-col z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary">
              <Icon name="event_note" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-on-surface leading-tight">Scheduler</h1>
              <p className="text-[10px] uppercase tracking-wider text-outline font-bold">Admin Console</p>
            </div>
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
      <div className="ml-[240px] min-h-screen">
        <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-16 bg-surface-container-lowest/80 backdrop-blur-md z-40">
          <div className="flex justify-between items-center px-8 h-full max-w-[1200px] mx-auto w-full">
            <div className="text-xl font-bold tracking-tight text-on-surface">{title}</div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-outline">
                <button className="hover:text-primary transition-all"><Icon name="notifications" /></button>
                <button className="hover:text-primary transition-all"><Icon name="help" /></button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-on-surface-variant">Fhd</span>
                <div className="w-8 h-8 rounded-full bg-primary-fixed-dim flex items-center justify-center text-primary font-bold text-sm">F</div>
              </div>
            </div>
          </div>
        </header>
        <main className="pt-24 px-8 pb-16 max-w-[1200px] mx-auto">{children}</main>
      </div>
    </>
  );
}
