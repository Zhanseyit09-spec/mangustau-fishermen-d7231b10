import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FISH_TYPES, useFishery, type FishType } from "@/lib/fishery-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Fish, Plus, Clock, LogOut, Wallet } from "lucide-react";
import { format } from "date-fns";

const fmtKZT = (n: number) => `${Math.round(n).toLocaleString("ru-RU")} KZT`;

export const Route = createFileRoute("/fisherman")({
  head: () => ({
    meta: [
      { title: "Fisherman Dashboard — Digital Fisherman" },
      { name: "description", content: "Log catches and track remaining quota in real time." },
    ],
  }),
  component: FishermanPage,
});

function FishermanPage() {
  const navigate = useNavigate();
  const {
    currentFishermanId,
    fishermen,
    logs,
    addLog,
    getConsumedByFisherman,
    perFishermanQuotas,
    marketPrices,
    setCurrentFishermanId,
  } = useFishery();
  const [fishType, setFishType] = useState<FishType>("Sturgeon");
  const [weight, setWeight] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const weightNum = parseFloat(weight) || 0;
  const estimatedValue = weightNum * (marketPrices[fishType] ?? 0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("digital-fisherman:user")) {
      navigate({ to: "/register" });
    }
  }, [navigate]);

  const activeId = currentFishermanId ?? "";
  const me = fishermen.find((f) => f.id === activeId);
  const consumed = getConsumedByFisherman(activeId);
  const myLogs = useMemo(() => logs.filter((l) => l.fishermanId === activeId), [logs, activeId]);

  const signOut = () => {
    localStorage.removeItem("digital-fisherman:user");
    navigate({ to: "/register" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      toast.error("Дұрыс салмақ енгізіңіз (кг)");
      return;
    }
    addLog({ fishermanId: activeId, fishType, weightKg: w });
    const newTotal = consumed[fishType] + w;
    const quota = perFishermanQuotas[fishType];
    toast.success(`${w}kg ${fishType} тіркелді`, {
      description: newTotal > quota ? "⚠️ Квота асырылды!" : `${(quota - newTotal).toFixed(0)}kg қалды`,
    });
    setWeight("");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Балықшы</p>
          <h1 className="truncate text-2xl font-bold tracking-tight">{me?.name ?? "Catch Log"}</h1>
          {me && <p className="text-xs text-muted-foreground">Лицензия: {me.license}</p>}
        </div>
        <div className="flex items-center gap-2">
          {fishermen.length > 1 && (
            <Select value={activeId} onValueChange={setCurrentFishermanId}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {fishermen.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="ghost" size="icon" onClick={signOut} title="Шығу"><LogOut className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3"><CardTitle className="text-base">Қалған квота</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {FISH_TYPES.map((t) => {
            const used = consumed[t];
            const quota = perFishermanQuotas[t];
            const pct = Math.min(100, (used / quota) * 100);
            const exceeded = used > quota;
            const remaining = Math.max(0, quota - used);
            return (
              <div key={t}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Fish className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t}</span>
                    {exceeded && <Badge variant="destructive" className="text-[10px]">Асырылды</Badge>}
                  </div>
                  <span className="tabular-nums text-muted-foreground">
                    <span className={exceeded ? "text-destructive font-semibold" : "text-foreground font-semibold"}>{remaining}kg</span> / {quota}kg
                  </span>
                </div>
                <Progress value={pct} className={exceeded ? "[&>div]:bg-destructive" : ""} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-5 border-border/60 bg-card/60">
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Нарықтық бағалар</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {FISH_TYPES.map((t) => (
              <div key={t} className="rounded-md border border-border/60 bg-background/40 px-2.5 py-2 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{t}</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-primary">{(marketPrices[t] ?? 0).toLocaleString("ru-RU")}</p>
                <p className="text-[10px] text-muted-foreground">KZT/кг</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-5 border-border/60 bg-card/60">
        <CardHeader className="pb-3"><CardTitle className="text-base">Жаңа аулау тіркеу</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Балық түрі</Label>
              <Select value={fishType} onValueChange={(v) => setFishType(v as FishType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FISH_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Салмағы (кг)</Label>
              <Input type="number" inputMode="decimal" step="0.1" min="0" placeholder="мысалы 12.5"
                value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5 text-primary" /> Болжамды құны
                </span>
                <span className="text-lg font-bold tabular-nums text-primary">{fmtKZT(estimatedValue)}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {weightNum || 0} кг × {fmtKZT(marketPrices[fishType] ?? 0)}/кг
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Күні / уақыты</Label>
              <div className="flex items-center gap-2 rounded-md border border-input bg-input/50 px-3 py-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Автоматты түрде сақталады
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={!activeId}>
              <Plus className="mr-1.5 h-4 w-4" /> Тіркеу
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-5 border-border/60 bg-card/60">
        <CardHeader className="pb-3"><CardTitle className="text-base">Соңғы аулаулар</CardTitle></CardHeader>
        <CardContent>
          {myLogs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Әзірге аулау тіркелмеген.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Балық</TableHead>
                  <TableHead className="text-right">Салмағы</TableHead>
                  <TableHead className="text-right">Уақыты</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLogs.slice(0, 10).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.fishType}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.weightKg}kg</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs" suppressHydrationWarning>{mounted ? format(l.timestamp, "MMM d, HH:mm") : ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
