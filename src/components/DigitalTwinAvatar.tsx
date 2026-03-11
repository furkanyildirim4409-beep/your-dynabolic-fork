import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Hand,
  Maximize2,
  Activity,
  Fingerprint,
  Crosshair,
  ChevronRight,
} from "lucide-react";

interface MuscleGroup {
  id: string;
  name: string;
  status: "recovered" | "fatigued" | "sore";
  lastTrained: string;
  recoveryPercent: number;
}

const muscleGroups: MuscleGroup[] = [
  { id: "chest", name: "Göğüs", status: "fatigued", lastTrained: "Bugün", recoveryPercent: 35 },
  { id: "back", name: "Sırt", status: "fatigued", lastTrained: "Bugün", recoveryPercent: 40 },
  { id: "shoulders", name: "Omuzlar", status: "recovered", lastTrained: "3 gün önce", recoveryPercent: 95 },
  { id: "arms", name: "Kollar", status: "sore", lastTrained: "Dün", recoveryPercent: 55 },
  { id: "legs", name: "Bacaklar", status: "recovered", lastTrained: "4 gün önce", recoveryPercent: 100 },
  { id: "core", name: "Core", status: "recovered", lastTrained: "2 gün önce", recoveryPercent: 85 },
];

// Gönderilen Görsellere göre çıkarılmış Vektör Düğüm (Poly) Koordinatları ve Organik Kıvrımlar.
// Özellik: Bel bölgesindeki kalınlık dışa dönük hesaplandı (simit bölgesi Q kavisi, Yandan poz Analizi). Geniş göğüs. Kalın/Ağır kol yapısı.
const organicPaths: Record<string, string> = {
  chest: "M 65 80 Q 100 85 135 80 L 140 105 Q 100 125 60 105 Z", // Geniş yatay ama pektoral çizgi dışa vurumlu.
  core: "M 60 105 Q 100 125 140 105 L 148 160 Q 155 185 140 210 L 100 215 L 60 210 Q 45 185 52 160 Z", // Yan bel(Lovehandle) bölgesindeki bombeleşen yapıyı mapleyen özel yapıtaşı (Q: 155/45 Dış hat)
  back: "M 65 80 Q 25 105 52 160 Q 75 125 60 105 Z M 135 80 Q 175 105 148 160 Q 125 125 140 105 Z", // Göğsün arkasından/koltuk altından öne fırlayan latlar (Geniş Sırt profili sebebiyle ön viewda lats belirgin).
  shoulders: "M 65 80 Q 30 70 30 105 Q 40 120 50 115 Z M 135 80 Q 170 70 170 105 Q 160 120 150 115 Z", // Traplezin ense kısmından kol başına bağlanma açısı. Düşük ancak iri bir hacme oturan dizayn.
  arms: "M 32 108 Q 15 145 35 225 Q 48 235 55 220 Q 52 185 52 160 Z M 168 108 Q 185 145 165 225 Q 152 235 145 220 Q 148 185 148 160 Z", // İçten dolgun ve bükümsüz aşağı kalınlaşan yapı kol tespiti.
  legs: "M 60 210 Q 45 230 40 310 Q 38 375 60 380 Q 75 375 70 310 Q 75 250 100 215 Z M 140 210 Q 155 230 160 310 Q 162 375 140 380 Q 125 375 130 310 Q 125 250 100 215 Z", // Kalın üstdüz ve kasık mesafesinin doldurucu kalıbı (sağlam ve kısa tabanlı).
};

