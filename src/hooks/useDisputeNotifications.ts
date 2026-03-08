import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export type DisputeStatus = "pending" | "under_review" | "resolved_approved" | "resolved_rejected";

export interface DisputeNotification { id: string; disputeId: string; type: string; title: string; message: string; status: DisputeStatus; timestamp: string; read: boolean; }

export const useDisputeNotifications = () => {
  const [notifications, setNotifications] = useState<DisputeNotification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const markAsRead = useCallback((id: string) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); }, []);
  const markAllAsRead = useCallback(() => { setNotifications(prev => prev.map(n => ({ ...n, read: true }))); }, []);
  return { notifications, unreadCount, markAsRead, markAllAsRead };
};