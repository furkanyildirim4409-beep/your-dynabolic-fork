import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface Ticket {
  id: string;
  user_id: string;
  coach_id: string;
  subject: string;
  priority: string;
  message: string;
  status: string;
  coach_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export function useTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ["tickets", user?.id],
    queryFn: async (): Promise<Ticket[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tickets" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Tickets fetch error:", error.message);
        return [];
      }
      return (data || []) as unknown as Ticket[];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async (params: { subject: string; priority: string; message: string }) => {
      if (!user) throw new Error("No user");
      const { error } = await supabase.from("tickets" as any).insert({
        user_id: user.id,
        subject: params.subject,
        priority: params.priority,
        message: params.message,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", user?.id] });
    },
  });

  return {
    tickets: ticketsQuery.data || [],
    isLoading: ticketsQuery.isLoading,
    createTicket,
  };
}
