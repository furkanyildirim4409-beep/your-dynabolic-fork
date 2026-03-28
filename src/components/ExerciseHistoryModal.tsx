import { motion } from "framer-motion";
import { Trophy, Calendar, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useExerciseHistory } from "@/hooks/useExerciseHistory";

interface ExerciseHistoryModalProps {
  exerciseName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ExerciseHistoryModal = ({ exerciseName, isOpen, onClose }: ExerciseHistoryModalProps) => {
  const { data: historyData } = useExerciseHistory();
  const pr = historyData?.prMap?.get(exerciseName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {exerciseName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {pr ? (
            <div className="glass-card p-4 text-center">
              <p className="text-muted-foreground text-xs mb-1">Kişisel Rekor (PR)</p>
              <p className="font-display text-3xl text-primary">{pr.maxWeight} kg</p>
              <p className="text-muted-foreground text-xs mt-1">× {pr.repsAtMax} rep</p>
              {pr.date && (
                <p className="text-muted-foreground text-[10px] flex items-center justify-center gap-1 mt-2">
                  <Calendar className="w-3 h-3" />
                  {new Date(pr.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          ) : (
            <div className="glass-card p-4 text-center">
              <p className="text-muted-foreground text-sm">Bu egzersiz için henüz kayıt yok</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseHistoryModal;
