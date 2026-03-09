import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Clock, Dumbbell, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TransformedWorkout } from "@/hooks/useAssignedWorkouts";
import confetti from "canvas-confetti";

interface WorkoutCompletionModalProps {
  isOpen: boolean;
  workout: TransformedWorkout;
  durationSeconds: number;
  totalSetsCompleted: number;
  onComplete: () => void;
}

const WorkoutCompletionModal = ({ isOpen, workout, durationSeconds, totalSetsCompleted, onComplete }: WorkoutCompletionModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [isOpen]);

  const durationMinutes = Math.ceil(durationSeconds / 60);
  const exerciseCount = workout.programExercises.length;

  const handleSave = async () => {
    if (!user?.id || saving) return;
    setSaving(true);

    try {
      // Update assigned_workouts status
      const { error: updateErr } = await supabase
        .from("assigned_workouts")
        .update({ status: "completed" })
        .eq("id", workout.id);

      if (updateErr) throw updateErr;

      // Insert workout_log
      const { error: logErr } = await supabase
        .from("workout_logs")
        .insert({
          user_id: user.id,
          workout_name: workout.title,
          duration_minutes: durationMinutes,
          exercises_count: exerciseCount,
          completed: true,
          details: { sets_completed: totalSetsCompleted },
          bio_coins_earned: 10,
        });

      if (logErr) throw logErr;

      // Award bio coins
      await supabase
        .from("bio_coin_transactions")
        .insert({
          user_id: user.id,
          amount: 10,
          type: "earn",
          description: `${workout.title} tamamlandı`,
        });

      await queryClient.invalidateQueries({ queryKey: ["assigned-workouts"] });
      toast.success("Antrenman kaydedildi! +10 Bio-Coin 🎉");
      onComplete();
    } catch (err) {
      console.error(err);
      toast.error("Kayıt sırasında hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="text-center max-w-sm w-full"
      >
        <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-6 flex items-center justify-center">
          <Trophy className="w-10 h-10 text-primary" />
        </div>

        <h1 className="font-display text-3xl text-foreground mb-2">TEBRİKLER! 🎉</h1>
        <p className="text-muted-foreground text-sm mb-8">Antrenmanı başarıyla tamamladın</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="font-display text-lg text-foreground">{durationMinutes}dk</p>
            <p className="text-muted-foreground text-[10px]">Süre</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <Dumbbell className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="font-display text-lg text-foreground">{exerciseCount}</p>
            <p className="text-muted-foreground text-[10px]">Hareket</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <span className="text-xl block mb-1">🪙</span>
            <p className="font-display text-lg text-primary">+10</p>
            <p className="text-muted-foreground text-[10px]">Bio-Coin</p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className="w-full min-h-[56px] rounded-2xl bg-primary text-primary-foreground font-display text-lg tracking-wider flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "ANTRENMANI KAYDET"}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default WorkoutCompletionModal;
