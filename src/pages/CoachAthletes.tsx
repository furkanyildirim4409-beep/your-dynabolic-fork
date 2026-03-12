import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, Beef, Wheat, Droplets, Flame, ChevronRight, Search, UserCog, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CoachMacroOverrideModal from "@/components/CoachMacroOverrideModal";
import { hapticLight } from "@/lib/haptics";

interface AthleteRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  current_weight: number | null;
  height_cm: number | null;
  birth_date: string | null;
  gender: string | null;
  activity_level: string | null;
  fitness_goal: string | null;
  daily_protein_target: number | null;
  daily_carb_target: number | null;
  daily_fat_target: number | null;
  daily_calorie_target: number | null;
}

const goalLabel: Record<string, string> = {
  cut: "Kilo Ver",
  maintenance: "Koruma",
  bulk: "Kas Yap",
};

const CoachAthletes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteRow | null>(null);
  const [showMacroModal, setShowMacroModal] = useState(false);

  const fetchAthletes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, current_weight, height_cm, birth_date, gender, activity_level, fitness_goal, daily_protein_target, daily_carb_target, daily_fat_target, daily_calorie_target")
      .eq("coach_id", user.id)
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Fetch athletes error:", error.message);
    }
    setAthletes((data as AthleteRow[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAthletes();
  }, [fetchAthletes]);

  const filtered = athletes.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.full_name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
    );
  });

  const handleOpenMacro = (athlete: AthleteRow) => {
    hapticLight();
    setSelectedAthlete(athlete);
    setShowMacroModal(true);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => { hapticLight(); navigate(-1); }}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg text-foreground">SPORCULARIM</h1>
            <p className="text-muted-foreground text-xs">{athletes.length} sporcu</p>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-primary font-display text-sm">{athletes.length}</span>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Sporcu ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-secondary/50 border-border"
          />
        </div>

        {/* Athletes List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <UserCog className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? "Sporcu bulunamadı" : "Henüz sporcu bağlı değil"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((athlete, index) => {
              const hasMacros = athlete.daily_protein_target != null;
              const totalCal = hasMacros
                ? (athlete.daily_protein_target! * 4 + (athlete.daily_carb_target ?? 0) * 4 + (athlete.daily_fat_target ?? 0) * 9)
                : null;

              return (
                <motion.div
                  key={athlete.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-4 space-y-3"
                >
                  {/* Athlete Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-display text-sm">
                        {(athlete.full_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">{athlete.full_name || "İsimsiz"}</p>
                        <p className="text-muted-foreground text-[11px]">{athlete.email}</p>
                      </div>
                    </div>
                    {athlete.fitness_goal && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        {goalLabel[athlete.fitness_goal] ?? athlete.fitness_goal}
                      </span>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="flex gap-3 text-xs">
                    {athlete.current_weight && (
                      <span className="text-muted-foreground">{athlete.current_weight} kg</span>
                    )}
                    {athlete.height_cm && (
                      <span className="text-muted-foreground">{athlete.height_cm} cm</span>
                    )}
                  </div>

                  {/* Macro Targets Display */}
                  {hasMacros ? (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center p-2 bg-primary/10 rounded-lg">
                        <Flame className="w-3 h-3 text-primary mx-auto mb-0.5" />
                        <p className="text-primary font-display text-xs">{totalCal}</p>
                        <p className="text-muted-foreground text-[9px]">kcal</p>
                      </div>
                      <div className="text-center p-2 bg-secondary/50 rounded-lg">
                        <Beef className="w-3 h-3 text-blue-400 mx-auto mb-0.5" />
                        <p className="text-foreground font-display text-xs">{athlete.daily_protein_target}g</p>
                        <p className="text-muted-foreground text-[9px]">Protein</p>
                      </div>
                      <div className="text-center p-2 bg-secondary/50 rounded-lg">
                        <Wheat className="w-3 h-3 text-orange-400 mx-auto mb-0.5" />
                        <p className="text-foreground font-display text-xs">{athlete.daily_carb_target}g</p>
                        <p className="text-muted-foreground text-[9px]">Karb</p>
                      </div>
                      <div className="text-center p-2 bg-secondary/50 rounded-lg">
                        <Droplets className="w-3 h-3 text-yellow-400 mx-auto mb-0.5" />
                        <p className="text-foreground font-display text-xs">{athlete.daily_fat_target}g</p>
                        <p className="text-muted-foreground text-[9px]">Yağ</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-secondary/30 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground text-[11px]">Makro hedefi ayarlanmadı</p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-2"
                    onClick={() => handleOpenMacro(athlete)}
                  >
                    <Target className="w-3.5 h-3.5" />
                    Makro Hedeflerini Düzenle
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Coach Macro Override Modal */}
      <CoachMacroOverrideModal
        isOpen={showMacroModal}
        onClose={() => setShowMacroModal(false)}
        athlete={selectedAthlete}
        onSaved={fetchAthletes}
      />
    </div>
  );
};

export default CoachAthletes;
