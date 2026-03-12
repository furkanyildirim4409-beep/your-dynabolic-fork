import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Calendar, X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ExerciseRecord } from "@/hooks/useExerciseRecords";

interface ExerciseSetHistoryModalProps {
  exercise: ExerciseRecord | null;
  onClose: () => void;
}

const ExerciseSetHistoryModal = ({ exercise, onClose }: ExerciseSetHistoryModalProps) => {
  if (!exercise) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const isPRSet = (weight: number, reps: number) =>
    weight === exercise.maxWeight && reps === exercise.repsAtMax;

  return (
    <Dialog open={!!exercise} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col bg-background border-white/10 rounded-2xl p-0">
        <DialogHeader className="shrink-0 p-4 pb-2">
          <DialogTitle className="font-display text-base text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {exercise.name}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-1">
            {exercise.maxWeight > 0 && (
              <Badge className="text-xs gap-1">
                🏆 PR: {exercise.maxWeight} kg × {exercise.repsAtMax}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {exercise.performCount} antrenman
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <AnimatePresence>
            {exercise.history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Henüz set geçmişi yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exercise.history.map((workout, wIdx) => (
                  <motion.div
                    key={`${workout.date}-${wIdx}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(wIdx * 0.03, 0.3) }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatDate(workout.date)}
                      </span>
                    </div>

                    <div className="space-y-1 ml-5">
                      {workout.sets.map((set, sIdx) => {
                        const isMax = isPRSet(set.weight, set.reps);
                        return (
                          <div
                            key={sIdx}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                              isMax
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-secondary/30"
                            }`}
                          >
                            <span className="text-muted-foreground text-[10px] w-5">
                              S{sIdx + 1}
                            </span>
                            <span className="text-foreground font-medium">
                              {set.weight > 0 ? `${set.weight} kg` : "BW"}
                            </span>
                            <span className="text-muted-foreground">×</span>
                            <span className="text-foreground">{set.reps} rep</span>
                            {set.rir != null && (
                              <span className="text-muted-foreground text-[10px]">
                                RIR {set.rir}
                              </span>
                            )}
                            {set.isFailure && (
                              <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5 gap-0.5">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                Failure
                              </Badge>
                            )}
                            {isMax && (
                              <Trophy className="w-3.5 h-3.5 text-primary ml-auto" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseSetHistoryModal;