const DigitalTwinAvatar = () => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [showGestureHint, setShowGestureHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intro animasyon tetiklemesi
  const [isScanned, setIsScanned] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setIsScanned(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.2, 2.5)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.2, 0.7)), []);
  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setSelectedMuscle(null);
  }, []);
  const handleRotate = useCallback(() => setRotation((r) => r + 45), []);

  const getStatusFill = (status: string, alpha: number) => {
    switch (status) {
      case "recovered":
        return `hsl(142 71% 45% / ${alpha})`;
      case "fatigued":
        return `hsl(45 100% 50% / ${alpha})`;
      case "sore":
        return `hsl(0 100% 50% / ${alpha})`;
      default:
        return `hsl(var(--secondary))`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "recovered":
        return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "fatigued":
        return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "sore":
        return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default:
        return "text-muted-foreground bg-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "recovered":
        return "Kullanıma Hazır";
      case "fatigued":
        return "Metabolik Yorgunluk";
      case "sore":
        return "Fasya Zedelenmesi (Ağrı)";
      default:
        return status;
    }
  };

  return (
    <div className="relative font-sans text-sm selection:bg-cyan-500/30">
      {/* HUD Header Başlığı (Diagnostics Hissi Verildi) */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <Fingerprint className="w-5 h-5 text-cyan-400 animate-pulse" />
        <div>
          <h3 className="text-xs text-cyan-300 font-bold uppercase tracking-[0.2em]">Bio-Vektörel Model Sistemi</h3>
          <p className="text-[10px] text-muted-foreground uppercase">Holo-Görüntü 3 Açılı Analiz Devrede</p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative bg-black/95 bg-[linear-gradient(rgba(20,50,60,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,50,60,0.1)_1px,transparent_1px)] bg-[size:20px_20px] border border-cyan-500/20 shadow-[0_0_20px_rgba(0,255,255,0.05)] rounded-2xl overflow-hidden cursor-crosshair group"
        style={{ minHeight: 450 }}
        onClick={() => setShowGestureHint(false)}
      >
        {/* Holografik Scanner Tarayıcı Katmanı (Top-down beam) */}
        {!isScanned && (
          <motion.div
            initial={{ top: "-10%", opacity: 1 }}
            animate={{ top: "110%", opacity: 0 }}
            transition={{ duration: 1.5, ease: "linear" }}
            className="absolute left-0 w-full h-[3px] bg-cyan-400 shadow-[0_5px_30px_#22d3ee] z-20"
          />
        )}

        {/* Gösterge - Sabit Teşhis Yazıları / Image Çıkarım İstatistikleri */}
        <div className="absolute inset-y-8 right-2 lg:right-4 left-4 z-0 pointer-events-none flex flex-col justify-between opacity-40">
          <div className="flex items-start text-cyan-300 gap-1.5">
            <Crosshair className="w-3 h-3" />
            <span className="text-[9px] uppercase leading-tight font-medium max-w-[80px]">
              Simit Hacmi + / Orta Kesim Tespiti Aktif
            </span>
          </div>
          <div className="flex justify-end pr-2 text-cyan-300 gap-1.5 mt-20">
            <Crosshair className="w-3 h-3" />
            <span className="text-[9px] uppercase leading-tight font-medium max-w-[90px] text-right">
              Geniş Toraks, Ağır Alt Ekstremiteler
            </span>
          </div>
          <div className="flex items-start pb-8 text-cyan-300 gap-1.5">
            <Crosshair className="w-3 h-3" />
            <span className="text-[9px] uppercase leading-tight font-medium">Biyometrik Merkez İstikrarlı</span>
          </div>
        </div>

        {/* SVG Mesh Vector Katmanı - Doğrudan Fotoğraftan modellenen Koordinat Çıkarımları ile*/}
        <div
          className="relative flex items-center justify-center py-6 h-full"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: "transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)",
          }}
        >
          <svg
            viewBox="0 0 200 400"
            className="w-[140px] md:w-48 lg:w-56 overflow-visible filter drop-shadow-[0_0_8px_rgba(0,180,255,0.1)]"
          >
            <defs>
              <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* BASE EKRAN MODELİ - Arkada Cılız Geometri Doldurucu Kafatası / Boyun Alanı */}
            <path
              d="M 85 20 C 85 5 115 5 115 20 Q 115 45 110 55 L 105 80 L 95 80 L 90 55 Z"
              fill="#152125"
              stroke="rgba(34,211,238,0.3)"
              strokeWidth="0.8"
            />
            <ellipse
              cx="100"
              cy="38"
              rx="14"
              ry="22"
              fill="#0d1417"
              stroke="rgba(34,211,238,0.4)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
            {/* Kulaklar veya yan maske yansıma simülasyonları */}
            <line
              x1="100"
              y1="65"
              x2="100"
              y2="350"
              stroke="rgba(34,211,238,0.1)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />

            {/* FOTOGRAFTAN MODELLENMİŞ DINAMIK ORGANIK PATHTLER YÜKLENİYOR... */}
            <AnimatePresence>
              {muscleGroups.map((group) => {
                const isSelected = selectedMuscle?.id === group.id;
                return (
                  <motion.path
                    key={group.id}
                    d={organicPaths[group.id]}
                    // Scan Çıkış Efekti Yaratıyor
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                    className="cursor-pointer transition-colors duration-300 hover:opacity-100"
                    fill={
                      isSelected
                        ? getStatusFill(group.status, 0.4) // Seçili olan full parlar
                        : group.recoveryPercent > 80
                          ? "transparent" // Toparlanmış alan holografik saydam görünür
                          : getStatusFill(group.status, 0.2) // Toparlanmamış olan iç rengini korur (analize dayalı glow)
                    }
                    stroke={
                      isSelected
                        ? getStatusFill(group.status, 1)
                        : group.status !== "recovered"
                          ? getStatusFill(group.status, 0.5)
                          : "rgba(34, 211, 238, 0.3)" // Neon Tech Cyan Stroke!
                    }
                    strokeWidth={isSelected ? "1.5" : "1"}
                    filter={isSelected ? "url(#neon-glow)" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMuscle(group);
                    }}
                    whileHover={{ scale: 1.02, filter: "url(#neon-glow)", transformOrigin: "center center" }}
                  />
                );
              })}
            </AnimatePresence>
          </svg>
        </div>

        {/* Kontroller Konsolu Sağ Üst - Tamamı Borderless Transparan Hack Terminal Tarzı */}
        <div className="absolute top-4 right-3 flex flex-col gap-2 z-10">
          {[
            { id: "z-in", icon: <ZoomIn className="w-3.5 h-3.5" />, act: handleZoomIn },
            { id: "z-out", icon: <ZoomOut className="w-3.5 h-3.5" />, act: handleZoomOut },
            { id: "rot", icon: <RotateCcw className="w-3.5 h-3.5" />, act: handleRotate },
            { id: "reset", icon: <Maximize2 className="w-3.5 h-3.5" />, act: handleReset },
          ].map((btn) => (
            <motion.button
              key={btn.id}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(34, 211, 238, 0.15)" }}
              whileTap={{ scale: 0.9 }}
              onClick={btn.act}
              className="p-2.5 rounded border border-cyan-500/10 bg-slate-900/40 text-cyan-500 backdrop-blur-md transition-all shadow-[0_0_8px_rgba(0,0,0,0.8)]"
            >
              {btn.icon}
            </motion.button>
          ))}
        </div>

        {/* Aksiyon İpuçu (Pulse radar tarzı efekt) */}
        <AnimatePresence>
          {showGestureHint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl"
            >
              <div className="relative">
                <Hand className="w-3.5 h-3.5 text-cyan-400" />
                <span className="absolute inset-0 block rounded-full w-full h-full border border-cyan-400 animate-ping opacity-30" />
              </div>
              <span className="text-[11px] font-semibold text-cyan-200 uppercase tracking-wide">
                Lokal Hasar Bilgisi İçin Kasa Tıklayın
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dinamik Bölge Bilgi/Veri Konsolu Açılır Pencersi */}
      <AnimatePresence>
        {selectedMuscle && (
          <motion.div
            initial={{ opacity: 0, height: 0, rotateX: 20 }}
            animate={{ opacity: 1, height: "auto", rotateX: 0 }}
            exit={{ opacity: 0, height: 0, scale: 0.98 }}
            className="mt-4 overflow-hidden origin-top"
          >
            <div
              className={`p-5 rounded-2xl bg-[#090e11] border ${getStatusColor(selectedMuscle.status).split(" ")[2]} backdrop-blur-3xl shadow-lg relative`}
            >
              <div className="absolute top-0 right-0 w-24 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-screen" />

              <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-3">
                <h4 className="text-xl font-black text-cyan-50 flex items-center gap-2 uppercase tracking-wide">
                  <Activity className={`w-5 h-5 ${getStatusColor(selectedMuscle.status).split(" ")[0]}`} />
                  {selectedMuscle.name}
                </h4>
                <span
                  className={`px-3 py-1 rounded shadow-sm text-xs font-bold tracking-wider ${getStatusColor(selectedMuscle.status)} border backdrop-blur-md uppercase`}
                >
                  {getStatusLabel(selectedMuscle.status)}
                </span>
              </div>

              <div className="space-y-4 pr-1">
                <div className="flex justify-between items-end border-l-2 border-cyan-800 pl-3">
                  <div>
                    <p className="text-[10px] text-cyan-400/60 uppercase font-semibold mb-1 flex items-center">
                      <ChevronRight className="w-3 h-3 inline-block -ml-1" />
                      Log Kaydı: T1 Analizi
                    </p>
                    <span className="text-slate-300 font-medium">
                      Hedeflenmiş Yıkım: <span className="text-white ml-1">{selectedMuscle.lastTrained}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-l-2 border-cyan-800 pl-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    <span>Kas Rejenarasyon Miktarı (ROM+)</span>
                    <span className="text-cyan-50">%{selectedMuscle.recoveryPercent}</span>
                  </div>

                  {/* Animasyonlu Cypher Tarzı İlerleme Çubuğu */}
                  <div className="relative h-3 w-full rounded overflow-hidden bg-black/40 border border-slate-700/50 shadow-inner">
                    {/* Grid Tarama İmajı arka planda (Opsiyonel ince saniye) */}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_2px,rgba(0,0,0,0.5)_2px,rgba(0,0,0,0.5)_4px)] bg-[size:4px_100%] opacity-20 pointer-events-none z-10" />

                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: `-${100 - selectedMuscle.recoveryPercent}%` }}
                      transition={{ duration: 1, ease: "backOut" }}
                      className={`absolute top-0 left-0 w-full h-full border-r-[3px] border-white/60 shadow-[0_0_10px_currentcolor] ${
                        selectedMuscle.recoveryPercent > 80
                          ? "bg-emerald-500 shadow-emerald-500/40"
                          : selectedMuscle.recoveryPercent > 50
                            ? "bg-amber-500 shadow-amber-500/40"
                            : "bg-rose-600 shadow-rose-600/50"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lejant (Dashboard Anahtar Renk Rehberi) Holografik Gösterimi */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-5">
        {[
          { color: "shadow-[0_0_8px_#34d399] bg-emerald-500", label: "Aktif (%100 Onarım)" },
          { color: "shadow-[0_0_8px_#fbbf24] bg-amber-500", label: "Recovery Döngüsünde (Zayıf)" },
          { color: "shadow-[0_0_8px_#e11d48] bg-rose-500", label: "Yoğun İnflamasyon Tespiti (Kapalı)" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5 shadow-inner"
          >
            <div className={`w-2 h-2 rounded-full border border-white/50 ${item.color}`} />
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DigitalTwinAvatar;
