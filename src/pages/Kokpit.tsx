import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, X, Trophy, MessageCircle, ChevronRight, ClipboardCheck, Heart, Footprints, Activity, TrendingUp, Zap, BarChart3, Calendar } from "lucide-react";
import PerformanceRing from "@/components/PerformanceRing";
import NextMissionCard from "@/components/NextMissionCard";
import QuickStatsRow, { StatType } from "@/components/QuickStatsRow";
import WeeklyActivityChart from "@/components/WeeklyActivityChart";
import StatDetailModal from "@/components/StatDetailModal";
import CoachChat from "@/components/CoachChat";
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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { assignedCoach, notifications, getLatestAdjustment, wearableMetrics, currentUser } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { useWeeklyRecap } from "@/hooks/useWeeklyRecap";
import { hapticLight } from "@/lib/haptics";

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

  const latestAdjustment = getLatestAdjustment("user-001", acknowledgedAdjustments);
  const { showRecap, recapData, dismissRecap } = useWeeklyRecap();

  useEffect(() => {
    const handleOpenCoachChat = () => setShowChat(true);
    window.addEventListener('openCoachChat', handleOpenCoachChat);
    return () => window.removeEventListener('openCoachChat', handleOpenCoachChat);
  }, []);

  const handleDismissAdjustment = (adjustmentId: string) => {
    const updated = [...acknowledgedAdjustments, adjustmentId];
    setAcknowledgedAdjustments(updated);
    localStorage.setItem("acknowledgedAdjustments", JSON.stringify(updated));
  };

  const handleNotificationClick = (notificationId: string, type: string) => {
    setReadNotifications(prev => ({ ...prev, [notificationId]: true }));
    hapticLight();
    if (type === "coach") setShowChat(true);
    if (type === "achievement") navigate("/achievements");
    setShowNotifications(false);
  };

  const handleMarkAllRead = () => {
    const allRead: Record<string, boolean> = {};
    notifications.forEach(n => { allRead[n.id] = true; });
    setReadNotifications(allRead);
  };

  const unreadCount = notifications.filter((n) => !n.read && !readNotifications[n.id]).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  // Steps progress
  const stepsGoal = 10000;
  const currentSteps = wearableMetrics.steps.value;
  const stepsProgress = Math.min((currentSteps / stepsGoal) * 100, 100);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mb-0.5">{getGreeting()}</p>
          <h1 className="font-display text-xl font-bold text-foreground">{profile?.full_name?.split(" ")[0] || "Sporcu"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <DisputeNotificationBell />
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowChat(true)} className="relative p-2.5 rounded-full bg-secondary/50 border border-border"><MessageCircle className="w-4 h-4 text-muted-foreground" /></motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowNotifications(true)} className="relative p-2.5 rounded-full bg-secondary/50 border border-border">
            <Bell className="w-4 h-4 text-muted-foreground" />
            {unreadCount > 0 && <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><span className="text-primary-foreground text-[9px] font-bold">{unreadCount}</span></div>}
          </motion.button>
          <motion.button onClick={() => navigate(`/coach/${assignedCoach.id}`)} whileTap={{ scale: 0.95 }} className="relative">
            <div className="p-0.5 rounded-full bg-gradient-to-tr from-primary/80 to-primary"><Avatar className="w-9 h-9"><AvatarImage src={assignedCoach.avatar} alt={assignedCoach.name} className="object-cover" /><AvatarFallback className="bg-secondary text-foreground text-xs">{assignedCoach.name.charAt(4)}</AvatarFallback></Avatar></div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
          </motion.button>
        </div>
      </motion.div>

      {/* Coach Adjustment Banner */}
      {latestAdjustment && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}><CoachAdjustmentBanner adjustment={latestAdjustment} onDismiss={handleDismissAdjustment} /></motion.div>}

      {/* Stories */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}><StoriesRing /></motion.div>

      {/* Performance Ring */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}><PerformanceRing score={85} label="HAZIRSIN" sublabel="Yüksek yoğunluklu antrenman için uygun" /></motion.div>

      {/* Streak */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}><StreakTierWidget /></motion.div>

      {/* Steps Progress Bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-emerald-400" />
            <span className="text-foreground text-sm font-display">Günlük Adım</span>
          </div>
          <span className="text-muted-foreground text-xs">{currentSteps.toLocaleString()} / {stepsGoal.toLocaleString()}</span>
        </div>
        <Progress value={stepsProgress} className="h-2.5" />
        <div className="flex items-center justify-between mt-2">
          <span className="text-muted-foreground text-[10px]">{Math.round(stepsProgress)}% tamamlandı</span>
          {stepsProgress >= 100 && <span className="text-primary text-[10px] font-display">🎉 Hedef tamamlandı!</span>}
        </div>
      </motion.div>

      {/* Next Mission */}
      <NextMissionCard title="GÖĞÜS & SIRT" duration="45 dk" calories="350 kcal" coach="Koç Serdar" />

      {/* Quick Stats */}
      <QuickStatsRow onStatClick={(stat) => setSelectedStat(stat)} />

      {/* Daily Check-In Button */}
      <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDailyCheckIn(true)} className="w-full backdrop-blur-xl bg-card border border-border rounded-xl p-4 flex items-center justify-center gap-3 group hover:border-primary/30 transition-all duration-300">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><ClipboardCheck className="w-5 h-5 text-primary" /></div>
        <div className="text-left flex-1"><p className="font-display text-sm text-foreground tracking-wide">GÜNLÜK VERİ GİR</p><p className="text-xs text-muted-foreground">Uyku, stres ve kas ağrısı verilerini kaydet</p></div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </motion.button>

      {/* Weekly Activity */}
      <WeeklyActivityChart />

      {/* Weekly Recap Test Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }} className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate("/leaderboard")} className="flex-1 h-10 border-border text-xs font-display gap-2">
          <BarChart3 className="w-4 h-4 text-primary" /> LİDERLİK TABLOSU
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/achievements")} className="flex-1 h-10 border-border text-xs font-display gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" /> BAŞARIMLAR
        </Button>
      </motion.div>

      {/* Coach Chat CTA */}
      <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} onClick={() => setShowChat(true)} className="w-full backdrop-blur-xl bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><MessageCircle className="w-4 h-4 text-primary" /></div>
        <div className="flex-1 min-w-0"><p className="text-foreground text-sm font-medium truncate">Koç Serdar</p><p className="text-muted-foreground text-xs truncate">Bugün bacak antrenmanında tempoyu düşürme...</p></div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </motion.button>

      {/* Health Data */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <div className="flex items-center gap-2 mb-3"><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /><h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Sağlık Verileri</h2></div>
        <BentoStats onStatClick={(stat) => setSelectedBentoStat(stat)} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setSelectedBiometric("rhr")} className="glass-card p-4 relative overflow-hidden text-left">
            <div className="flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-destructive" /><span className="text-xs text-muted-foreground">Dinlenme Nabzı</span></div>
            <div className="flex items-baseline gap-1"><span className="font-display text-2xl text-destructive">{wearableMetrics.rhr.value}</span><span className="text-xs text-muted-foreground">bpm</span></div>
          </motion.button>
          <motion.button whileTap={{ scale: 0.98 }} onClick={() => setSelectedBiometric("steps")} className="glass-card p-4 relative overflow-hidden text-left">
            <div className="flex items-center gap-2 mb-2"><Footprints className="w-4 h-4 text-emerald-400" /><span className="text-xs text-muted-foreground">Günlük Adım</span></div>
            <div className="flex items-baseline gap-1"><span className="font-display text-2xl text-emerald-400">{wearableMetrics.steps.value.toLocaleString()}</span></div>
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Health Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 text-center">
          <Activity className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="font-display text-lg text-foreground">{currentUser.readiness}%</p>
          <p className="text-muted-foreground text-[9px]">HAZIRLIK</p>
        </div>
        <div className="glass-card p-3 text-center">
          <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
          <p className="font-display text-lg text-foreground">{currentUser.streak}</p>
          <p className="text-muted-foreground text-[9px]">SERİ</p>
        </div>
        <div className="glass-card p-3 text-center">
          <Zap className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
          <p className="font-display text-lg text-foreground">{currentUser.bioCoins}</p>
          <p className="text-muted-foreground text-[9px]">COİN</p>
        </div>
      </motion.div>

      {/* Modals */}
      <CoachChat isOpen={showChat} onClose={() => setShowChat(false)} />
      <DailyCheckIn isOpen={showDailyCheckIn} onClose={() => setShowDailyCheckIn(false)} />
      <StatDetailModal isOpen={!!selectedStat} onClose={() => setSelectedStat(null)} statType={selectedStat} />
      <BentoStatDetailModal isOpen={!!selectedBentoStat} onClose={() => setSelectedBentoStat(null)} statType={selectedBentoStat} />
      <BiometricDetailModal isOpen={!!selectedBiometric} onClose={() => setSelectedBiometric(null)} biometricType={selectedBiometric} />
      <WeeklyRecapModal isOpen={showRecap} onClose={dismissRecap} data={recapData} />

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowNotifications(false)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-border">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-foreground">Bildirimler</h2>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-primary text-xs font-medium">Tümünü oku</button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="p-2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                </div>
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
                      onClick={() => handleNotificationClick(notification.id, notification.type)}
                      className={`w-full backdrop-blur-xl bg-card border border-border rounded-xl p-4 flex items-start gap-3 text-left transition-all ${!isRead ? "border-l-2 border-l-primary" : "opacity-70"}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === "coach" ? "bg-primary/20" : notification.type === "achievement" ? "bg-yellow-500/20" : "bg-secondary"}`}>
                        {notification.type === "coach" && <MessageCircle className="w-5 h-5 text-primary" />}
                        {notification.type === "achievement" && <Trophy className="w-5 h-5 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-medium">{notification.title}</p>
                        <p className="text-muted-foreground text-xs mt-1">{notification.message}</p>
                        <p className="text-muted-foreground text-[10px] mt-2">{notification.time}</p>
                      </div>
                      {!isRead && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
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
