import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trophy, Dumbbell, Flame, ChevronRight, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { ExerciseRecord } from "@/hooks/useExerciseRecords";
import ExerciseSetHistoryModal from "./ExerciseSetHistoryModal";

interface ExerciseRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: ExerciseRecord[];
}

const ExerciseRecordsModal = ({ isOpen, onClose, exercises }: ExerciseRecordsModalProps) => {
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseRecord | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return exercises;
    const q = search.toLowerCase();
    return exercises.filter(e => e.name.toLowerCase().includes(q));
  }, [exercises, search]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl bg-background border-white/10 p-0 flex flex-col">
          <SheetHeader className="shrink-0 p-4 pb-0">
            <SheetTitle className="font-display text-base text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Egzersiz Rekorların
            </SheetTitle>
          </SheetHeader>

          <div className="shrink-0 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Egzersiz ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-secondary/50 border-white/10 text-sm"
              />
            </div>
            <p className="text-muted-foreground text-[10px] mt-2">
              {exercises.length} farklı egzersiz yapıldı
            </p>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6">
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filtered.map((exercise, index) => (
                  <motion.div
                    key={exercise.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: Math.min(index * 0.02, 0.3) }}
                    className="glass-card p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => setSelectedExercise(exercise)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium truncate">{exercise.name}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 gap-1">
                          <Flame className="w-2.5 h-2.5" />
                          {exercise.performCount} antrenman
                        </Badge>
                        {exercise.bestDate && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatDate(exercise.bestDate)}
                          </Badge>
                        )}
                        {exercise.repsAtMax > 0 && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                            × {exercise.repsAtMax} rep
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {exercise.maxWeight > 0 && (
                        <div className="text-right">
                          <p className="font-display text-lg text-primary leading-none">{exercise.maxWeight}</p>
                          <p className="text-muted-foreground text-[10px]">kg PR</p>
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Eşleşen egzersiz bulunamadı</p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ExerciseSetHistoryModal
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </>
  );
};

export default ExerciseRecordsModal;
