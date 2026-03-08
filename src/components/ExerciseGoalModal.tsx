import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, TrendingUp, Dumbbell, Clock, ChevronUp, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type GoalType = "weight" | "reps" | "time";

interface ExerciseGoal {
  exerciseName: string;
  type: GoalType;
  currentValue: number;
  targetValue: number;
  unit: string;
  deadline?: string;
}

interface ExerciseGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName?: string;
  onSave?: (goal: ExerciseGoal) => void;
}

const ExerciseGoalModal = ({ isOpen, onClose, exerciseName = "Bench Press", onSave }: ExerciseGoalModalProps) => {
  const [goalType, setGoalType] = useState<GoalType>("weight");
  const [targetValue, setTargetValue] = useState(120);
  const [deadline, setDeadline] = useState("4 Hafta");

  const goalConfigs = {
    weight: { icon: Dumbbell, label: "Ağırlık", unit: "kg", step: 2.5, currentValue: 100, color: "text-blue-400" },
    reps: { icon: TrendingUp, label: "Tekrar", unit: "rep", step: 1, currentValue: 8, color: "text-green-400" },
    time: { icon: Clock, label: "Süre", unit: "sn", step: 5, currentValue: 60, color: "text-orange-400" },
  };

  const config = goalConfigs[goalType];
  const improvement = ((targetValue - config.currentValue) / config.currentValue * 100).toFixed(1);

  const handleSave = () => {
    onSave?.({
      exerciseName,
      type: goalType,
      currentValue: config.currentValue,
      targetValue,
      unit: config.unit,
      deadline,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-background rounded-t-3xl p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Hedef Belirle</h2>
                <p className="text-muted-foreground text-xs">{exerciseName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Goal Type Selector */}
          <div className="flex gap-2 mb-6">
            {(Object.keys(goalConfigs) as GoalType[]).map((type) => {
              const Icon = goalConfigs[type].icon;
              return (
                <button
                  key={type}
                  onClick={() => {
                    setGoalType(type);
                    setTargetValue(goalConfigs[type].currentValue + goalConfigs[type].step * 4);
                  }}
                  className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    goalType === type ? "bg-primary/10 border border-primary/30" : "bg-secondary border border-border"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${goalType === type ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-xs font-medium ${goalType === type ? "text-primary" : "text-muted-foreground"}`}>
                    {goalConfigs[type].label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Value Adjuster */}
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-xs mb-2">Mevcut: {config.currentValue} {config.unit}</p>
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setTargetValue((v) => Math.max(config.currentValue, v - config.step))}
                className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
              >
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </motion.button>
              <div>
                <motion.span
                  key={targetValue}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className={`font-display text-5xl font-bold ${config.color}`}
                >
                  {targetValue}
                </motion.span>
                <span className="text-muted-foreground text-lg ml-1">{config.unit}</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setTargetValue((v) => v + config.step)}
                className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
              >
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>
            <p className="text-green-400 text-sm mt-2 flex items-center justify-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +{improvement}% artış
            </p>
          </div>

          {/* Deadline */}
          <div className="mb-6">
            <p className="text-muted-foreground text-xs mb-2">Süre</p>
            <div className="flex gap-2">
              {["2 Hafta", "4 Hafta", "8 Hafta", "12 Hafta"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDeadline(d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    deadline === d ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <Button className="w-full gap-2" onClick={handleSave}>
            <Check className="w-4 h-4" />
            Hedefi Kaydet
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ExerciseGoalModal;
