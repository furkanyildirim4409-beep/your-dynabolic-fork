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
          return { ...ls, [id]: Math.min(sup.totalServings, (ls[id] ?? sup.servingsLeft) + 1) };
        });
      } else {
        next.add(id);
        setLocalServings((ls) => {
          const sup = supplements.find((s) => s.id === id);
          if (!sup) return ls;
          return { ...ls, [id]: Math.max(0, (ls[id] ?? sup.servingsLeft) - 1) };
        });
        const sup = supplements.find((s) => s.id === id);
        if (sup) toast({ title: "Alındı ✓", description: `${sup.name} işaretlendi.` });
      }
      return next;
    });
  }, [supplements]);

  const refillStock = useCallback((id: string) => {
    const sup = supplements.find((s) => s.id === id);
    if (sup) {
      setLocalServings((ls) => ({ ...ls, [id]: sup.totalServings }));
      toast({ title: "Stok Yenilendi 📦", description: `${sup.name} stoğu yenilendi.` });
    }
  }, [supplements]);

  return { supplements, isLoading: isLoading && !!user, toggleTaken, refillStock, useFallback };
}
