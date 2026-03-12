import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import type { BloodTestBiomarker, BloodTest } from "@/hooks/useBloodTests";

interface BloodworkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: BloodTestBiomarker[];
  coachNotes?: string | null;
  testDate?: string;
  allTests: BloodTest[];
}

const BloodworkDetailModal = ({ isOpen, onClose, extractedData, coachNotes, allTests }: BloodworkDetailModalProps) => {
  if (!isOpen) return null;

  const biomarkers = extractedData || [];
  const flagged = biomarkers.filter((b) => b.status === "low" || b.status === "high");

  // Build hormone trend from all tests (sorted by date ascending)
  const sortedTests = [...allTests]
    .filter((t) => t.status === "analyzed" && t.extracted_data?.length > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-6);

  const hormoneTrends = sortedTests.map((t) => {
    const testo = t.extracted_data.find((b) => b.name === "Testosteron");
    const cortisol = t.extracted_data.find((b) => b.name === "Kortizol");
    const month = new Date(t.date).toLocaleDateString("tr-TR", { month: "short" });
    return {
      month,
      testosterone: testo?.value || 0,
      cortisol: cortisol?.value || 0,
    };
  });

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
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-bold text-foreground">Kan Tahlili Detayları</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-secondary">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Flagged Values Alert */}
          {flagged.length > 0 && (
            <div className="mx-4 mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">{flagged.length} değer dikkat gerektiriyor</span>
              </div>
              <p className="text-muted-foreground text-xs">
                {flagged.map((f) => f.name).join(", ")} değerleri referans aralığı dışında.
              </p>
            </div>
          )}

          {/* Hormone Trends Chart */}
          {hormoneTrends.length > 1 && (
            <div className="mx-4 mb-6">
              <h3 className="text-foreground text-sm font-medium mb-3">Hormon Trendi</h3>
              <div className="backdrop-blur-xl bg-card border border-border rounded-xl p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={hormoneTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 15%)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(0 0% 60%)", fontSize: 10 }} />
                    <YAxis yAxisId="left" hide />
                    <YAxis yAxisId="right" orientation="right" hide />
                    <Tooltip contentStyle={{ background: "hsl(240 6% 4%)", border: "1px solid hsl(240 4% 15%)", borderRadius: 8, fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="testosterone" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} name="Testosteron" />
                    <Line yAxisId="right" type="monotone" dataKey="cortisol" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} name="Kortizol" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-blue-500 rounded" /><span className="text-xs text-muted-foreground">Testosteron</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-0.5 bg-amber-500 rounded" /><span className="text-xs text-muted-foreground">Kortizol</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Biomarker List */}
          <div className="mx-4">
            <h3 className="text-foreground text-sm font-medium mb-3">Tüm Biyobelirteçler</h3>
            <div className="space-y-2">
              {biomarkers.map((marker) => (
                <div
                  key={marker.name}
                  className={`backdrop-blur-xl bg-card border rounded-xl p-3 ${
                    marker.status !== "normal" ? "border-yellow-500/30" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {marker.status === "normal" ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : marker.status === "low" ? (
                        <TrendingDown className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-foreground text-sm font-medium">{marker.name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${marker.status === "normal" ? "text-foreground" : "text-yellow-400"}`}>
                        {marker.value} {marker.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-muted-foreground text-xs">Referans: {marker.ref}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      marker.status === "normal" ? "bg-green-500/10 text-green-400" :
                      marker.status === "low" ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {marker.status === "normal" ? "Normal" : marker.status === "low" ? "Düşük" : "Yüksek"}
                    </span>
                  </div>
                </div>
              ))}
              {biomarkers.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">Henüz biyobelirteç verisi yok.</p>
              )}
            </div>
          </div>

          {/* Coach Notes */}
          {coachNotes && (
            <div className="mx-4 mt-6">
              <div className="backdrop-blur-xl bg-card border border-primary/20 rounded-xl p-4">
                <p className="text-primary text-xs font-medium mb-1">Koç Notu</p>
                <p className="text-muted-foreground text-sm">{coachNotes}</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BloodworkDetailModal;
