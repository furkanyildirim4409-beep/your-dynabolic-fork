import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Dumbbell, Flame, Trophy, Calendar, Send, ChevronRight, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prExercises, ChallengeType } from "@/lib/challengeData";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useChallenges } from "@/hooks/useChallenges";

interface Athlete {
  id: string;
  name: string;
  avatar: string;
  bioCoins: number;
  volume: number;
  streak: number;
}

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: Athlete[];
  preselectedAthlete?: Athlete;
}

const CreateChallengeModal = ({ isOpen, onClose, athletes, preselectedAthlete }: CreateChallengeModalProps) => {
  const { user } = useAuth();
  const { createChallenge } = useChallenges();
  const [step, setStep] = useState<"type" | "opponent" | "details">(preselectedAthlete ? "type" : "opponent");
  const [challengeType, setChallengeType] = useState<ChallengeType>("pr");
  const [selectedOpponent, setSelectedOpponent] = useState<Athlete | null>(preselectedAthlete || null);
  const [selectedExercise, setSelectedExercise] = useState(prExercises[0]);
  const [targetValue, setTargetValue] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock user's current PRs
  const userPRs: Record<string, number> = {
    squat: 180,
    bench: 120,
    deadlift: 200,
    ohp: 80,
  };
  const userStreak = 17;

  const handleSelectOpponent = (athlete: Athlete) => {
    hapticLight();
    setSelectedOpponent(athlete);
    setStep("type");
  };

  const handleSelectType = (type: ChallengeType) => {
    hapticLight();
    setChallengeType(type);
    setStep("details");
    
    // Set default target value based on type
    if (type === "pr") {
      setTargetValue(userPRs[selectedExercise.id].toString());
    } else {
      setTargetValue(userStreak.toString());
    }
  };

  const handleSendChallenge = async () => {
    if (!selectedOpponent || !targetValue) return;
    setIsSubmitting(true);
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + deadlineDays);
      await createChallenge({
        opponent_id: selectedOpponent.id,
        challenge_type: challengeType,
        exercise_name: challengeType === "pr" ? selectedExercise.name : undefined,
        challenger_value: Number(targetValue),
        wager_coins: calculateReward(),
        end_date: endDate.toISOString(),
      });
      hapticSuccess();
      onClose();
      setStep(preselectedAthlete ? "type" : "opponent");
      setSelectedOpponent(preselectedAthlete || null);
      setChallengeType("pr");
      setTargetValue("");
    } catch (error) {
      console.error(error);
      toast({ title: "Hata", description: "Meydan okuma gönderilemedi.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateReward = () => {
    const baseReward = challengeType === "pr" ? 400 : 300;
    const difficultyMultiplier = deadlineDays <= 7 ? 1.5 : deadlineDays <= 14 ? 1.2 : 1;
    return Math.floor(baseReward * difficultyMultiplier);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-background rounded-t-3xl border-t border-white/10 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg text-foreground tracking-wide">
              MEYDAN OKU
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Step 1: Select Opponent */}
          {step === "opponent" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="text-muted-foreground text-sm text-center">
                Kime meydan okumak istiyorsun?
              </p>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {athletes.filter(a => a.id !== "current" && a.id !== user?.id).slice(0, 10).map((athlete) => (
                  <motion.button
                    key={athlete.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectOpponent(athlete)}
                    className="w-full glass-card p-3 flex items-center gap-3"
                  >
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={athlete.avatar} alt={athlete.name} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {athlete.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-foreground font-medium">{athlete.name}</p>
                      <div className="flex items-center gap-3 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {athlete.bioCoins.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {athlete.streak} gün
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Challenge Type */}
          {step === "type" && selectedOpponent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Selected Opponent */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <Avatar className="w-14 h-14 ring-2 ring-primary">
                  <AvatarImage src={selectedOpponent.avatar} alt={selectedOpponent.name} className="object-cover" />
                  <AvatarFallback>{selectedOpponent.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="text-foreground font-display">{selectedOpponent.name}</p>
                  <p className="text-muted-foreground text-xs">rakibine meydan oku</p>
                </div>
              </div>

              <p className="text-muted-foreground text-sm text-center">
                Ne tür bir meydan okuma?
              </p>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectType("pr")}
                  className="glass-card p-6 flex flex-col items-center gap-3 border-2 border-transparent hover:border-orange-500/50"
                >
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                    <Dumbbell className="w-8 h-8 text-orange-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-display">PR MEYDAN OKUMASI</p>
                    <p className="text-muted-foreground text-xs mt-1">Benim PR'ımı geç!</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectType("streak")}
                  className="glass-card p-6 flex flex-col items-center gap-3 border-2 border-transparent hover:border-red-500/50"
                >
                  <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center">
                    <Flame className="w-8 h-8 text-red-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-display">SERİ MEYDAN OKUMASI</p>
                    <p className="text-muted-foreground text-xs mt-1">Benim serimi geç!</p>
                  </div>
                </motion.button>
              </div>

              <button
                onClick={() => setStep("opponent")}
                className="text-primary text-sm text-center w-full py-2"
              >
                ← Farklı rakip seç
              </button>
            </motion.div>
          )}

          {/* Step 3: Challenge Details */}
          {step === "details" && selectedOpponent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Challenge Summary */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <Avatar className="w-12 h-12 ring-2 ring-primary mx-auto">
                    <AvatarImage src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&h=100&fit=crop" />
                    <AvatarFallback>SEN</AvatarFallback>
                  </Avatar>
                  <p className="text-foreground text-xs mt-2 font-medium">Sen</p>
                </div>
                <Swords className="w-6 h-6 text-muted-foreground" />
                <div className="text-center">
                  <Avatar className="w-12 h-12 ring-2 ring-orange-500/50 mx-auto">
                    <AvatarImage src={selectedOpponent.avatar} />
                    <AvatarFallback>{selectedOpponent.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="text-foreground text-xs mt-2 font-medium">{selectedOpponent.name.split(" ")[0]}</p>
                </div>
              </div>

              {/* Exercise Selection (for PR) */}
              {challengeType === "pr" && (
                <div className="space-y-2">
                  <label className="text-muted-foreground text-sm">Hareket</label>
                  <div className="grid grid-cols-2 gap-2">
                    {prExercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => {
                          hapticLight();
                          setSelectedExercise(exercise);
                          setTargetValue(userPRs[exercise.id].toString());
                        }}
                        className={`p-3 rounded-xl border flex items-center gap-2 ${
                          selectedExercise.id === exercise.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 bg-secondary text-foreground"
                        }`}
                      >
                        <Dumbbell className="w-4 h-4" />
                        <span className="text-sm">{exercise.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Target Value */}
              <div className="space-y-2">
                <label className="text-muted-foreground text-sm">
                  {challengeType === "pr" ? "Senin PR'ın (kg)" : "Senin Serin (gün)"}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="text-2xl font-display text-center h-14"
                    placeholder={challengeType === "pr" ? "140" : "30"}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {challengeType === "pr" ? "kg" : "gün"}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs text-center">
                  Rakibin bu değeri geçmek zorunda
                </p>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <label className="text-muted-foreground text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Süre
                </label>
                <Tabs 
                  value={deadlineDays.toString()} 
                  onValueChange={(v) => { hapticLight(); setDeadlineDays(Number(v)); }}
                >
                  <TabsList className="w-full grid grid-cols-3 bg-secondary/50">
                    <TabsTrigger value="7" className="font-display text-xs">1 Hafta</TabsTrigger>
                    <TabsTrigger value="14" className="font-display text-xs">2 Hafta</TabsTrigger>
                    <TabsTrigger value="30" className="font-display text-xs">1 Ay</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Reward Preview */}
              <div className="glass-card p-4 bg-yellow-500/5 border-yellow-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-foreground text-sm">Kazanan Ödülü</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-display text-xl text-yellow-400">{calculateReward()}</span>
                    <span className="text-muted-foreground text-xs">coin</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("type")}
                  className="flex-1"
                >
                  Geri
                </Button>
                <Button
                  onClick={handleSendChallenge}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={!targetValue || isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gönderiliyor...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />Meydan Oku!</>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateChallengeModal;