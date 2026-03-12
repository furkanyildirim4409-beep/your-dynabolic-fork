import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, CheckCircle2, Clock, AlertTriangle, Eye, Loader2, Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BloodworkDetailModal from "@/components/BloodworkDetailModal";
import type { BloodTest, BloodTestBiomarker } from "@/hooks/useBloodTests";

interface CoachBloodworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  analyzed: { label: "Analiz Edildi", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  pending: { label: "Bekliyor", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

const CoachBloodworkModal = ({ isOpen, onClose, athleteId, athleteName }: CoachBloodworkModalProps) => {
  const [tests, setTests] = useState<BloodTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<BloodTest | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("blood_tests")
      .select("*")
      .eq("user_id", athleteId)
      .order("date", { ascending: false });

    if (!error && data) {
      setTests(data.map((d: any) => ({ ...d, extracted_data: (d.extracted_data as BloodTestBiomarker[]) || [] })));
    }
    setLoading(false);
  }, [athleteId]);

  useEffect(() => {
    if (isOpen) fetchTests();
  }, [isOpen, fetchTests]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="min-h-screen bg-background pt-4 pb-24"
        >
          {/* Header */}
          <div className="px-4 flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-red-400" />
                <h2 className="font-display text-lg font-bold text-foreground">Kan Tahlilleri</h2>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">{athleteName}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="px-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-12">
                <Droplet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Bu sporcunun kan tahlili bulunmuyor.</p>
              </div>
            ) : (
              tests.map((test, index) => {
                const status = statusConfig[test.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const flagged = test.extracted_data?.filter((b) => b.status !== "normal").map((b) => b.name) || [];

                return (
                  <motion.div
                    key={test.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card p-4 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{test.file_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{formatDate(test.date)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${status.className}`}>
                            <StatusIcon className="w-3 h-3" />{status.label}
                          </span>
                        </div>
                        {flagged.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span className="text-xs text-amber-400">{flagged.join(", ")} dikkat</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {test.status === "analyzed" && (
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedTest(test); setShowDetail(true); }}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-primary/20 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors"
                      >
                        <Eye className="w-4 h-4" />DETAYLARI GÖR & NOT EKLE
                      </motion.button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Detail Modal in Coach Mode */}
          <BloodworkDetailModal
            isOpen={showDetail}
            onClose={() => { setShowDetail(false); setSelectedTest(null); }}
            extractedData={selectedTest?.extracted_data || []}
            coachNotes={selectedTest?.coach_notes}
            testDate={selectedTest?.date}
            allTests={tests}
            mode="coach"
            testId={selectedTest?.id}
            onNotesSaved={fetchTests}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CoachBloodworkModal;
