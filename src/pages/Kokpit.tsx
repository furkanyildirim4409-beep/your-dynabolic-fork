import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell,
  X,
  Trophy,
  Settings,
  MessageCircle,
  ChevronRight,
  ClipboardCheck,
  Calendar,
  Moon,
  CheckCircle2,
  Utensils,
} from "lucide-react";
import { format } from "date-fns";
import PerformanceRing from "@/components/PerformanceRing";
import NextMissionCard from "@/components/NextMissionCard";
import QuickStatsRow, { StatType } from "@/components/QuickStatsRow";

import StatDetailModal from "@/components/StatDetailModal";
import ChatInterface from "@/components/chat/ChatInterface";
import StoriesRing from "@/components/StoriesRing";

import DailyCheckIn from "@/components/DailyCheckIn";
import CoachAdjustmentBanner from "@/components/dashboard/CoachAdjustmentBanner";
import StreakTierWidget from "@/components/StreakTierWidget";
import WeeklyRecapModal from "@/components/WeeklyRecapModal";
import DisputeNotificationBell from "@/components/DisputeNotificationBell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { assignedCoach } from "@/lib/mockData";
import { useAthleteNotifications } from "@/hooks/useAthleteNotifications";
import { useActiveAdjustment, useAcknowledgeAdjustment } from "@/hooks/useAthleteAdjustments";
import { useAuth } from "@/context/AuthContext";
import { usePaymentReminders } from "@/hooks/usePaymentReminders";
import { useWeeklyRecap } from "@/hooks/useWeeklyRecap";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useAssignedWorkouts } from "@/hooks/useAssignedWorkouts";
import { useDietPlan } from "@/hooks/useDietPlan";
import { useConsumedFoods } from "@/hooks/useConsumedFoods";
import { useWaterTracking } from "@/hooks/useWaterTracking";

// Map Turkish day names to JS getDay() (0=Sun)
const DOW_MAP: Record<string, number> = {
  pazar: 0,
  pazartesi: 1,
  "salı": 2,
  "çarşamba": 3,
  "perşembe": 4,
  cuma: 5,
  cumartesi: 6,
};

