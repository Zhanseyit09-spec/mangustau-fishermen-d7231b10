import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type FishType = "Sturgeon" | "Common Carp" | "Caspian Roach";

export const FISH_TYPES: FishType[] = ["Sturgeon", "Common Carp", "Caspian Roach"];

export const QUOTAS: Record<FishType, number> = {
  Sturgeon: 1000,
  "Common Carp": 2500,
  "Caspian Roach": 1800,
};

export interface CatchLog {
  id: string;
  fishermanId: string;
  fishermanName: string;
  fishType: FishType;
  weightKg: number;
  timestamp: number;
}

export interface Fisherman {
  id: string;
  name: string;
  license: string;
}

export const FISHERMEN: Fisherman[] = [
  { id: "f1", name: "Aibek Nurlanov", license: "MNG-001" },
  { id: "f2", name: "Daulet Serikov", license: "MNG-002" },
  { id: "f3", name: "Yerlan Aitbayev", license: "MNG-003" },
  { id: "f4", name: "Ruslan Tasbolat", license: "MNG-004" },
  { id: "f5", name: "Marat Kenzhebek", license: "MNG-005" },
];

const now = Date.now();
const seedLogs: CatchLog[] = [
  { id: "l1", fishermanId: "f1", fishermanName: "Aibek Nurlanov", fishType: "Sturgeon", weightKg: 320, timestamp: now - 1000 * 60 * 60 * 20 },
  { id: "l2", fishermanId: "f2", fishermanName: "Daulet Serikov", fishType: "Common Carp", weightKg: 540, timestamp: now - 1000 * 60 * 60 * 8 },
  { id: "l3", fishermanId: "f3", fishermanName: "Yerlan Aitbayev", fishType: "Caspian Roach", weightKg: 410, timestamp: now - 1000 * 60 * 60 * 5 },
  { id: "l4", fishermanId: "f1", fishermanName: "Aibek Nurlanov", fishType: "Common Carp", weightKg: 180, timestamp: now - 1000 * 60 * 60 * 3 },
  { id: "l5", fishermanId: "f4", fishermanName: "Ruslan Tasbolat", fishType: "Sturgeon", weightKg: 95, timestamp: now - 1000 * 60 * 60 * 2 },
  { id: "l6", fishermanId: "f5", fishermanName: "Marat Kenzhebek", fishType: "Caspian Roach", weightKg: 260, timestamp: now - 1000 * 60 * 30 },
];

interface Ctx {
  logs: CatchLog[];
  addLog: (input: { fishermanId: string; fishType: FishType; weightKg: number }) => void;
  currentFishermanId: string;
  setCurrentFishermanId: (id: string) => void;
  fishermen: Fisherman[];
  getConsumedByFisherman: (fishermanId: string) => Record<FishType, number>;
  getConsumedRegion: () => Record<FishType, number>;
}

const FisheryContext = createContext<Ctx | null>(null);

export function FisheryProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<CatchLog[]>(seedLogs);
  const [currentFishermanId, setCurrentFishermanId] = useState<string>("f1");

  const value = useMemo<Ctx>(() => ({
    logs,
    fishermen: FISHERMEN,
    currentFishermanId,
    setCurrentFishermanId,
    addLog: ({ fishermanId, fishType, weightKg }) => {
      const f = FISHERMEN.find((x) => x.id === fishermanId)!;
      const entry: CatchLog = {
        id: `l${Date.now()}`,
        fishermanId,
        fishermanName: f.name,
        fishType,
        weightKg,
        timestamp: Date.now(),
      };
      setLogs((prev) => [entry, ...prev]);
    },
    getConsumedByFisherman: (fishermanId) => {
      const init: Record<FishType, number> = { Sturgeon: 0, "Common Carp": 0, "Caspian Roach": 0 };
      for (const l of logs) {
        if (l.fishermanId === fishermanId) init[l.fishType] += l.weightKg;
      }
      return init;
    },
    getConsumedRegion: () => {
      const init: Record<FishType, number> = { Sturgeon: 0, "Common Carp": 0, "Caspian Roach": 0 };
      for (const l of logs) init[l.fishType] += l.weightKg;
      return init;
    },
  }), [logs, currentFishermanId]);

  return <FisheryContext.Provider value={value}>{children}</FisheryContext.Provider>;
}

export function useFishery() {
  const ctx = useContext(FisheryContext);
  if (!ctx) throw new Error("useFishery must be used inside FisheryProvider");
  return ctx;
}

// Per-fisherman quotas (each fisherman has same allotment for demo)
export const PER_FISHERMAN_QUOTA: Record<FishType, number> = {
  Sturgeon: 500,
  "Common Carp": 800,
  "Caspian Roach": 600,
};
