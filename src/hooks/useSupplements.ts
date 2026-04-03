import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { Supplement } from "@/components/SupplementTracker";
import { assignedSupplements as mockSupplements } from "@/lib/mockData";

interface DBSupplement {
  id: string;
  name_and_dosage: string;
  dosage: string | null;
  timing: string;
  icon: string;
  servings_left: number;
  total_servings: number;
  is_active: boolean;
}

function getTodayKey(userId: string) {
  return `supplements_taken_${userId}_${new Date().toISOString().split("T")[0]}`;
}

function parseName(nameAndDosage: string, dosage: string | null): { name: string; parsedDosage: string } {
  if (dosage) return { name: nameAndDosage, parsedDosage: dosage };
  const parts = nameAndDosage.split(",").map((s) => s.trim());
  if (parts.length >= 2) return { name: parts[0], parsedDosage: parts.slice(1).join(", ") };
  return { name: nameAndDosage, parsedDosage: "" };
}

function mapToSupplement(row: DBSupplement, takenSet: Set<string>): Supplement {
  const { name, parsedDosage } = parseName(row.name_and_dosage, row.dosage);
  return {
    id: row.id,
    name,
    dosage: parsedDosage,
    timing: row.timing,
    servingsLeft: row.servings_left,
    totalServings: row.total_servings,
    takenToday: takenSet.has(row.id),
    icon: row.icon,
  };
}

const fallbackSupplements: Supplement[] = mockSupplements.map((s) => ({
  id: s.id,
  name: s.name,
  dosage: s.dosage,
  timing: s.timing,
  servingsLeft: s.servingsLeft,
  totalServings: s.totalServings,
  takenToday: s.takenToday,
  icon: s.icon,
}));

export function useSupplements() {
  const { user } = useAuth();
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());
  const [localServings, setLocalServings] = useState<Record<string, number>>({});

  // Hydrate takenIds from localStorage on mount
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(getTodayKey(user.id));
    if (stored) {
      try {
        setTakenIds(new Set(JSON.parse(stored)));
      } catch { /* ignore corrupt data */ }
    }
  }, [user]);

  const { data: dbRows, isLoading, error } = useQuery({
    queryKey: ["assigned_supplements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assigned_supplements")
        .select("id, name_and_dosage, dosage, timing, icon, servings_left, total_servings, is_active")
        .eq("athlete_id", user!.id)
        .eq("is_active", true);
      if (error) throw error;
      return data as DBSupplement[];
    },
    enabled: !!user,
  });

  const useFallback = !user || !!error || (!isLoading && (!dbRows || dbRows.length === 0));

  const supplements: Supplement[] = useFallback
    ? fallbackSupplements.map((s) => ({
        ...s,
        takenToday: takenIds.has(s.id),
        servingsLeft: localServings[s.id] ?? s.servingsLeft,
      }))
    : (dbRows ?? []).map((row) => ({
        ...mapToSupplement(row, takenIds),
        servingsLeft: localServings[row.id] ?? row.servings_left,
      }));

  const toggleTaken = useCallback((id: string) => {
    setTakenIds((prev) => {
      const next = new Set(prev);
      const wasTaken = next.has(id);
      if (wasTaken) {
        next.delete(id);
        setLocalServings((ls) => {
          const sup = supplements.find((s) => s.id === id);
          if (!sup) return ls;
          const newVal = Math.min(sup.totalServings, (ls[id] ?? sup.servingsLeft) + 1);
          // Persist to DB
          if (!useFallback) {
            supabase.from("assigned_supplements").update({ servings_left: newVal }).eq("id", id)
              .then(({ error }) => { if (error) console.error("Stock update failed:", error); });
          }
          return { ...ls, [id]: newVal };
        });
      } else {
        next.add(id);
        setLocalServings((ls) => {
          const sup = supplements.find((s) => s.id === id);
          if (!sup) return ls;
          const newVal = Math.max(0, (ls[id] ?? sup.servingsLeft) - 1);
          // Persist to DB
          if (!useFallback) {
            supabase.from("assigned_supplements").update({ servings_left: newVal }).eq("id", id)
              .then(({ error }) => { if (error) console.error("Stock update failed:", error); });
          }
          return { ...ls, [id]: newVal };
        });
        const sup = supplements.find((s) => s.id === id);
        if (sup) toast({ title: "Alındı ✓", description: `${sup.name} işaretlendi.` });
      }

      // Persist taken set to localStorage
      if (user) {
        localStorage.setItem(getTodayKey(user.id), JSON.stringify([...next]));
      }

      return next;
    });
  }, [supplements, useFallback, user]);

  const refillStock = useCallback((id: string) => {
    const sup = supplements.find((s) => s.id === id);
    if (sup) {
      setLocalServings((ls) => ({ ...ls, [id]: sup.totalServings }));
      toast({ title: "Stok Yenilendi 📦", description: `${sup.name} stoğu yenilendi.` });
      // Persist to DB
      if (!useFallback) {
        supabase.from("assigned_supplements").update({ servings_left: sup.totalServings }).eq("id", id)
          .then(({ error }) => { if (error) console.error("Stock refill failed:", error); });
      }
    }
  }, [supplements, useFallback]);

  return { supplements, isLoading: isLoading && !!user, toggleTaken, refillStock, useFallback };
}
