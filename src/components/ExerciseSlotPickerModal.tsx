import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Check, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { ExerciseRecord } from "@/hooks/useExerciseRecords";

const EMOJI_OPTIONS = ["🏋️", "🦵", "💀", "💪", "🔥", "🎯", "⚡", "🏆", "💥", "🫁", "🦾", "🧊"];

const DEFAULT_SLOTS = [
  { name: "Bench Press", emoji: "🏋️" },
  { name: "Squat", emoji: "🦵" },
  { name: "Deadlift", emoji: "💀" },
  { name: "Shoulder Press", emoji: "💪" },
  { name: "Barbell Row", emoji: "🔥" },
];

interface SlotConfig {
  name: string;
  emoji: string;
}

interface ExerciseSlotPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSlots: SlotConfig[];
  onSave: (slots: SlotConfig[]) => void;
  allExercises: ExerciseRecord[];
}

const ExerciseSlotPickerModal = ({
  isOpen,
  onClose,
  currentSlots,
  onSave,
  allExercises,
}: ExerciseSlotPickerModalProps) => {
  const [draft, setDraft] = useState<SlotConfig[]>(currentSlots);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return allExercises;
    const q = search.toLowerCase();
    return allExercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [allExercises, search]);

  const handleSelectExercise = (name: string) => {
    if (editingIdx === null) return;
    setDraft((prev) => {
      const next = [...prev];
      next[editingIdx] = { ...next[editingIdx], name };
      return next;
    });
    setEditingIdx(null);
    setSearch("");
  };

  const handleEmojiChange = (idx: number, emoji: string) => {
    setDraft((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], emoji };
      return next;
    });
  };

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(DEFAULT_SLOTS);
  };

  // Sync draft when opening
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setDraft(currentSlots);
      setEditingIdx(null);
      setSearch("");
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-background border-white/10 rounded-2xl p-0 max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0 p-4 pb-2">
          <DialogTitle className="font-display text-base text-foreground">
            Rekor Slotlarını Düzenle
          </DialogTitle>
          <p className="text-muted-foreground text-xs mt-1">
            Kartında görmek istediğin 5 egzersizi seç
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-2">
          {/* Current 5 slots */}
          <div className="space-y-2 mb-4">
            {draft.map((slot, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  editingIdx === idx
                    ? "border-primary/50 bg-primary/5"
                    : "border-white/5 bg-secondary/30"
                }`}
              >
                {/* Emoji picker */}
                <div className="relative group">
                  <button className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-lg hover:bg-primary/20 transition-colors">
                    {slot.emoji}
                  </button>
                  <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:grid grid-cols-4 gap-1 p-2 bg-popover border border-white/10 rounded-xl shadow-xl min-w-[140px]">
                    {EMOJI_OPTIONS.map((em) => (
                      <button
                        key={em}
                        onClick={() => handleEmojiChange(idx, em)}
                        className={`w-7 h-7 rounded-md flex items-center justify-center text-sm hover:bg-secondary transition-colors ${
                          slot.emoji === em ? "bg-primary/20" : ""
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise name */}
                <button
                  onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                  className="flex-1 text-left text-sm text-foreground font-medium truncate hover:text-primary transition-colors"
                >
                  {slot.name}
                </button>

                <span className="text-[10px] text-muted-foreground">
                  Slot {idx + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Exercise picker (when editing a slot) */}
          {editingIdx !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-t border-white/5 pt-3"
            >
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Egzersiz ara..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-secondary/50 border-white/10 text-sm"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filtered.length === 0 ? (
                  <p className="text-muted-foreground text-xs text-center py-4">
                    Eşleşen egzersiz yok
                  </p>
                ) : (
                  filtered.map((ex) => {
                    const isSelected = draft.some((s) => s.name.toLowerCase() === ex.name.toLowerCase());
                    return (
                      <button
                        key={ex.name}
                        onClick={() => handleSelectExercise(ex.name)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-secondary/50 text-foreground"
                        }`}
                      >
                        <span className="flex-1 truncate">{ex.name}</span>
                        {ex.maxWeight > 0 && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            PR: {ex.maxWeight} kg
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </div>

        <DialogFooter className="shrink-0 p-4 pt-2 flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            Sıfırla
          </Button>
          <Button size="sm" onClick={handleSave} className="flex-1">
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseSlotPickerModal;
