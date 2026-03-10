import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  Trophy,
  Settings,
  MessageCircle,
  ChevronRight,
  ClipboardCheck,
  Heart,
  Footprints,
  Calendar,
} from "lucide-react";
import PerformanceRing from "@/components/PerformanceRing";
import NextMissionCard from "@/components/NextMissionCard";
import QuickStatsRow, { StatType } from "@/components/QuickStatsRow";
import WeeklyActivityChart from "@/components/WeeklyActivityChart";
import StatDetailModal from "@/components/StatDetailModal";
import ChatInterface from "@/components/chat/ChatInterface";
import StoriesRing from "@/components/StoriesRing";
import BentoStats, { BentoStatType } from "@/components/BentoStats";
import BentoStatDetailModal from "@/components/BentoStatDetailModal";
import BiometricDetailModal, { BiometricType } from "@/components/BiometricDetailModal";
import DailyCheckIn from "@/components/DailyCheckIn";
import CoachAdjustmentBanner from "@/components/dashboard/CoachAdjustmentBanner";
import StreakTierWidget from "@/components/StreakTierWidget";
import WeeklyRecapModal from "@/components/WeeklyRecapModal";
import DisputeNotificationBell from "@/components/DisputeNotificationBell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { assignedCoach, notifications, getLatestAdjustment, wearableMetrics } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { usePaymentReminders } from "@/hooks/usePaymentReminders";
import { useWeeklyRecap } from "@/hooks/useWeeklyRecap";
import { useScrollDirection } from "@/hooks/useScrollDirection";

