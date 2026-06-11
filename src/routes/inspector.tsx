import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FISH_TYPES, LOCATIONS, useFishery, type FishType, type Location } from "@/lib/fishery-store";
import { MangystauMap } from "@/components/MangystauMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Scale, AlertTriangle, TrendingUp, Settings2, History, Power, Save, Wallet, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
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
const fmtKZT = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} KZT`;

function InspectorPage() {
  const {
    fishermen, logs, history,
    getConsumedRegion,
    regionQuotas, perFishermanQuotas,
    marketPrices,
    updateRegionQuotas, updatePerFishermanQuotas, updateMarketPrices,
    endDailyShift,
  } = useFishery();
  const consumed = getConsumedRegion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const todayTotal = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    return logs.filter((l) => l.timestamp >= start.getTime()).reduce((s, l) => s + l.weightKg, 0);
  }, [logs]);

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
        if (m[t] > perFishermanQuotas[t]) list.push({ fishermanId: f.id, fishermanName: f.name, fishType: t, amount: m[t], quota: perFishermanQuotas[t] });
      }
    }
    return list;
  }, [logs, fishermen, perFishermanQuotas]);

  const exceededFishermen = new Set(alerts.map((a) => a.fishermanId));

  const barData = FISH_TYPES.map((t) => ({
    name: t,
    Consumed: Math.round(consumed[t]),
    Quota: regionQuotas[t],
  }));

  const pieData = FISH_TYPES
    .map((t) => ({ name: t, value: Math.round(consumed[t]) }))
    .filter((d) => d.value > 0);

  const zoneTotals = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const init: Record<Location, number> = { Aktau: 0, Bautino: 0, Kuryk: 0 };
    for (const l of logs) {
      if (l.timestamp >= start.getTime() && l.location) init[l.location] += l.weightKg;
    }
    return init;
  }, [logs]);
  const zoneBarData = LOCATIONS.map((l) => ({ name: l, "Бүгінгі аулау (кг)": Math.round(zoneTotals[l]) }));
  const topZone = LOCATIONS.reduce<Location>((a, b) => (zoneTotals[b] > zoneTotals[a] ? b : a), LOCATIONS[0]);

  const onEndShift = () => {
    const count = endDailyShift();
    if (count === 0) {
      toast.info("Бүгінгі тіркелген аулау жоқ");
    } else {
      toast.success(`Күн аяқталды`, { description: `${count} жазба тарихқа көшірілді, квоталар жаңартылды` });
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Каспий өңірлік балық инспекциясы</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Маңғыстау аймақтық бақылау</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Mangystau Region · Caspian Sea</p>
        </div>
        <Button onClick={onEndShift} variant="destructive">
          <Power className="mr-1.5 h-4 w-4" /> Күнді аяқтау
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={<Users className="h-5 w-5" />} label="Балықшылар" value={String(fishermen.length)} accent="primary" />
        <KpiCard icon={<Scale className="h-5 w-5" />} label="Бүгінгі аулау" value={`${todayTotal.toFixed(0)} kg`} accent="accent" />
        <KpiCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Белсенді ескертулер"
          value={String(alerts.length)}
          accent={alerts.length > 0 ? "destructive" : "success"}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Квотаны тұтыну (балық түрі)</CardTitle>
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
          <CardHeader className="pb-2"><CardTitle className="text-base">Аулау құрамы</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Деректер жоқ</div>
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

      <Tabs defaultValue="monitor" className="mt-5">
        <TabsList>
          <TabsTrigger value="monitor">Тікелей бақылау</TabsTrigger>
          <TabsTrigger value="prices"><Wallet className="mr-1.5 h-3.5 w-3.5" /> Нарықтық бағалар</TabsTrigger>
          <TabsTrigger value="controls"><Settings2 className="mr-1.5 h-3.5 w-3.5" /> Квота басқару</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-1.5 h-3.5 w-3.5" /> Тарих ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Тікелей мониторинг</CardTitle>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-primary" /></span>
                Live
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Бүгін аулау тіркелмеген.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Балықшы</TableHead>
                      <TableHead>Балық</TableHead>
                      <TableHead className="text-right">Салмағы</TableHead>
                      <TableHead className="text-right">Құны</TableHead>
                      <TableHead>Уақыты</TableHead>
                      <TableHead className="text-right">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.slice(0, 20).map((l) => {
                      const exceeded = exceededFishermen.has(l.fishermanId);
                      return (
                        <TableRow key={l.id} className={exceeded ? "bg-destructive/5" : ""}>
                          <TableCell className="font-medium">{l.fishermanName}</TableCell>
                          <TableCell>{l.fishType}</TableCell>
                          <TableCell className="text-right tabular-nums">{l.weightKg}kg</TableCell>
                          <TableCell className="text-right tabular-nums text-primary font-semibold">{fmtKZT(l.weightKg * (marketPrices[l.fishType] ?? 0))}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{mounted ? format(l.timestamp, "MMM d, HH:mm") : ""}</TableCell>
                          <TableCell className="text-right">
                            {exceeded
                              ? <Badge variant="destructive">Квота асырылды!</Badge>
                              : <Badge className="bg-success/20 text-success border border-success/30 hover:bg-success/20">Рұқсат етілген</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <MarketPricesControl
            marketPrices={marketPrices}
            onSave={(p) => { updateMarketPrices(p); toast.success("Нарықтық бағалар жаңартылды"); }}
          />
        </TabsContent>



        <TabsContent value="controls">
          <QuotaControls
            regionQuotas={regionQuotas}
            perFishermanQuotas={perFishermanQuotas}
            onSave={(region, perF) => {
              updateRegionQuotas(region);
              updatePerFishermanQuotas(perF);
              toast.success("Квоталар жаңартылды");
            }}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-border/60 bg-card/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Тарих журналы</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Тарих бос. "Күнді аяқтау" батырмасын басу арқылы күнді жабыңыз.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Күні / уақыты</TableHead>
                      <TableHead>Балықшы</TableHead>
                      <TableHead>Балық түрі</TableHead>
                      <TableHead className="text-right">Салмағы (кг)</TableHead>
                      <TableHead className="text-right">Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.slice(0, 100).map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs text-muted-foreground">{mounted ? format(h.timestamp, "yyyy-MM-dd HH:mm") : ""}</TableCell>
                        <TableCell className="font-medium">{h.fishermanName}</TableCell>
                        <TableCell>{h.fishType}</TableCell>
                        <TableCell className="text-right tabular-nums">{h.weightKg}kg</TableCell>
                        <TableCell className="text-right">
                          {h.status === "Quota Exceeded"
                            ? <Badge variant="destructive">Квота асырылды</Badge>
                            : <Badge className="bg-success/20 text-success border border-success/30 hover:bg-success/20">Рұқсат етілген</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function MarketPricesControl({
  marketPrices, onSave,
}: {
  marketPrices: Record<FishType, number>;
  onSave: (p: Record<FishType, number>) => void;
}) {
  const [prices, setPrices] = useState(marketPrices);
  useEffect(() => { setPrices(marketPrices); }, [marketPrices]);

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Нарықтық бағалар (KZT / кг)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {FISH_TYPES.map((t) => (
            <div key={`price-${t}`} className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t}</Label>
              <Input
                type="number" min={0} step={100}
                value={prices[t]}
                onChange={(e) => setPrices({ ...prices, [t]: Number(e.target.value) || 0 })}
              />
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {fmtKZT(prices[t] ?? 0)} / кг
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(prices)}>
            <Save className="mr-1.5 h-4 w-4" /> Сақтау
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


function QuotaControls({
  regionQuotas, perFishermanQuotas, onSave,
}: {
  regionQuotas: Record<FishType, number>;
  perFishermanQuotas: Record<FishType, number>;
  onSave: (region: Record<FishType, number>, perF: Record<FishType, number>) => void;
}) {
  const [region, setRegion] = useState(regionQuotas);
  const [perF, setPerF] = useState(perFishermanQuotas);

  useEffect(() => { setRegion(regionQuotas); }, [regionQuotas]);
  useEffect(() => { setPerF(perFishermanQuotas); }, [perFishermanQuotas]);

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><Settings2 className="h-4 w-4 text-primary" /> Күндік квота шектері (кг)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {FISH_TYPES.map((t) => (
            <div key={`r-${t}`} className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t} · аймақ</Label>
              <Input
                type="number" min={0} step={50}
                value={region[t]}
                onChange={(e) => setRegion({ ...region, [t]: Number(e.target.value) || 0 })}
              />
            </div>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FISH_TYPES.map((t) => (
            <div key={`p-${t}`} className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t} · бір балықшы</Label>
              <Input
                type="number" min={0} step={10}
                value={perF[t]}
                onChange={(e) => setPerF({ ...perF, [t]: Number(e.target.value) || 0 })}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onSave(region, perF)}>
            <Save className="mr-1.5 h-4 w-4" /> Сақтау
          </Button>
        </div>
      </CardContent>
    </Card>
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
