import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, TrendingUp, Crown, Sparkles, Calendar, ChevronRight, Dumbbell } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";
import confetti from "canvas-confetti";
import { usePRTracker, getExerciseEmoji, type PREntry } from "@/hooks/usePRTracker";
import { Skeleton } from "@/components/ui/skeleton";

interface PersonalRecordsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PersonalRecords = ({ isOpen, onClose }: PersonalRecordsProps) => {
  const [selectedLift, setSelectedLift] = useState<PREntry | null>(null);
  const { prList, big3Total, isLoading } = usePRTracker();

  const handleLiftClick = (lift: PREntry) => {
    hapticMedium();
    setSelectedLift(lift);
    if (lift.isRecent) {
      hapticSuccess();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#BFFF00", "#FFD700", "#FFFFFF"],
      });
    }
  };

  const handleClose = () => {
    hapticLight();
    if (selectedLift) {
      setSelectedLift(null);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm flex items-end justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) handleClose();
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] bg-background border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-hidden touch-none"
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-lg text-foreground tracking-wide">
                    {selectedLift ? selectedLift.name : "PR SALONU"}
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    {selectedLift ? "Gelişim Grafiği" : "Kişisel Rekorlarınız"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Loading State */}
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-36 rounded-xl" />
                    ))}
                  </div>
                </div>
              ) : prList.length === 0 ? (
                /* Empty State */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                    <Dumbbell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-medium text-lg mb-2">
                    Henüz bir kişisel rekorun yok
                  </p>
                  <p className="text-muted-foreground text-sm max-w-[260px]">
                    Antrenman yapmaya devam et! İlk PR'ın burada görünecek. 💪
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  {!selectedLift ? (
                    <motion.div
                      key="main"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="space-y-6"
                    >
                      {/* Big 3 Total */}
                      {big3Total > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-card p-5 text-center relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-yellow-500/10" />
                          <div className="relative">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <Crown className="w-5 h-5 text-yellow-500" />
                              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                                Big 3 Toplam (1RM)
                              </span>
                              <Crown className="w-5 h-5 text-yellow-500" />
                            </div>
                            <p className="font-display text-5xl text-foreground tabular-nums">
                              {big3Total}
                              <span className="text-2xl text-muted-foreground ml-1">kg</span>
                            </p>
                            <p className="text-primary text-xs mt-2">Squat + Bench + Deadlift</p>
                          </div>
                        </motion.div>
                      )}

                      {/* Individual PRs */}
                      <div className="grid grid-cols-2 gap-3">
                        {prList.map((pr, index) => (
                          <motion.button
                            key={pr.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleLiftClick(pr)}
                            className={`glass-card p-4 text-left relative overflow-hidden group ${
                              pr.isRecent ? "ring-2 ring-yellow-500/50" : ""
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-2xl">{getExerciseEmoji(pr.name)}</span>
                              {pr.isRecent && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                                >
                                  <Sparkles className="w-2 h-2" /> YENİ
                                </motion.div>
                              )}
                            </div>

                            <p className="text-muted-foreground text-xs mt-2 uppercase tracking-wider line-clamp-1">
                              {pr.name}
                            </p>

                            <p className="font-display text-3xl text-foreground mt-1 tabular-nums">
                              {pr.estimated1RM}
                              <span className="text-lg text-muted-foreground ml-1">kg</span>
                            </p>

                            <div className="flex items-center gap-1 text-muted-foreground text-[10px] mt-2">
                              <Calendar className="w-3 h-3" />
                              <span>{pr.dateFormatted}</span>
                            </div>

                            <ChevronRight className="absolute bottom-4 right-3 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

                            {pr.isRecent && (
                              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent pointer-events-none" />
                            )}
                          </motion.button>
                        ))}
                      </div>

                      <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                        <TrendingUp className="w-4 h-4" />
                        <span>Geçmişi görmek için bir harekete dokun</span>
                      </div>
                    </motion.div>
                  ) : (
                    <PRDetailView lift={selectedLift} />
                  )}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ---------- Detail Sub-component ---------- */

const PRDetailView = ({ lift }: { lift: PREntry }) => {
  const realPR = lift.maxWeight;
  const gain = lift.estimated1RM - realPR;
  const pct = realPR > 0 ? Math.round((gain / realPR) * 100) : 0;

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="space-y-6"
    >
      {/* Current PR Card */}
      <div
        className={`glass-card p-6 text-center relative overflow-hidden ${
          lift.isRecent ? "ring-2 ring-yellow-500/50" : ""
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          {lift.isRecent && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 mb-3"
            >
              <Sparkles className="w-3 h-3" /> YENİ POTANSİYEL
            </motion.div>
          )}
          <span className="text-4xl">{getExerciseEmoji(lift.name)}</span>
        </div>
        <p className="font-display text-6xl text-foreground mt-4 tabular-nums">
          {lift.estimated1RM}
          <span className="text-2xl text-muted-foreground ml-1">kg</span>
        </p>
        <p className="text-primary text-sm mt-2">Tahmini 1RM (Epley)</p>
        <p className="text-muted-foreground text-xs mt-1">
          Gerçek: {lift.maxWeight}kg × {lift.repsAtMax} tekrar
        </p>

        {lift.isRecent && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
        )}
      </div>

      {/* Progress Chart */}
      {lift.history.length > 1 && (
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">Aylık Gelişim</span>
          </div>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lift.history}>
                <defs>
                  <linearGradient id="prGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  domain={["dataMin - 10", "dataMax + 10"]}
                  tickFormatter={(v) => `${v}kg`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value} kg`, "Max Ağırlık"]}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#prGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-muted-foreground text-[10px] uppercase">PR</p>
          <p className="font-display text-lg text-foreground tabular-nums">{realPR}kg</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-muted-foreground text-[10px] uppercase">POTANSİYEL</p>
          <p className="font-display text-lg text-primary tabular-nums">+{gain}kg</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-muted-foreground text-[10px] uppercase">FARK</p>
          <p className="font-display text-lg text-emerald-500 tabular-nums">+{pct}%</p>
        </div>
      </div>
    </motion.div>
  );
};

export default PersonalRecords;
