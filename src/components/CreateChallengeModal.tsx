import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, Dumbbell, Flame, Trophy, Calendar, Send, ChevronRight, Loader2, Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChallengeType } from "@/lib/challengeData";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useChallenges } from "@/hooks/useChallenges";
import { useTopExercises } from "@/hooks/useTopExercises";

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
  const { user, profile } = useAuth();
  const { createChallenge } = useChallenges();
  const { topExercises, allExercises } = useTopExercises();

  const [step, setStep] = useState<"type" | "opponent" | "details">(preselectedAthlete ? "type" : "opponent");
  const [challengeType, setChallengeType] = useState<ChallengeType>("pr");
  const [selectedOpponent, setSelectedOpponent] = useState<Athlete | null>(preselectedAthlete || null);
  const [selectedExerciseName, setSelectedExerciseName] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");

  // Top 4 quick-select exercises from real workout data
  const top4 = useMemo(() => topExercises.slice(0, 4), [topExercises]);

  // Build a PR map from top exercises
  const prMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const ex of topExercises) {
      if (ex.maxWeight > 0) map.set(ex.name, ex.maxWeight);
    }
    return map;
  }, [topExercises]);

  // Merge exercise_library + historical for search
  const searchResults = useMemo(() => {
    if (!exerciseSearch.trim()) return [];
    const q = exerciseSearch.toLowerCase();
    const historicalNames = topExercises.map((e) => e.name);
    const merged = Array.from(new Set([...historicalNames, ...allExercises]));
    return merged.filter((name) => name.toLowerCase().includes(q)).slice(0, 100);
  }, [exerciseSearch, topExercises, allExercises]);

  // Real user avatar & name
  const userAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url || "";
  const userFirstName = (profile?.full_name || user?.user_metadata?.full_name || "Sen").split(" ")[0];
  const userStreak = profile?.streak ?? 0;

  const handleSelectOpponent = (athlete: Athlete) => {
    hapticLight();
    setSelectedOpponent(athlete);
    setStep("type");
  };

  const handleSelectType = (type: ChallengeType) => {
    hapticLight();
    setChallengeType(type);
    setStep("details");

    if (type === "pr") {
      const defaultEx = top4[0]?.name || "";
      setSelectedExerciseName(defaultEx);
      setTargetValue((prMap.get(defaultEx) ?? "").toString());
    } else {
      setTargetValue(userStreak.toString());
    }
  };

  const selectExercise = (name: string) => {
    hapticLight();
    setSelectedExerciseName(name);
    setTargetValue((prMap.get(name) ?? "").toString());
    setExerciseSearch("");
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
        exercise_name: challengeType === "pr" ? selectedExerciseName : undefined,
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
      setSelectedExerciseName("");
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
            <h2 className="font-display text-lg text-foreground tracking-wide">MEYDAN OKU</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(85vh-80px)]">
          {/* Step 1: Select Opponent */}
          {step === "opponent" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-muted-foreground text-sm text-center">Kime meydan okumak istiyorsun?</p>
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
                      <AvatarFallback className="bg-primary/20 text-primary">{athlete.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-foreground font-medium">{athlete.name}</p>
                      <div className="flex items-center gap-3 text-muted-foreground text-xs">
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{athlete.bioCoins.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{athlete.streak} gün</span>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
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
              <p className="text-muted-foreground text-sm text-center">Ne tür bir meydan okuma?</p>
              <div className="grid grid-cols-2 gap-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelectType("pr")} className="glass-card p-6 flex flex-col items-center gap-3 border-2 border-transparent hover:border-orange-500/50">
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center"><Dumbbell className="w-8 h-8 text-orange-400" /></div>
                  <div className="text-center">
                    <p className="text-foreground font-display">PR MEYDAN OKUMASI</p>
                    <p className="text-muted-foreground text-xs mt-1">Benim PR'ımı geç!</p>
                  </div>
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSelectType("streak")} className="glass-card p-6 flex flex-col items-center gap-3 border-2 border-transparent hover:border-red-500/50">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center"><Flame className="w-8 h-8 text-red-400" /></div>
                  <div className="text-center">
                    <p className="text-foreground font-display">SERİ MEYDAN OKUMASI</p>
                    <p className="text-muted-foreground text-xs mt-1">Benim serimi geç!</p>
                  </div>
                </motion.button>
              </div>
              <button onClick={() => setStep("opponent")} className="text-primary text-sm text-center w-full py-2">← Farklı rakip seç</button>
            </motion.div>
          )}

          {/* Step 3: Challenge Details */}
          {step === "details" && selectedOpponent && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* VS Summary with real avatars */}
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <Avatar className="w-12 h-12 ring-2 ring-primary mx-auto">
                    <AvatarImage src={userAvatar} />
                    <AvatarFallback className="bg-primary/20 text-primary">{userFirstName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="text-foreground text-xs mt-2 font-medium">{userFirstName}</p>
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
                <div className="space-y-3">
                  <label className="text-muted-foreground text-sm">Hareket</label>

                  {/* Top 4 quick-select */}
                  {top4.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {top4.map((ex) => (
                        <button
                          key={ex.name}
                          onClick={() => selectExercise(ex.name)}
                          className={`p-3 rounded-xl border flex items-center gap-2 ${
                            selectedExerciseName === ex.name
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-white/10 bg-secondary text-foreground"
                          }`}
                        >
                          <Dumbbell className="w-4 h-4" />
                          <div className="text-left flex-1 min-w-0">
                            <span className="text-sm truncate block">{ex.name}</span>
                            {ex.maxWeight > 0 && (
                              <span className="text-[10px] text-muted-foreground">{ex.maxWeight} kg PR</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Exercise search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      placeholder="Hareket ara..."
                      className="pl-9 h-10"
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-white/10 bg-secondary/50 p-1">
                      {searchResults.map((name) => (
                        <button
                          key={name}
                          onClick={() => selectExercise(name)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedExerciseName === name
                              ? "bg-primary/20 text-primary"
                              : "text-foreground hover:bg-white/5"
                          }`}
                        >
                          <span>{name}</span>
                          {prMap.has(name) && (
                            <span className="text-muted-foreground text-xs ml-2">({prMap.get(name)} kg)</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedExerciseName && (
                    <p className="text-xs text-primary">
                      Seçili: <span className="font-medium">{selectedExerciseName}</span>
                      {prMap.has(selectedExerciseName) && ` — PR: ${prMap.get(selectedExerciseName)} kg`}
                    </p>
                  )}
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
                <p className="text-muted-foreground text-xs text-center">Rakibin bu değeri geçmek zorunda</p>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <label className="text-muted-foreground text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />Süre
                </label>
                <Tabs value={deadlineDays.toString()} onValueChange={(v) => { hapticLight(); setDeadlineDays(Number(v)); }}>
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
                <Button variant="outline" onClick={() => setStep("type")} className="flex-1">Geri</Button>
                <Button
                  onClick={handleSendChallenge}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={!targetValue || isSubmitting || (challengeType === "pr" && !selectedExerciseName)}
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
