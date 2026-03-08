import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Calendar, Trophy, Target, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

interface ExerciseHistoryModalProps {
  exerciseName: string;
  isOpen: boolean;
  onClose: () => void;
}

const mockHistory = [
  { date: "2024-03-08", weight: 100, reps: 5, sets: 4, estimated1RM: 112 },
  { date: "2024-03-01", weight: 97.5, reps: 5, sets: 4, estimated1RM: 109 },
  { date: "2024-02-23", weight: 95, reps: 6, sets: 4, estimated1RM: 110 },
  { date: "2024-02-16", weight: 92.5, reps: 5, sets: 4, estimated1RM: 104 },
  { date: "2024-02-09", weight: 90, reps: 6, sets: 4, estimated1RM: 104 },
];

const ExerciseHistoryModal = ({ exerciseName, isOpen, onClose }: ExerciseHistoryModalProps) => {
  const [goalWeight, setGoalWeight] = useState("");
  const currentPR = mockHistory[0]?.estimated1RM || 0;
  const previousPR = mockHistory[1]?.estimated1RM || 0;
  const improvement = currentPR - previousPR;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-white/10 max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {exerciseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current PR */}
          <div className="glass-card p-4 text-center">
            <p className="text-muted-foreground text-xs mb-1">Tahmini 1RM</p>
            <p className="font-display text-3xl text-primary">{currentPR} kg</p>
            {improvement > 0 && (
              <p className="text-emerald-400 text-xs flex items-center justify-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +{improvement} kg son antrenman
              </p>
            )}
          </div>

          {/* Goal Setting */}
          <div className="glass-card p-3">
            <p className="text-muted-foreground text-xs mb-2 flex items-center gap-1">
              <Target className="w-3 h-3" /> Hedef Belirle
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Hedef kg"
                value={goalWeight}
                onChange={e => setGoalWeight(e.target.value)}
                className="bg-white/5 border-white/10 text-sm"
              />
              <Button size="sm" variant="default" className="shrink-0">
                Kaydet
              </Button>
            </div>
            {goalWeight && Number(goalWeight) > currentPR && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>İlerleme</span>
                  <span>{currentPR}/{goalWeight} kg</span>
                </div>
                <Progress value={(currentPR / Number(goalWeight)) * 100} className="h-1.5" />
              </div>
            )}
          </div>

          {/* History */}
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Geçmiş
            </p>
            <div className="space-y-1.5">
              {mockHistory.map((entry, i) => (
                <motion.div
                  key={entry.date}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-2.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-foreground text-sm">{entry.weight} kg × {entry.reps} rep</p>
                    <p className="text-muted-foreground text-[10px]">{entry.date} • {entry.sets} set</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary text-xs font-display">{entry.estimated1RM} kg</p>
                    <p className="text-muted-foreground text-[10px]">e1RM</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseHistoryModal;
