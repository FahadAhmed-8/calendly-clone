"use client";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

/**
 * Placeholder page for routes that are wired into the sidebar but aren't
 * implemented yet (Contacts, Workflows, Integrations & apps, Routing,
 * Analytics, Admin center). Keeps the theme consistent with the rest of
 * the site so clicking a nav link never lands on a dead page.
 */
export function ComingSoonPage({
  title,
  icon,
  tagline,
  features,
}: {
  title: string;
  icon: string;
  tagline: string;
  features: { icon: string; title: string; description: string }[];
}) {
  return (
    <AdminShell title={title}>
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-container to-secondary px-6 py-16 md:px-12 md:py-20 mb-8 shadow-elev-3">
          {/* Decorative dots */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
            aria-hidden
          />
          {/* Floating gradient orbs */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary-fixed-dim/30 blur-3xl pointer-events-none" aria-hidden />
          <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none" aria-hidden />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-on-primary text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-on-primary animate-pulse" />
              Coming Soon
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Icon name={icon} className="text-3xl text-on-primary" />
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-on-primary tracking-tight">
                {title}
              </h1>
            </div>
            <p className="text-on-primary/90 text-base md:text-lg max-w-2xl leading-relaxed">
              {tagline}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link href="/event-types">
                <Button variant="subtle" className="bg-white text-primary hover:bg-white/90">
                  <Icon name="arrow_back" /> Back to Event Types
                </Button>
              </Link>
              <div className="inline-flex items-center gap-2 text-on-primary/80 text-sm font-medium">
                <Icon name="schedule" className="text-base" />
                We're building this now
              </div>
            </div>
          </div>
        </div>

        {/* Feature preview grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="relative bg-surface-container-lowest rounded-xl p-6 shadow-elev-1 hover:shadow-elev-2 transition-all duration-300 group overflow-hidden"
            >
              {/* Blur-lock overlay — indicates the feature is locked */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                <Icon name="lock" className="text-base" />
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant mb-4">
                <Icon name={f.icon} />
              </div>
              <h3 className="font-bold text-on-surface mb-1">{f.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* Notify / return strip */}
        <div className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-elev-1 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0">
              <Icon name="rocket_launch" />
            </div>
            <div>
              <h3 className="font-bold text-on-surface mb-1">This module is on the roadmap</h3>
              <p className="text-sm text-on-surface-variant">
                It isn't part of the current scheduling MVP, but the foundation is in place.
              </p>
            </div>
          </div>
          <Link href="/event-types" className="shrink-0">
            <Button variant="ghost">
              Go to Event Types <Icon name="arrow_forward" />
            </Button>
          </Link>
        </div>
      </div>
    </AdminShell>
  );
}
