import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ZoomIn, ZoomOut, Hand, Maximize2, Activity } from "lucide-react";

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

const DigitalTwinAvatar = () => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [showGestureHint, setShowGestureHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.2, 2)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.2, 0.6)), []);
  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setSelectedMuscle(null);
  }, []);
  const handleRotate = useCallback(() => setRotation((r) => r + 45), []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "recovered":
        return "text-green-400 bg-green-400/20";
      case "fatigued":
        return "text-yellow-400 bg-yellow-400/20";
      case "sore":
        return "text-red-400 bg-red-400/20";
      default:
        return "text-muted-foreground bg-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "recovered":
        return "Toparlandı";
      case "fatigued":
        return "Yorgun";
      case "sore":
        return "Ağrılı";
      default:
        return status;
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
          Dijital İkiz (Özel Beden Profilin)
        </h3>
      </div>

      <div
        ref={containerRef}
        className="relative backdrop-blur-xl bg-card border border-border rounded-2xl overflow-hidden"
        style={{ minHeight: 360 }}
        onClick={() => setShowGestureHint(false)}
      >
        <div
          className="relative flex items-center justify-center py-8"
          style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: "transform 0.3s ease" }}
        >
          <svg viewBox="0 0 200 400" className="w-40 h-80">
            {/* Head - Yüz oranlarına uyumlu hafif geniş profil */}
            <circle cx="100" cy="40" r="25" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" />

            {/* Torso - Daha geniş sırt, beli çevreleyen hacim ve kalın yapı analiz edilerek güncellendi (Genişletildi ve eğimlendi) */}
            <path
              d="M 60,65 L 140,65 Q 155,115 146,170 L 54,170 Q 45,115 60,65 Z"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />

            {/* Chest - Daha belirgin göğüs hattı */}
            <motion.rect
              x="508"
              y="700"
              width="150"
              height="90"
              rx="20"
              className="cursor-pointer"
              fill={
                selectedMuscle?.id === "chest"
                  ? "hsl(68 100% 50% / 0.3)"
                  : muscleGroups[0].status === "fatigued"
                    ? "hsl(45 100% 50% / 0.15)"
                    : "transparent"
              }
              stroke={selectedMuscle?.id === "chest" ? "hsl(68 100% 50%)" : "transparent"}
              strokeWidth="2"
              whileHover={{ fill: "hsl(68 100% 50% / 0.2)" }}
              onClick={() => setSelectedMuscle(muscleGroups[0])}
            />

            {/* Back area */}
            <motion.rect
              x="57"
              y="115"
              width="86"
              height="35"
              rx="8"
              className="cursor-pointer"
              fill={
                selectedMuscle?.id === "back"
                  ? "hsl(68 100% 50% / 0.3)"
                  : muscleGroups[1].status === "fatigued"
                    ? "hsl(45 100% 50% / 0.15)"
                    : "transparent"
              }
              stroke={selectedMuscle?.id === "back" ? "hsl(68 100% 50%)" : "transparent"}
              strokeWidth="2"
              whileHover={{ fill: "hsl(68 100% 50% / 0.2)" }}
              onClick={() => setSelectedMuscle(muscleGroups[1])}
            />

            {/* Arms - Daha etli / kalın ve vücuttan bir tık ayrık yapılı kollar */}
            <motion.rect
              x="20"
              y="70"
              width="34"
              height="85"
              rx="15"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              className="cursor-pointer"
              onClick={() => setSelectedMuscle(muscleGroups[3])}
            />
            <motion.rect
              x="146"
              y="70"
              width="34"
              height="85"
              rx="15"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              className="cursor-pointer"
              onClick={() => setSelectedMuscle(muscleGroups[3])}
            />

            {/* Shoulders - Düşük, kalın ama hafif omuz başları */}
            <motion.circle
              cx="48"
              cy="72"
              r="16"
              fill={muscleGroups[2].recoveryPercent > 80 ? "hsl(142 71% 45% / 0.2)" : "hsl(45 100% 50% / 0.15)"}
              className="cursor-pointer"
              onClick={() => setSelectedMuscle(muscleGroups[2])}
            />
            <motion.circle
              cx="152"
              cy="72"
              r="16"
              fill={muscleGroups[2].recoveryPercent > 80 ? "hsl(142 71% 45% / 0.2)" : "hsl(45 100% 50% / 0.15)"}
              className="cursor-pointer"
              onClick={() => setSelectedMuscle(muscleGroups[2])}
            />

            {/* Legs - Üst bacaktaki kalınlığı hesaba katan genişlik */}
            <motion.rect
              x="54"
              y="170"
              width="44"
              height="110"
              rx="14"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              className="cursor-pointer"
              onClick={() => setSelectedMuscle(muscleGroups[4])}
            />
            <motion.rect
              x="102"
              y="170"
              width="44"
              height="110"
              rx="14"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
              className="cursor-pointer"
              onClick={() => setSelectedMuscle(muscleGroups[4])}
            />

            {/* Core (Karın Bölgesi) - Love handle kısımlarına uyum sağlayan ve profilden öne doğru çıkan alan taranması */}
            <motion.path
              d="M 55,145 L 145,145 C 145,175 55,175 55,145 Z"
              fill={muscleGroups[5].recoveryPercent > 80 ? "hsl(142 71% 45% / 0.15)" : "hsl(45 100% 50% / 0.15)"}
              className="cursor-pointer hover:opacity-50"
              onClick={() => setSelectedMuscle(muscleGroups[5])}
            />

            {/* Feet */}
            <ellipse
              cx="76"
              cy="290"
              rx="16"
              ry="9"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
            <ellipse
              cx="124"
              cy="290"
              rx="16"
              ry="9"
              fill="hsl(var(--secondary))"
              stroke="hsl(var(--border))"
              strokeWidth="1"
            />
          </svg>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-secondary/80 backdrop-blur-sm border border-border"
          >
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-secondary/80 backdrop-blur-sm border border-border"
          >
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRotate}
            className="p-2 rounded-lg bg-secondary/80 backdrop-blur-sm border border-border"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleReset}
            className="p-2 rounded-lg bg-secondary/80 backdrop-blur-sm border border-border"
          >
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>

        <AnimatePresence>
          {showGestureHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 backdrop-blur-sm"
            >
              <Hand className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Kas grubuna dokun</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedMuscle && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            className="mt-3 backdrop-blur-xl bg-card border border-border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-foreground font-medium">{selectedMuscle.name}</h4>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedMuscle.status)}`}>
                {getStatusLabel(selectedMuscle.status)}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Son Antrenman</span>
                <span className="text-foreground">{selectedMuscle.lastTrained}</span>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Toparlanma</span>
                  <span className="text-foreground">%{selectedMuscle.recoveryPercent}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedMuscle.recoveryPercent}%` }}
                    className={`h-full rounded-full ${
                      selectedMuscle.recoveryPercent > 80
                        ? "bg-green-500"
                        : selectedMuscle.recoveryPercent > 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-4 mt-3">
        {[
          { color: "bg-green-400", label: "Hazır" },
          { color: "bg-yellow-400", label: "Yorgun" },
          { color: "bg-red-400", label: "Ağrılı" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-[10px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DigitalTwinAvatar;
