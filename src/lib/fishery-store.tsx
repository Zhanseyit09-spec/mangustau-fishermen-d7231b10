import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type FishType = "Sturgeon" | "Common Carp" | "Caspian Roach";

export const FISH_TYPES: FishType[] = ["Sturgeon", "Common Carp", "Caspian Roach"];

export const DEFAULT_REGION_QUOTAS: Record<FishType, number> = {
  Sturgeon: 1000,
  "Common Carp": 2500,
  "Caspian Roach": 1800,
};

// Per-fisherman daily allotment defaults
export const DEFAULT_PER_FISHERMAN_QUOTA: Record<FishType, number> = {
  Sturgeon: 500,
  "Common Carp": 800,
  "Caspian Roach": 600,
};

// Default market prices in KZT per kg
export const DEFAULT_MARKET_PRICES: Record<FishType, number> = {
  Sturgeon: 8000,
  "Common Carp": 2000,
  "Caspian Roach": 1200,
};

export interface CatchLog {
  id: string;
  fishermanId: string;
  fishermanName: string;
  fishType: FishType;
  weightKg: number;
  timestamp: number;
}

export interface HistoryEntry extends CatchLog {
  status: "Authorized" | "Quota Exceeded";
  archivedAt: number;
  shiftDate: string; // YYYY-MM-DD
}

export interface Fisherman {
  id: string;
  name: string;
  license: string;
}

const SEED_FISHERMEN: Fisherman[] = [
  { id: "f1", name: "Aibek Nurlanov", license: "MNG-001" },
  { id: "f2", name: "Daulet Serikov", license: "MNG-002" },
  { id: "f3", name: "Yerlan Aitbayev", license: "MNG-003" },
];

const STORAGE_KEY = "digital-fisherman:state:v2";

interface PersistState {
  fishermen: Fisherman[];
  logs: CatchLog[];
  history: HistoryEntry[];
  regionQuotas: Record<FishType, number>;
  perFishermanQuotas: Record<FishType, number>;
  marketPrices: Record<FishType, number>;
  currentFishermanId: string | null;
}

const defaultState = (): PersistState => ({
  fishermen: SEED_FISHERMEN,
  logs: [],
  history: [],
  regionQuotas: { ...DEFAULT_REGION_QUOTAS },
  perFishermanQuotas: { ...DEFAULT_PER_FISHERMAN_QUOTA },
  marketPrices: { ...DEFAULT_MARKET_PRICES },
  currentFishermanId: null,
});

interface Ctx extends PersistState {
  addLog: (input: { fishermanId: string; fishType: FishType; weightKg: number }) => void;
  setCurrentFishermanId: (id: string) => void;
  registerFisherman: (f: Fisherman) => void;
  getConsumedByFisherman: (fishermanId: string) => Record<FishType, number>;
  getConsumedRegion: () => Record<FishType, number>;
  updateRegionQuotas: (q: Record<FishType, number>) => void;
  updatePerFishermanQuotas: (q: Record<FishType, number>) => void;
  updateMarketPrices: (p: Record<FishType, number>) => void;
  endDailyShift: () => number;
}

const FisheryContext = createContext<Ctx | null>(null);

