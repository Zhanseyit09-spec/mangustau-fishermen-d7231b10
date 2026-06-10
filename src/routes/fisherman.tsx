import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FISH_TYPES, PER_FISHERMAN_QUOTA, useFishery, type FishType } from "@/lib/fishery-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Fish, Plus, Clock } from "lucide-react";
import { format } from "date-fns";

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
  const { currentFishermanId, setCurrentFishermanId, fishermen, logs, addLog, getConsumedByFisherman } = useFishery();
  const [fishType, setFishType] = useState<FishType>("Sturgeon");
  const [weight, setWeight] = useState("");

  const consumed = getConsumedByFisherman(currentFishermanId);
  const myLogs = useMemo(() => logs.filter((l) => l.fishermanId === currentFishermanId), [logs, currentFishermanId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0) {
      toast.error("Enter a valid weight in kg");
      return;
    }
    addLog({ fishermanId: currentFishermanId, fishType, weightKg: w });
    const newTotal = consumed[fishType] + w;
    const quota = PER_FISHERMAN_QUOTA[fishType];
    toast.success(`Logged ${w}kg of ${fishType}`, {
      description: newTotal > quota ? "⚠️ You have exceeded your quota!" : `${(quota - newTotal).toFixed(0)}kg remaining`,
    });
    setWeight("");
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Fisherman</p>
          <h1 className="text-2xl font-bold tracking-tight">Catch Log</h1>
        </div>
        <Select value={currentFishermanId} onValueChange={setCurrentFishermanId}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {fishermen.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quota cards */}
      <Card className="border-border/60 bg-card/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Remaining Quota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {FISH_TYPES.map((t) => {
            const used = consumed[t];
            const quota = PER_FISHERMAN_QUOTA[t];
            const pct = Math.min(100, (used / quota) * 100);
            const exceeded = used > quota;
            const remaining = Math.max(0, quota - used);
            return (
              <div key={t}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Fish className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t}</span>
                    {exceeded && <Badge variant="destructive" className="text-[10px]">Exceeded</Badge>}
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

      {/* Log form */}
      <Card className="mt-5 border-border/60 bg-card/60">
        <CardHeader className="pb-3"><CardTitle className="text-base">Log New Catch</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Fish Type</Label>
              <Select value={fishType} onValueChange={(v) => setFishType(v as FishType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FISH_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Weight (kg)</Label>
              <Input type="number" inputMode="decimal" step="0.1" min="0" placeholder="e.g. 12.5"
                value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date / Time</Label>
              <div className="flex items-center gap-2 rounded-md border border-input bg-input/50 px-3 py-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Auto-captured at submission
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg">
              <Plus className="mr-1.5 h-4 w-4" /> Submit Catch
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="mt-5 border-border/60 bg-card/60">
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent Logs</CardTitle></CardHeader>
        <CardContent>
          {myLogs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No catches logged yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fish</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLogs.slice(0, 10).map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.fishType}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.weightKg}kg</TableCell>
                    <TableCell className="text-right text-muted-foreground text-xs">{format(l.timestamp, "MMM d, HH:mm")}</TableCell>
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