const Kokpit = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Record<string, boolean>>({});
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null);
  const [selectedBentoStat, setSelectedBentoStat] = useState<BentoStatType | null>(null);
  const [selectedBiometric, setSelectedBiometric] = useState<BiometricType | null>(null);
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false);
  const [acknowledgedAdjustments, setAcknowledgedAdjustments] = useState<string[]>(() => {
    const stored = localStorage.getItem("acknowledgedAdjustments");
    return stored ? JSON.parse(stored) : [];
  });

  // Get the latest unacknowledged coach adjustment
  const latestAdjustment = getLatestAdjustment("user-001", acknowledgedAdjustments);

  // Payment reminders hook - triggers toast notifications on mount
  const { reminders } = usePaymentReminders();

  // Weekly recap hook
  const { showRecap, recapData, triggerRecap, dismissRecap } = useWeeklyRecap();

  // Scroll direction hook for hiding/showing weekly recap button
  const { scrollDirection, isAtTop } = useScrollDirection({ threshold: 20 });

  // Listen for coach chat open event from EliteDock
  useEffect(() => {
    const handleOpenCoachChat = () => {
      setShowChat(true);
    };
    window.addEventListener('openCoachChat', handleOpenCoachChat);
    return () => window.removeEventListener('openCoachChat', handleOpenCoachChat);
  }, []);

  const handleDismissAdjustment = (adjustmentId: string) => {
    const updated = [...acknowledgedAdjustments, adjustmentId];
    setAcknowledgedAdjustments(updated);
    localStorage.setItem("acknowledgedAdjustments", JSON.stringify(updated));
  };

  const unreadCount = notifications.filter((n) => !n.read && !readNotifications[n.id]).length;

  const handleNotificationClick = (notificationId: string, coachId?: string) => {
    setReadNotifications((prev) => ({ ...prev, [notificationId]: true }));
    if (coachId) {
      setShowNotifications(false);
      navigate(`/coach/${coachId}`);
    }
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Minimalist Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-0.5">{getGreeting()}</p>
          <h1 className="font-display text-xl font-bold text-foreground">{profile?.full_name?.split(" ")[0] || "Sporcu"}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Dispute Notifications Bell */}
          <DisputeNotificationBell />

          {/* Chat Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowChat(true)}
            className="relative p-2.5 rounded-full bg-white/[0.03] border border-white/[0.05]"
          >
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
          </motion.button>

          {/* Notifications Bell */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(true)}
            className="relative p-2.5 rounded-full bg-white/[0.03] border border-white/[0.05]"
          >
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[9px] font-bold">{unreadCount}</span>
              </div>
            )}
          </motion.button>

          {/* Coach Avatar */}
          <motion.button
            onClick={() => navigate(`/coach/${assignedCoach.id}`)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary/80 to-primary">
              <Avatar className="w-9 h-9">
                <AvatarImage src={assignedCoach.avatar} alt={assignedCoach.name} className="object-cover" />
                <AvatarFallback className="bg-secondary text-foreground text-xs font-medium">
                  {assignedCoach.name.charAt(4)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
          </motion.button>
        </div>
      </motion.div>

      {/* Coach Adjustment Banner - Urgent Alert */}
      {latestAdjustment && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <CoachAdjustmentBanner adjustment={latestAdjustment} onDismiss={handleDismissAdjustment} />
        </motion.div>
      )}

      {/* Stories Ring - Smaller & Elegant */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <StoriesRing />
      </motion.div>

      {/* Performance Ring - The Hero Stat */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <PerformanceRing score={85} label="HAZIRSIN" sublabel="Yüksek yoğunluklu antrenman için uygun" />
      </motion.div>

      {/* Streak & Tier Widget */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <StreakTierWidget />
      </motion.div>

      {/* Next Mission Card */}
      <NextMissionCard title="GÖĞÜS & SIRT" duration="45 dk" calories="350 kcal" coach="Koç Serdar" />

      {/* Quick Stats Row */}
      <QuickStatsRow onStatClick={(stat) => setSelectedStat(stat)} />

      {/* Daily Check-In Trigger Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowDailyCheckIn(true)}
        className="w-full backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex items-center justify-center gap-3 group hover:border-primary/30 transition-all duration-300"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-purple-500/30 transition-all">
          <ClipboardCheck className="w-5 h-5 text-primary" />
        </div>
        <div className="text-left flex-1">
          <p className="font-display text-sm text-foreground tracking-wide">GÜNLÜK VERİ GİR</p>
          <p className="text-xs text-muted-foreground">Uyku, stres ve kas ağrısı verilerini kaydet</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </motion.button>

      {/* Weekly Activity Chart */}
      <WeeklyActivityChart />

      {/* Coach Message Teaser */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        onClick={() => setShowChat(true)}
        className="w-full backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex items-center gap-3 text-left"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm font-medium truncate">Koç Serdar</p>
          <p className="text-muted-foreground text-xs truncate">Bugün bacak antrenmanında tempoyu düşürme...</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </motion.button>

      {/* Bento Stats Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Sağlık Verileri</h2>
        </div>
        <BentoStats onStatClick={(stat) => setSelectedBentoStat(stat)} />

        {/* Additional Biometric Stats - RHR & Steps */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* RHR Card */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedBiometric("rhr")}
            className="glass-card-premium p-4 relative overflow-hidden text-left"
          >
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-red-500 opacity-10 blur-2xl rounded-full" />
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span className="text-xs text-muted-foreground">Dinlenme Nabzı</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl text-red-400">{wearableMetrics.rhr.value}</span>
              <span className="text-xs text-muted-foreground">bpm</span>
            </div>
            <div className={`flex items-center gap-1 mt-1 text-xs ${
              wearableMetrics.rhr.change < 0 ? "text-green-400" : "text-red-400"
            }`}>
              <span>{wearableMetrics.rhr.change < 0 ? "↓" : "↑"}{Math.abs(wearableMetrics.rhr.change)}</span>
              <span className="text-muted-foreground">dün</span>
            </div>
          </motion.button>

          {/* Steps Card */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedBiometric("steps")}
            className="glass-card-premium p-4 relative overflow-hidden text-left"
          >
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-green-500 opacity-10 blur-2xl rounded-full" />
            <div className="flex items-center gap-2 mb-2">
              <Footprints className="w-4 h-4 text-green-400" />
              <span className="text-xs text-muted-foreground">Günlük Adım</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl text-green-400">{wearableMetrics.steps.value.toLocaleString()}</span>
            </div>
            <div className="mt-2">
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((wearableMetrics.steps.value / wearableMetrics.steps.goal) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-green-400 rounded-full"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {Math.round((wearableMetrics.steps.value / wearableMetrics.steps.goal) * 100)}% hedef
              </p>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Coach Chat */}
      <ChatInterface isOpen={showChat} onClose={() => setShowChat(false)} />

      {/* Daily Check-In Modal */}
      <DailyCheckIn isOpen={showDailyCheckIn} onClose={() => setShowDailyCheckIn(false)} />

      {/* Stat Detail Modal */}
      <StatDetailModal isOpen={!!selectedStat} onClose={() => setSelectedStat(null)} statType={selectedStat} />

      {/* Bento Stat Detail Modal */}
      <BentoStatDetailModal isOpen={!!selectedBentoStat} onClose={() => setSelectedBentoStat(null)} statType={selectedBentoStat} />

      {/* Biometric Detail Modal (RHR & Steps) */}
      <BiometricDetailModal isOpen={!!selectedBiometric} onClose={() => setSelectedBiometric(null)} biometricType={selectedBiometric} />

      {/* Weekly Recap Modal */}
      <WeeklyRecapModal isOpen={showRecap} onClose={dismissRecap} data={recapData} />

      {/* Weekly Recap Test Button (Dev Only) - Hides on scroll down */}
      <AnimatePresence>
        {(isAtTop || scrollDirection === "up") && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            onClick={triggerRecap}
            className="fixed bottom-44 left-4 z-40 p-3 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-colors"
            title="Haftalık Özeti Test Et"
          >
            <Calendar className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowNotifications(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-white/10"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-foreground">Bildirimler</h2>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Notifications List */}
              <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-80px)]">
                {notifications.map((notification, index) => {
                  const isRead = notification.read || readNotifications[notification.id];

                  return (
                    <motion.button
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(String(notification.id), notification.coachId)}
                      className={`w-full text-left backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex items-start gap-3 hover:bg-white/[0.04] transition-colors ${
                        !isRead ? "border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notification.type === "coach"
                            ? "bg-primary/20"
                            : notification.type === "achievement"
                              ? "bg-yellow-500/20"
                              : "bg-secondary"
                        }`}
                      >
                        {notification.type === "coach" && <MessageCircle className="w-5 h-5 text-primary" />}
                        {notification.type === "achievement" && <Trophy className="w-5 h-5 text-yellow-500" />}
                        {notification.type === "system" && <Settings className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium text-sm ${isRead ? "text-muted-foreground" : "text-foreground"}`}>
                            {notification.title}
                          </p>
                          {!isRead && <div className="w-2 h-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-muted-foreground/50 text-[10px] mt-2">{notification.time}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Kokpit;
