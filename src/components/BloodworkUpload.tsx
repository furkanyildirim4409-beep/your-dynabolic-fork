import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, Plus, FileText, CheckCircle2, Clock, AlertTriangle, ChevronDown, Eye, Trash2, Loader2, Sparkles, ShoppingCart } from "lucide-react";
import { useBloodTests, type BloodTest } from "@/hooks/useBloodTests";
import { generateSupplementSuggestions } from "@/lib/supplementSuggestions";
import { useCart } from "@/context/CartContext";
import BloodworkDetailModal from "@/components/BloodworkDetailModal";
import BloodTestUploaderModal from "@/components/BloodTestUploaderModal";

const statusConfig: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  analyzed: { label: "Analiz Edildi", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  pending: { label: "Bekliyor", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
};

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

interface BloodworkUploadProps { className?: string; disabled?: boolean; }

const BloodworkUpload = ({ className, disabled = false }: BloodworkUploadProps) => {
  const { tests, loading, uploadTest, deleteTest } = useBloodTests();
  const { addToCart } = useCart();
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<BloodTest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const toggleExpand = (id: string) => setExpandedReport(expandedReport === id ? null : id);

  const getFlaggedValues = (test: BloodTest) =>
    test.extracted_data?.filter((b) => b.status !== "normal").map((b) => b.name) || [];

  const getSuggestions = (test: BloodTest) =>
    test.status === "analyzed" && test.extracted_data?.length ? generateSupplementSuggestions(test.extracted_data) : [];

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-red-400" />
          <h2 className="font-semibold text-lg text-foreground tracking-tight">KAN TAHLİLİ</h2>
        </div>
        <motion.button
          whileHover={disabled ? {} : { scale: 1.05 }}
          whileTap={disabled ? {} : { scale: 0.95 }}
          onClick={disabled ? undefined : () => setShowUploadModal(true)}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
            disabled ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-50" : "bg-primary/20 text-primary hover:bg-primary/30"
          }`}
        >
          <Plus className="w-4 h-4" />YÜKLE
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test, index) => {
            const status = statusConfig[test.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const isExpanded = expandedReport === test.id;
            const flagged = getFlaggedValues(test);
            const suggestions = getSuggestions(test);

            return (
              <motion.div key={test.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass-card overflow-hidden">
                <button onClick={() => toggleExpand(test.id)} className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{test.file_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">{formatDate(test.date)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${status.className}`}>
                        <StatusIcon className="w-3 h-3" />{status.label}
                      </span>
                      {suggestions.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs border border-purple-500/40 bg-purple-500/15 text-purple-300 flex items-center gap-1 animate-pulse">
                          <Sparkles className="w-3 h-3" />{suggestions.length} Takviye Önerisi
                        </span>
                      )}
                    </div>
                    {flagged.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-amber-400">{flagged.join(", ")} dikkat</span>
                      </div>
                    )}
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t border-white/10">
                      <div className="p-4 space-y-3">
                        {test.coach_notes && (
                          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                            <p className="text-xs text-muted-foreground mb-1">Koç Notu</p>
                            <p className="text-sm text-foreground">{test.coach_notes}</p>
                          </div>
                        )}
                        {test.status === "pending" && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <p className="text-sm text-amber-400">Koçunuz tahlil sonuçlarınızı inceliyor.</p>
                          </div>
                        )}

                        {/* AI Supplement Suggestions */}
                        {suggestions.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              <span className="text-xs font-medium text-purple-300">AI Takviye Önerileri</span>
                            </div>
                            {suggestions.map((s) => (
                              <div
                                key={s.id}
                                className="relative rounded-xl p-[1px] overflow-hidden"
                                style={{ background: "linear-gradient(135deg, hsl(270 80% 60%), hsl(220 80% 60%))" }}
                              >
                                <div className="bg-background rounded-[11px] p-3 flex items-center justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-foreground text-sm font-medium truncate">{s.name}</p>
                                    <p className="text-muted-foreground text-xs mt-0.5">{s.price}₺</p>
                                  </div>
                                  <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToCart({ id: s.id, title: s.name, price: s.price, image: s.image, type: "supplement" });
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium whitespace-nowrap"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />Sepete Ekle
                                  </motion.button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {test.status === "analyzed" && (
                            <motion.button
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedTest(test); setShowDetailModal(true); }}
                              className="flex-1 flex items-center justify-center gap-2 p-3 bg-primary/20 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors"
                            >
                              <Eye className="w-4 h-4" />DETAYLARI GÖR
                            </motion.button>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => { e.stopPropagation(); deleteTest(test.id, test.document_url); }}
                            className="flex items-center justify-center gap-2 p-3 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />SİL
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {tests.length === 0 && (
            <div className="text-center py-8">
              <Droplet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Henüz kan tahlili yüklenmemiş.</p>
            </div>
          )}
        </div>
      )}

      <BloodworkDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedTest(null); }}
        extractedData={selectedTest?.extracted_data || []}
        coachNotes={selectedTest?.coach_notes}
        testDate={selectedTest?.date}
        allTests={tests}
      />

      <BloodTestUploaderModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={uploadTest}
      />
    </div>
  );
};

export default BloodworkUpload;
