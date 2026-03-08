import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, X, CheckCircle, Clock, AlertCircle, MessageCircle, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { hapticLight } from "@/lib/haptics";
import { useDisputeNotifications, DisputeNotification } from "@/hooks/useDisputeNotifications";

interface DisputeNotificationBellProps {
  onViewDispute?: (disputeId: string) => void;
}

const DisputeNotificationBell = ({ onViewDispute }: DisputeNotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useDisputeNotifications();

  const getStatusIcon = (status: DisputeNotification["status"]) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-yellow-400" />;
      case "under_review": return <Scale className="w-4 h-4 text-blue-400" />;
      case "resolved_approved": return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "resolved_rejected": return <X className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: DisputeNotification["status"]) => {
    switch (status) {
      case "pending": return "border-l-yellow-500";
      case "under_review": return "border-l-blue-500";
      case "resolved_approved": return "border-l-emerald-500";
      case "resolved_rejected": return "border-l-red-500";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return "Az önce";
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  };

  const handleNotificationClick = (notification: DisputeNotification) => {
    hapticLight();
    markAsRead(notification.id);
    onViewDispute?.(notification.disputeId);
    setIsOpen(false);
  };

  if (notifications.length === 0) return null;

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { hapticLight(); setIsOpen(true); }}
        className="relative p-2.5 rounded-full bg-amber-500/10 border border-amber-500/30"
      >
        <Scale className="w-4 h-4 text-amber-400" />
        {unreadCount > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">{unreadCount}</span>
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  <h2 className="font-display text-lg font-bold text-foreground">İtiraz Bildirimleri</h2>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={() => { hapticLight(); markAllAsRead(); }} className="text-primary text-xs hover:underline">Tümünü okundu işaretle</button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100vh-80px)]">
                <div className="p-4 space-y-3">
                  {notifications.map((notification, index) => (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left glass-card p-3 border-l-2 ${getStatusColor(notification.status)} hover:bg-white/5 transition-colors ${!notification.read ? "bg-amber-500/5" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          notification.status === "resolved_approved" ? "bg-emerald-500/20" :
                          notification.status === "resolved_rejected" ? "bg-red-500/20" :
                          notification.status === "under_review" ? "bg-blue-500/20" : "bg-yellow-500/20"
                        }`}>
                          {notification.type === "new_message" ? <MessageCircle className="w-4 h-4 text-primary" /> : getStatusIcon(notification.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>{notification.title}</p>
                            {!notification.read && <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />}
                          </div>
                          <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{notification.message}</p>
                          <p className="text-muted-foreground/50 text-[10px] mt-1">{formatTime(notification.timestamp)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </motion.button>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-8">
                      <Scale className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">Henüz bildirim yok</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DisputeNotificationBell;
