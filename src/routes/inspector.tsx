import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { FISH_TYPES, PER_FISHERMAN_QUOTA, QUOTAS, useFishery, type FishType } from "@/lib/fishery-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Scale, AlertTriangle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/inspector")({
  head: () => ({
    meta: [
      { title: "Inspector Dashboard — Digital Fisherman" },
      { name: "description", content: "Live regional monitoring of catches and quota consumption." },
    ],
  }),
  component: InspectorPage,
});

const CHART_COLORS = ["oklch(0.78 0.14 195)", "oklch(0.65 0.18 220)", "oklch(0.72 0.16 160)"];

function InspectorPage() {
  const { fishermen, logs, getConsumedRegion } = useFishery();
  const consumed = getConsumedRegion();

  const todayTotal = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return logs.filter((l) => l.timestamp >= start.getTime()).reduce((s, l) => s + l.weightKg, 0);
  }, [logs]);

  // Per-fisherman per-type consumption for alerts
  const alerts = useMemo(() => {
    const map: Record<string, Record<FishType, number>> = {};
    for (const l of logs) {
      if (!map[l.fishermanId]) map[l.fishermanId] = { Sturgeon: 0, "Common Carp": 0, "Caspian Roach": 0 };
      map[l.fishermanId][l.fishType] += l.weightKg;
    }
    const list: { fishermanId: string; fishermanName: string; fishType: FishType; amount: number; quota: number }[] = [];
    for (const f of fishermen) {
      const m = map[f.id];
      if (!m) continue;
      for (const t of FISH_TYPES) {
        if (m[t] > PER_FISHERMAN_QUOTA[t]) list.push({ fishermanId: f.id, fishermanName: f.name, fishType: t, amount: m[t], quota: PER_FISHERMAN_QUOTA[t] });
      }
    }
    return list;
  }, [logs, fishermen]);

  const exceededFishermen = new Set(alerts.map((a) => a.fishermanId));

  const barData = FISH_TYPES.map((t) => ({
    name: t,
    Consumed: Math.round(consumed[t]),
    Quota: QUOTAS[t],
  }));

  const pieData = FISH_TYPES
    .map((t) => ({ name: t, value: Math.round(consumed[t]) }))
    .filter((d) => d.value > 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Inspector</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Regional Monitoring</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={<Users className="h-5 w-5" />} label="Registered Fishermen" value={String(fishermen.length)} accent="primary" />
        <KpiCard icon={<Scale className="h-5 w-5" />} label="Total Catch Today" value={`${todayTotal.toFixed(0)} kg`} accent="accent" />
        <KpiCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Active Alerts"
          value={String(alerts.length)}
          accent={alerts.length > 0 ? "destructive" : "success"}
        />
      </div>

      {/* Charts */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Quota Consumption by Species</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.32 0.05 240)" />
                <XAxis dataKey="name" stroke="oklch(0.72 0.03 220)" fontSize={12} />
                <YAxis stroke="oklch(0.72 0.03 220)" fontSize={12} />
                <Tooltip contentStyle={{ background: "oklch(0.23 0.05 240)", border: "1px solid oklch(0.32 0.05 240)", borderRadius: 8, color: "white" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Quota" fill="oklch(0.30 0.06 240)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Consumed" fill="oklch(0.78 0.14 195)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2"><CardTitle className="text-base">Catch Composition</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "oklch(0.23 0.05 240)", border: "1px solid oklch(0.32 0.05 240)", borderRadius: 8, color: "white" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Monitor */}
      <Card className="mt-5 border-border/60 bg-card/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Live Catch Monitor</CardTitle>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
            Live
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fisherman</TableHead>
                <TableHead>Fish</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.slice(0, 15).map((l) => {
                const exceeded = exceededFishermen.has(l.fishermanId);
                return (
                  <TableRow key={l.id} className={exceeded ? "bg-destructive/5" : ""}>
                    <TableCell className="font-medium">{l.fishermanName}</TableCell>
                    <TableCell>{l.fishType}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.weightKg}kg</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{format(l.timestamp, "MMM d, HH:mm")}</TableCell>
                    <TableCell className="text-right">
                      {exceeded
                        ? <Badge variant="destructive">Quota Exceeded!</Badge>
                        : <Badge className="bg-success/20 text-success border border-success/30 hover:bg-success/20">Authorized</Badge>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: "primary" | "accent" | "destructive" | "success" }) {
  const accentMap = {
    primary: "bg-primary/15 text-primary",
    accent: "bg-accent/20 text-accent",
    destructive: "bg-destructive/20 text-destructive",
    success: "bg-success/20 text-success",
  };
  return (
    <Card className="border-border/60 bg-card/60">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentMap[accent]}`}>{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