export function FisheryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          fishermen: parsed.fishermen?.length ? parsed.fishermen : prev.fishermen,
          regionQuotas: { ...prev.regionQuotas, ...(parsed.regionQuotas ?? {}) },
          perFishermanQuotas: { ...prev.perFishermanQuotas, ...(parsed.perFishermanQuotas ?? {}) },
          marketPrices: { ...prev.marketPrices, ...(parsed.marketPrices ?? {}) },
        }));
      }
      // Sync current fisherman id from session user
      const userRaw = localStorage.getItem("digital-fisherman:user");
      if (userRaw) {
        try {
          const u = JSON.parse(userRaw) as { id: string; name: string };
          setState((prev) => {
            const exists = prev.fishermen.some((f) => f.id === u.id);
            const fishermen = exists
              ? prev.fishermen
              : [...prev.fishermen, { id: u.id, name: u.name, license: `MNG-${u.id.slice(0, 4).toUpperCase()}` }];
            return { ...prev, fishermen, currentFishermanId: u.id };
          });
        } catch {/* ignore */}
      }
    } catch {/* ignore */}
    setHydrated(true);
  }, []);

  // Persist on changes (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {/* ignore */}
  }, [state, hydrated]);

  const value = useMemo<Ctx>(() => ({
    ...state,
    setCurrentFishermanId: (id) => setState((s) => ({ ...s, currentFishermanId: id })),
    registerFisherman: (f) =>
      setState((s) => {
        const exists = s.fishermen.some((x) => x.id === f.id);
        return {
          ...s,
          fishermen: exists ? s.fishermen : [...s.fishermen, f],
          currentFishermanId: f.id,
        };
      }),
    addLog: ({ fishermanId, fishType, weightKg }) => {
      setState((s) => {
        const f = s.fishermen.find((x) => x.id === fishermanId);
        if (!f) return s;
        const entry: CatchLog = {
          id: `l${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fishermanId,
          fishermanName: f.name,
          fishType,
          weightKg,
          timestamp: Date.now(),
        };
        return { ...s, logs: [entry, ...s.logs] };
      });
    },
    getConsumedByFisherman: (fishermanId) => {
      const init: Record<FishType, number> = { Sturgeon: 0, "Common Carp": 0, "Caspian Roach": 0 };
      for (const l of state.logs) {
        if (l.fishermanId === fishermanId) init[l.fishType] += l.weightKg;
      }
      return init;
    },
    getConsumedRegion: () => {
      const init: Record<FishType, number> = { Sturgeon: 0, "Common Carp": 0, "Caspian Roach": 0 };
      for (const l of state.logs) init[l.fishType] += l.weightKg;
      return init;
    },
    updateRegionQuotas: (q) => setState((s) => ({ ...s, regionQuotas: { ...s.regionQuotas, ...q } })),
    updatePerFishermanQuotas: (q) =>
      setState((s) => ({ ...s, perFishermanQuotas: { ...s.perFishermanQuotas, ...q } })),
    endDailyShift: () => {
      let count = 0;
      setState((s) => {
        if (s.logs.length === 0) return s;
        // Determine status per log based on per-fisherman cumulative limits
        const perCum: Record<string, Record<FishType, number>> = {};
        // process ascending in time so cumulative makes sense
        const ascending = [...s.logs].sort((a, b) => a.timestamp - b.timestamp);
        const archived: HistoryEntry[] = ascending.map((l) => {
          if (!perCum[l.fishermanId]) perCum[l.fishermanId] = { Sturgeon: 0, "Common Carp": 0, "Caspian Roach": 0 };
          perCum[l.fishermanId][l.fishType] += l.weightKg;
          const status: HistoryEntry["status"] =
            perCum[l.fishermanId][l.fishType] > s.perFishermanQuotas[l.fishType] ? "Quota Exceeded" : "Authorized";
          const d = new Date(l.timestamp);
          const shiftDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return { ...l, status, archivedAt: Date.now(), shiftDate };
        });
        count = archived.length;
        return {
          ...s,
          logs: [],
          history: [...archived.reverse(), ...s.history],
          regionQuotas: { ...DEFAULT_REGION_QUOTAS },
          perFishermanQuotas: { ...DEFAULT_PER_FISHERMAN_QUOTA },
        };
      });
      return count;
    },
  }), [state]);

  return <FisheryContext.Provider value={value}>{children}</FisheryContext.Provider>;
}

export function useFishery() {
  const ctx = useContext(FisheryContext);
  if (!ctx) throw new Error("useFishery must be used inside FisheryProvider");
  return ctx;
}