const Kokpit = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Record<string, boolean>>({});
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null);
  
  
  const [showDailyCheckIn, setShowDailyCheckIn] = useState(false);
  // === REAL COACH ADJUSTMENT DATA ===
  const { data: activeAdjustment } = useActiveAdjustment();
  const acknowledgeAdjustment = useAcknowledgeAdjustment();

  // === REAL DATA HOOKS ===
  const { data: workouts, isLoading: workoutsLoading } = useAssignedWorkouts();
  const { dynamicTargets, hasTemplate, isLoading: dietLoading } = useDietPlan();
  const { totals: consumedTotals, isLoading: foodsLoading } = useConsumedFoods();
  const { totalMl: waterMl } = useWaterTracking();

  // === STRICT TODAY'S WORKOUT (Ghost Workout Prevention) ===
  const todaysWorkoutState = useMemo(() => {
    if (!workouts || workouts.length === 0) return { workout: null, completed: false };

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayDOW = new Date().getDay();
    const hasAnyScheduledDates = workouts.some((w) => w.scheduledDate);

    let todaysWorkout = null;
    if (hasAnyScheduledDates) {
      // STRICT MODE: only match exact scheduled_date
      todaysWorkout = workouts.find((w) => w.scheduledDate === todayStr) ?? null;
    } else {
      // LEGACY DOW MODE: only if entire program is legacy
      todaysWorkout = workouts.find(
        (w) => w.dayOfWeek && DOW_MAP[w.dayOfWeek.toLowerCase()] === todayDOW
      ) ?? null;
    }

    if (todaysWorkout?.completedToday) {
      return { workout: todaysWorkout, completed: true };
    }
    return { workout: todaysWorkout, completed: false };
  }, [workouts]);


  // Payment reminders hook
  const { reminders } = usePaymentReminders();
  const { unreadCount: unreadMsgCount, markAllRead: markMsgsRead } = useUnreadMessages();
  const { showRecap, recapData, triggerRecap, dismissRecap } = useWeeklyRecap();
  const { scrollDirection, isAtTop } = useScrollDirection({ threshold: 20 });

  // Auto-open chat from deep link
  useEffect(() => {
    if (searchParams.get('openChat') === 'true') {
      setSearchParams({}, { replace: true });
      const t = setTimeout(() => setShowChat(true), 150);
      return () => clearTimeout(t);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('openChat') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      const t = setTimeout(() => setShowChat(true), 150);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const handleOpenCoachChat = () => setShowChat(true);
    window.addEventListener('openCoachChat', handleOpenCoachChat);
    return () => window.removeEventListener('openCoachChat', handleOpenCoachChat);
  }, []);


  const unreadCount = notifications.filter((n) => !n.read && !readNotifications[n.id]).length;

  const handleNotificationClick = (notificationId: string, coachId?: string) => {
    setReadNotifications((prev) => ({ ...prev, [notificationId]: true }));
    if (coachId) {
      setShowNotifications(false);
      navigate(`/coach/${coachId}`);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  // Calories for QuickStatsRow
  const caloriesDisplay = consumedTotals.calories > 0
    ? consumedTotals.calories.toLocaleString("tr-TR")
    : "--";
  const waterDisplay = waterMl > 0 ? (waterMl / 1000).toFixed(1) : "--";

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
          <DisputeNotificationBell />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowChat(true); markMsgsRead(); }}
            className="relative p-2.5 rounded-full bg-white/[0.03] border border-white/[0.05]"
          >
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            {unreadMsgCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[9px] font-bold">{unreadMsgCount}</span>
              </div>
            )}
          </motion.button>

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

      {/* Coach Adjustment Banner */}
      {activeAdjustment && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <CoachAdjustmentBanner adjustment={activeAdjustment} onDismiss={() => acknowledgeAdjustment.mutate(activeAdjustment.id)} />
        </motion.div>
      )}

      {/* Stories Ring */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <StoriesRing />
      </motion.div>

      {/* Performance Ring */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <PerformanceRing />
      </motion.div>

      {/* Streak & Tier Widget */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <StreakTierWidget />
      </motion.div>

      {/* ========== TODAY'S WORKOUT (REAL DATA) ========== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        {workoutsLoading ? (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : todaysWorkoutState.completed && todaysWorkoutState.workout ? (
          /* COMPLETED STATE */
          <div className="rounded-2xl bg-white/[0.02] border border-green-500/20 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-green-400 uppercase tracking-widest font-medium mb-0.5">Tamamlandı ✓</p>
              <p className="text-foreground font-display text-base font-bold">{todaysWorkoutState.workout.title}</p>
              <p className="text-muted-foreground text-xs mt-0.5">{todaysWorkoutState.workout.exercises} egzersiz · {todaysWorkoutState.workout.duration}</p>
            </div>
          </div>
        ) : todaysWorkoutState.workout ? (
          /* ACTIVE STATE — Real NextMissionCard */
          <NextMissionCard
            title={todaysWorkoutState.workout.title}
            duration={todaysWorkoutState.workout.duration}
            calories={`${todaysWorkoutState.workout.exercises} egzersiz`}
          />
        ) : (
          /* REST DAY STATE */
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Moon className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-0.5">Dinlenme Günü</p>
              <p className="text-muted-foreground text-sm">Bugün planlanmış antrenmanın yok. Dinlenmene bak!</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* ========== TODAY'S NUTRITION (REAL DATA) ========== */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        {dietLoading || foodsLoading ? (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-56" />
          </div>
        ) : hasTemplate && dynamicTargets ? (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Utensils className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Bugünkü Beslenme</span>
            </div>
            {/* Calorie Progress */}
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="font-display text-lg font-bold text-foreground">
                  {Math.round(consumedTotals.calories)}
                  <span className="text-muted-foreground text-xs font-normal ml-1">/ {Math.round(dynamicTargets.calories)} kcal</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {dynamicTargets.calories > 0 ? Math.min(Math.round((consumedTotals.calories / dynamicTargets.calories) * 100), 100) : 0}%
                </span>
              </div>
              <Progress
                value={dynamicTargets.calories > 0 ? Math.min((consumedTotals.calories / dynamicTargets.calories) * 100, 100) : 0}
                className="h-2 bg-secondary"
              />
            </div>
            {/* Macro Indicators */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { label: "Protein", consumed: consumedTotals.protein, target: dynamicTargets.protein, color: "text-blue-400" },
                { label: "Karb", consumed: consumedTotals.carbs, target: dynamicTargets.carbs, color: "text-amber-400" },
                { label: "Yağ", consumed: consumedTotals.fat, target: dynamicTargets.fat, color: "text-pink-400" },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className={`text-sm font-bold ${m.color}`}>{Math.round(m.consumed)}<span className="text-muted-foreground text-[10px] font-normal">/{Math.round(m.target)}g</span></p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Utensils className="w-6 h-6 text-orange-400/60" />
            </div>
            <div>
              <p className="text-xs text-orange-400/60 uppercase tracking-widest font-medium mb-0.5">Beslenme</p>
              <p className="text-muted-foreground text-sm">Şu an aktif bir beslenme hedefin yok.</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Quick Stats Row — Real Data */}
      <QuickStatsRow
        onStatClick={(stat) => setSelectedStat(stat)}
        caloriesValue={caloriesDisplay}
        waterValue={waterDisplay}
      />

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



      {/* Modals */}
      <ChatInterface isOpen={showChat} onClose={() => setShowChat(false)} />
      <DailyCheckIn isOpen={showDailyCheckIn} onClose={() => setShowDailyCheckIn(false)} />
      <StatDetailModal isOpen={!!selectedStat} onClose={() => setSelectedStat(null)} statType={selectedStat} />
      
      
      <WeeklyRecapModal isOpen={showRecap} onClose={dismissRecap} data={recapData} />

      {/* Weekly Recap Test Button */}
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
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-foreground">Bildirimler</h2>
                <button onClick={() => setShowNotifications(false)} className="p-2 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
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
                      className={`w-full text-left backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex items-start gap-3 hover:bg-white/[0.04] transition-colors ${!isRead ? "border-l-2 border-l-primary" : ""}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === "coach" ? "bg-primary/20" : notification.type === "achievement" ? "bg-yellow-500/20" : "bg-secondary"}`}>
                        {notification.type === "coach" && <MessageCircle className="w-5 h-5 text-primary" />}
                        {notification.type === "achievement" && <Trophy className="w-5 h-5 text-yellow-500" />}
                        {notification.type === "system" && <Settings className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium text-sm ${isRead ? "text-muted-foreground" : "text-foreground"}`}>{notification.title}</p>
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
