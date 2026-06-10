import { createFileRoute, Link } from "@tanstack/react-router";
import { Fish, Shield, ArrowRight, Waves } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Digital Fisherman — Mangystau" },
      { name: "description", content: "Choose your role: log catches as a fisherman or monitor quotas as an inspector." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Waves className="h-3.5 w-3.5 text-primary" />
          Caspian Sea · Mangystau Region
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Digital Fisherman
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          A unified quota tracking and catch-monitoring platform for sustainable fishing across the Caspian shoreline.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2">
        <Link
          to="/fisherman"
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-7 transition hover:border-primary/60"
        >
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60" style={{ background: "var(--gradient-teal)" }} />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Fish className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">Fisherman</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Log new catches, track your remaining quota per species, and review your recent activity.
            </p>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              Open fisherman app <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>

        <Link
          to="/inspector"
          className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-7 transition hover:border-accent/60"
        >
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-2xl transition group-hover:opacity-60" style={{ background: "linear-gradient(135deg, var(--accent), var(--primary))" }} />
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">Inspector</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor regional quota consumption, analyze trends, and respond to live quota-exceedance alerts.
            </p>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              Open inspector dashboard <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
