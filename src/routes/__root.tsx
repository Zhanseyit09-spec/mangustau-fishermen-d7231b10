import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { FisheryProvider } from "@/lib/fishery-store";
import { Toaster } from "@/components/ui/sonner";
import { Fish, Anchor } from "lucide-react";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">Lost at sea.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Return to harbor</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Digital Fisherman — Mangystau Fishery Management" },
      { name: "description", content: "Quota tracking and catch monitoring for the Mangystau region." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: "var(--gradient-teal)", boxShadow: "var(--shadow-glow)" }}>
            <Anchor className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Digital Fisherman</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Mangystau Region</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/fisherman" className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-1.5 bg-secondary text-foreground" }}>
            <span className="inline-flex items-center gap-1.5"><Fish className="h-4 w-4" /> Fisherman</span>
          </Link>
          <Link to="/inspector" className="rounded-md px-3 py-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground" activeProps={{ className: "rounded-md px-3 py-1.5 bg-secondary text-foreground" }}>
            Inspector
          </Link>
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <FisheryProvider>
        <NavBar />
        <Outlet />
        <Toaster />
      </FisheryProvider>
    </QueryClientProvider>
  );
}
