import { useState, useEffect, useCallback, useRef } from "react";
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
  shopify_product_id: string | null;
  shopify_variant_id: string | null;
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
    shopifyProductId: row.shopify_product_id ?? undefined,
    shopifyVariantId: row.shopify_variant_id ?? undefined,
  } as Supplement;
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
  const supplementsRef = useRef<Supplement[]>([]);

  // Hydrate takenIds from localStorage on mount
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(getTodayKey(user.id));
    if (stored) {
      try {
        setTakenIds(new Set(JSON.parse(stored)));
      } catch {
        // ignore corrupt data
      }
    }
  }, [user]);

  const { data: dbRows, isLoading, error } = useQuery({
    queryKey: ["assigned_supplements", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assigned_supplements")
        .select("id, name_and_dosage, dosage, timing, icon, servings_left, total_servings, is_active, shopify_product_id, shopify_variant_id")
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

  // Keep ref in sync for use in callbacks
  supplementsRef.current = supplements;

  const toggleTaken = useCallback((id: string) => {
    const sups = supplementsRef.current;
    const sup = sups.find((s) => s.id === id);
    if (!sup) return;

    setTakenIds((prev) => {
      const next = new Set(prev);
      const wasTaken = next.has(id);

      if (wasTaken) {
        next.delete(id);
      } else {
        next.add(id);
      }

      // Persist to localStorage
      if (user) {
        localStorage.setItem(getTodayKey(user.id), JSON.stringify([...next]));
      }

      return next;
    });

    // Update servings separately (not nested inside setTakenIds)
    const wasTaken = takenIds.has(id);
    if (wasTaken) {
      const newVal = Math.min(sup.totalServings, (localServings[id] ?? sup.servingsLeft) + 1);
      setLocalServings((ls) => ({ ...ls, [id]: newVal }));
      if (!useFallback) {
        supabase.from("assigned_supplements").update({ servings_left: newVal }).eq("id", id)
          .then(({ error }) => { if (error) console.error("Stock update failed:", error); });
      }
    } else {
      const newVal = Math.max(0, (localServings[id] ?? sup.servingsLeft) - 1);
      setLocalServings((ls) => ({ ...ls, [id]: newVal }));
      if (!useFallback) {
        supabase.from("assigned_supplements").update({ servings_left: newVal }).eq("id", id)
          .then(({ error }) => { if (error) console.error("Stock update failed:", error); });
      }
      toast({ title: "Alındı ✓", description: `${sup.name} işaretlendi.` });
    }
  }, [user, useFallback, takenIds, localServings]);

  const refillStock = useCallback((id: string) => {
    const sup = supplementsRef.current.find((s) => s.id === id);
    if (sup) {
      setLocalServings((ls) => ({ ...ls, [id]: sup.totalServings }));
      toast({ title: "Stok Yenilendi 📦", description: `${sup.name} stoğu yenilendi.` });
      if (!useFallback) {
        supabase.from("assigned_supplements").update({ servings_left: sup.totalServings }).eq("id", id)
          .then(({ error }) => { if (error) console.error("Stock refill failed:", error); });
      }
    }
  }, [useFallback]);

  return { supplements, isLoading: isLoading && !!user, toggleTaken, refillStock, useFallback };
}
