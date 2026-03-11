import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, MessageSquare, ChevronRight, ChevronDown, ChevronUp, Flame, CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExerciseDetail {
  name: string;
  sets: number;
  reps: string;
  rir?: number;
  rpe?: number;
  failureSet?: boolean;
  groupId?: string;
}

interface WorkoutCardProps {
  title: string;
  day: string;
  exercises: number;
  duration: string;
  coachNote?: string;
  intensity: "Düşük" | "Orta" | "Yüksek";
  exerciseDetails?: ExerciseDetail[];
  completedToday?: boolean;
  onStart: () => void;
}

const WorkoutCard = ({
  title,
  day,
  exercises,
  duration,
  coachNote,
  intensity,
  exerciseDetails,
  onStart,
}: WorkoutCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const intensityColors = {
    Düşük: "bg-muted text-muted-foreground",
    Orta: "bg-stat-strain/20 text-stat-strain",
    Yüksek: "bg-destructive/20 text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 relative overflow-hidden"
    >
      {/* Coach Note Indicator */}
      {coachNote && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center"
        >
          <MessageSquare className="w-4 h-4 text-yellow-500" />
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-foreground tracking-wide">{title}</h3>
          <p className="text-muted-foreground text-xs">{day}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">{exercises}</span> Hareket
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="text-foreground font-medium">{duration}</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${intensityColors[intensity]}`}>
          {intensity}
        </span>
      </div>

      {/* Expandable Exercise List */}
      {exerciseDetails && exerciseDetails.length > 0 && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span className="font-medium">Hareketleri {expanded ? "Gizle" : "Göster"}</span>
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1.5">
                  {(() => {
                    // Group adjacent exercises by groupId
                    const groups: { groupId: string | undefined; items: { ex: ExerciseDetail; idx: number }[] }[] = [];
                    exerciseDetails.forEach((ex, i) => {
                      const last = groups[groups.length - 1];
                      if (ex.groupId && last?.groupId === ex.groupId) {
                        last.items.push({ ex, idx: i });
                      } else {
                        groups.push({ groupId: ex.groupId, items: [{ ex, idx: i }] });
                      }
                    });

                    return groups.map((group, gi) => {
                      const isSuperset = !!group.groupId && group.items.length > 1;
                      const rows = group.items.map(({ ex, idx }) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground font-medium truncate">{ex.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {ex.sets} × {ex.reps}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {ex.failureSet && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5">
                                <Flame className="w-3 h-3" />
                                TÜKENİŞ
                              </Badge>
                            )}
                            {!ex.failureSet && typeof ex.rir === "number" && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                RIR: {ex.rir}
                              </Badge>
                            )}
                            {typeof ex.rpe === "number" && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                RPE: {ex.rpe}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ));

                      if (isSuperset) {
                        return (
                          <div key={gi} className="border-l-2 border-primary pl-2 space-y-1.5">
                            <span className="text-[10px] font-semibold text-primary flex items-center gap-1">
                              🔗 Süperset
                            </span>
                            {rows}
                          </div>
                        );
                      }

                      return <div key={gi}>{rows}</div>;
                    });
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Coach Note */}
      {coachNote && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
          <p className="text-yellow-500 text-xs font-medium mb-1">Koçun Notu:</p>
          <p className="text-foreground/80 text-sm">{coachNote}</p>
        </div>
      )}

      {/* Start Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="w-full py-3 bg-primary/10 border border-primary/50 rounded-xl font-display text-primary tracking-wider hover:bg-primary/20 transition-all neon-glow-sm flex items-center justify-center gap-2"
      >
        GÖREVİ BAŞLAT
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

export default WorkoutCard;
