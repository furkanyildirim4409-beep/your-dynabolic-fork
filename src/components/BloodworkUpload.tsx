import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplet, Plus, FileText, Image, CheckCircle2, Clock, AlertTriangle, ChevronDown, Upload, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { bloodworkReports } from "@/lib/mockData";
import type { BloodworkReport, BloodworkStatus } from "@/types/shared-models";
import { Progress } from "@/components/ui/progress";
import BloodworkDetailModal from "@/components/BloodworkDetailModal";

const statusConfig: Record<BloodworkStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  analyzed: { label: "Analiz Edildi", className: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  pending: { label: "Bekliyor", className: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  requires_attention: { label: "Dikkat Gerekli", className: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertTriangle },
};

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

interface BloodworkUploadProps { className?: string; disabled?: boolean; }

const BloodworkUpload = ({ className, disabled = false }: BloodworkUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<BloodworkReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) { toast({ title: "Geçersiz Dosya Türü", description: "Lütfen PDF veya resim dosyası yükleyin.", variant: "destructive" }); return; }
    setIsUploading(true); setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsUploading(false); toast({ title: "Yükleme Başarılı ✅", description: "Kan tahlili koçunuza gönderildi." }); return 0; }
        return prev + 10;
      });
    }, 200);
  };

  const toggleExpand = (reportId: string) => setExpandedReport(expandedReport === reportId ? null : reportId);
  const handleViewDetails = (report: BloodworkReport) => { if (report.status === "analyzed") { setSelectedReport(report); setShowDetailModal(true); } };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Droplet className="w-5 h-5 text-red-400" /><h2 className="font-semibold text-lg text-foreground tracking-tight">KAN TAHLİLİ</h2></div>
        <motion.button whileHover={disabled ? {} : { scale: 1.05 }} whileTap={disabled ? {} : { scale: 0.95 }} onClick={disabled ? undefined : () => fileInputRef.current?.click()} disabled={disabled}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${disabled ? "bg-secondary text-muted-foreground cursor-not-allowed opacity-50" : "bg-primary/20 text-primary hover:bg-primary/30"}`}>
          <Plus className="w-4 h-4" />YÜKLE
        </motion.button>
        <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleFileSelect} className="hidden" />
      </div>

      <AnimatePresence>
        {isUploading && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-4 glass-card border border-primary/30">
            <div className="flex items-center gap-3 mb-3"><Upload className="w-5 h-5 text-primary animate-pulse" /><span className="text-sm text-foreground">Yükleniyor...</span><span className="text-sm text-primary ml-auto">{uploadProgress}%</span></div>
            <Progress value={uploadProgress} className="h-2 bg-secondary" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {bloodworkReports.map((report, index) => {
          const status = statusConfig[report.status];
          const StatusIcon = status.icon;
          const isExpanded = expandedReport === report.id;
          const FileIcon = report.fileType === "pdf" ? FileText : Image;
          return (
            <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass-card overflow-hidden">
              <button onClick={() => toggleExpand(report.id)} className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0"><FileIcon className="w-5 h-5 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{report.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{formatDate(report.uploadDate)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1 ${status.className}`}><StatusIcon className="w-3 h-3" />{status.label}</span>
                  </div>
                  {report.flaggedValues && report.flaggedValues.length > 0 && (
                    <div className="flex items-center gap-1 mt-2"><AlertTriangle className="w-3 h-3 text-amber-400" /><span className="text-xs text-amber-400">{report.flaggedValues.join(", ")} düşük</span></div>
                  )}
                </div>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-5 h-5 text-muted-foreground" /></motion.div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t border-white/10">
                    <div className="p-4 space-y-3">
                      {report.analysisDate && <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Analiz Tarihi</span><span className="text-foreground">{formatDate(report.analysisDate)}</span></div>}
                      {report.coachNotes && <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl"><p className="text-xs text-muted-foreground mb-1">Koç Notu</p><p className="text-sm text-foreground">{report.coachNotes}</p></div>}
                      {report.status === "pending" && <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"><p className="text-sm text-amber-400">Koçunuz tahlil sonuçlarınızı inceliyor.</p></div>}
                      {report.status === "analyzed" && (
                        <motion.button whileTap={{ scale: 0.98 }} onClick={e => { e.stopPropagation(); handleViewDetails(report); }}
                          className="w-full flex items-center justify-center gap-2 p-3 bg-primary/20 text-primary rounded-xl text-sm font-medium hover:bg-primary/30 transition-colors">
                          <Eye className="w-4 h-4" />DETAYLARI GÖR
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {bloodworkReports.length === 0 && (
          <div className="text-center py-8"><Droplet className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" /><p className="text-muted-foreground text-sm">Henüz kan tahlili yüklenmemiş.</p></div>
        )}
      </div>

      <BloodworkDetailModal report={selectedReport} isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedReport(null); }} />
    </div>
  );
};

export default BloodworkUpload;
