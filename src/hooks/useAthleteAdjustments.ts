import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { CoachAdjustment } from "@/types/shared-models";

export function useActiveAdjustment() {
  const { user } = useAuth();

  return useQuery<CoachAdjustment | null>({
    queryKey: ["active-adjustment", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mutation_logs")
        .select("id, module_type, change_percentage, message, metadata, created_at, athlete_id")
        .eq("athlete_id", user!.id)
        .eq("is_acknowledged", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Failed to fetch active adjustment:", error.message);
        return null;
      }
      if (!data) return null;

      const meta = (data.metadata as Record<string, any>) || {};

      const prevVal = meta.previous_value ?? meta.previousValue;
      const newVal = meta.new_value ?? meta.value;
      const isPercentageOnly = prevVal === undefined && newVal === undefined;

      return {
        id: data.id,
        athleteId: data.athlete_id,
        type: data.module_type,
        value: newVal ?? 0,
        previousValue: prevVal ?? 0,
        message: data.message,
        appliedAt: data.created_at,
        isPercentageOnly,
        percentageChange: isPercentageOnly ? data.change_percentage : null,
      };
    },
  });
}

export function useAcknowledgeAdjustment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (adjustmentId: string) => {
      const { data, error } = await supabase
        .from("mutation_logs")
        .update({ is_acknowledged: true } as any)
        .eq("id", adjustmentId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["active-adjustment", user?.id] });
      queryClient.setQueryData(["active-adjustment", user?.id], null);
    },
    onError: (err: any) => {
      toast({
        title: "Hata",
        description: "İşlem kaydedilemedi: " + (err?.message || "Bilinmeyen hata"),
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["active-adjustment", user?.id] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["active-adjustment", user?.id] });
    },
  });
}
