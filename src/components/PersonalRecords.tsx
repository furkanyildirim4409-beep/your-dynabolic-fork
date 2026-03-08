import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, TrendingUp, Crown, Sparkles, Calendar, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";
import confetti from "canvas-confetti";

interface PersonalRecordsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock PR data with history
const personalRecords = [
  {
    id: "squat",
    name: "Squat",
    emoji: "🏋️",
    current1RM: 140,
    unit: "kg",
    lastUpdated: "2026-01-28",
    isNewPR: true,
    history: [
      { date: "Ağu", weight: 100 },
      { date: "Eyl", weight: 110 },
      { date: "Eki", weight: 115 },
      { date: "Kas", weight: 125 },
      { date: "Ara", weight: 130 },
      { date: "Oca", weight: 140 },
    ],
  },
  {
    id: "bench",
    name: "Bench Press",
    emoji: "💪",
    current1RM: 105,
    unit: "kg",
    lastUpdated: "2026-01-20",
    isNewPR: false,
    history: [
      { date: "Ağu", weight: 75 },
      { date: "Eyl", weight: 80 },
      { date: "Eki", weight: 85 },
      { date: "Kas", weight: 95 },
      { date: "Ara", weight: 100 },
      { date: "Oca", weight: 105 },
    ],
  },
  {
    id: "deadlift",
    name: "Deadlift",
    emoji: "🔥",
    current1RM: 180,
    unit: "kg",
    lastUpdated: "2026-01-25",
    isNewPR: true,
    history: [
      { date: "Ağu", weight: 140 },
      { date: "Eyl", weight: 150 },
      { date: "Eki", weight: 160 },
      { date: "Kas", weight: 165 },
      { date: "Ara", weight: 170 },
      { date: "Oca", weight: 180 },
    ],
  },
  {
    id: "ohp",
    name: "Overhead Press",
    emoji: "⬆️",
    current1RM: 70,
    unit: "kg",
    lastUpdated: "2026-01-15",
    isNewPR: false,
    history: [
      { date: "Ağu", weight: 50 },
      { date: "Eyl", weight: 55 },
      { date: "Eki", weight: 58 },
      { date: "Kas", weight: 62 },
      { date: "Ara", weight: 67 },
      { date: "Oca", weight: 70 },
    ],
  },
];

const PersonalRecords = ({ isOpen, onClose }: PersonalRecordsProps) => {
  const [selectedLift, setSelectedLift] = useState<typeof personalRecords[0] | null>(null);

  const handleLiftClick = (lift: typeof personalRecords[0]) => {
    hapticMedium();
    setSelectedLift(lift);
    
    // Trigger confetti for new PRs
    if (lift.isNewPR) {
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

  // Calculate total tonnage
  const totalBig3 = personalRecords
    .filter(pr => ["squat", "bench", "deadlift"].includes(pr.id))
    .reduce((sum, pr) => sum + pr.current1RM, 0);

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
              if (info.offset.y > 100 || info.velocity.y > 500) {
                handleClose();
              }
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
              <AnimatePresence mode="wait">
                {!selectedLift ? (
                  // Main PR View
                  <motion.div
                    key="main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="space-y-6"
                  >
                    {/* Big 3 Total */}
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
                            Big 3 Toplam
                          </span>
                          <Crown className="w-5 h-5 text-yellow-500" />
                        </div>
                        <p className="font-display text-5xl text-foreground tabular-nums">
                          {totalBig3}
                          <span className="text-2xl text-muted-foreground ml-1">kg</span>
                        </p>
                        <p className="text-primary text-xs mt-2">Squat + Bench + Deadlift</p>
                      </div>
                    </motion.div>

                    {/* Individual PRs */}
                    <div className="grid grid-cols-2 gap-3">
                      {personalRecords.map((pr, index) => (
                        <motion.button
                          key={pr.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleLiftClick(pr)}
                          className={`glass-card p-4 text-left relative overflow-hidden group ${
                            pr.isNewPR ? "ring-2 ring-yellow-500/50" : ""
                          }`}
                        >
                          {/* New PR Badge */}
                          {pr.isNewPR && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <Sparkles className="w-2 h-2" />
                              YENİ PR
                            </motion.div>
                          )}

                          {/* Emoji */}
                          <span className="text-2xl">{pr.emoji}</span>

                          {/* Name */}
                          <p className="text-muted-foreground text-xs mt-2 uppercase tracking-wider">
                            {pr.name}
                          </p>

                          {/* Weight */}
                          <p className="font-display text-3xl text-foreground mt-1 tabular-nums">
                            {pr.current1RM}
                            <span className="text-lg text-muted-foreground ml-1">{pr.unit}</span>
                          </p>

                          {/* Last Updated */}
                          <div className="flex items-center gap-1 text-muted-foreground text-[10px] mt-2">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(pr.lastUpdated).toLocaleDateString("tr-TR", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>

                          {/* Arrow indicator */}
                          <ChevronRight className="absolute bottom-4 right-3 w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

                          {/* Glow effect for new PRs */}
                          {pr.isNewPR && (
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent pointer-events-none" />
                          )}
                        </motion.button>
                      ))}
                    </div>

                    {/* Tip */}
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs">
                      <TrendingUp className="w-4 h-4" />
                      <span>Geçmişi görmek için bir harekete dokun</span>
                    </div>
                  </motion.div>
                ) : (
                  // Detail View with Graph
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="space-y-6"
                  >
                    {/* Current PR Card */}
                    <div className={`glass-card p-6 text-center relative overflow-hidden ${
                      selectedLift.isNewPR ? "ring-2 ring-yellow-500/50" : ""
                    }`}>
                      {selectedLift.isNewPR && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          YENİ REKOR!
                        </motion.div>
                      )}

                      <span className="text-4xl">{selectedLift.emoji}</span>
                      <p className="font-display text-6xl text-foreground mt-4 tabular-nums">
                        {selectedLift.current1RM}
                        <span className="text-2xl text-muted-foreground ml-1">{selectedLift.unit}</span>
                      </p>
                      <p className="text-primary text-sm mt-2">Tahmini 1RM</p>

                      {selectedLift.isNewPR && (
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
                      )}
                    </div>

                    {/* Progress Chart */}
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm text-foreground">6 Aylık Gelişim</span>
                      </div>

                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={selectedLift.history}>
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
                              formatter={(value: number) => [`${value} kg`, "1RM"]}
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

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="glass-card p-3 text-center">
                        <p className="text-muted-foreground text-[10px] uppercase">Başlangıç</p>
                        <p className="font-display text-lg text-foreground tabular-nums">
                          {selectedLift.history[0].weight}kg
                        </p>
                      </div>
                      <div className="glass-card p-3 text-center">
                        <p className="text-muted-foreground text-[10px] uppercase">Artış</p>
                        <p className="font-display text-lg text-primary tabular-nums">
                          +{selectedLift.current1RM - selectedLift.history[0].weight}kg
                        </p>
                      </div>
                      <div className="glass-card p-3 text-center">
                        <p className="text-muted-foreground text-[10px] uppercase">Yüzde</p>
                        <p className="font-display text-lg text-emerald-500 tabular-nums">
                          +{Math.round(((selectedLift.current1RM - selectedLift.history[0].weight) / selectedLift.history[0].weight) * 100)}%
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PersonalRecords;