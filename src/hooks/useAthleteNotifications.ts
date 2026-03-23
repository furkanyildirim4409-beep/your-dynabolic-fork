import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface AthleteNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  coach_id: string | null;
  metadata: Record<string, any> | null;
}

export function useAthleteNotifications() {
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["athlete-notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("athlete_notifications")
        .select("id, type, title, message, is_read, created_at, coach_id, metadata")
        .eq("athlete_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data ?? []) as AthleteNotification[];
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const queryClient = useQueryClient();

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("athlete_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-notifications", user?.id] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("athlete_notifications")
        .update({ is_read: true })
        .eq("athlete_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["athlete-notifications", user?.id] });
    },
  });

  return { notifications, isLoading, unreadCount, markAsRead, markAllAsRead };
}
