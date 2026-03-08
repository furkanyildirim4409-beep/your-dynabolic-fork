import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ZoomIn, ZoomOut, Hand, Maximize2, Activity, ChevronDown } from "lucide-react";

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
  const handleReset = useCallback(() => { setZoom(1); setRotation(0); setSelectedMuscle(null); }, []);
  const handleRotate = useCallback(() => setRotation((r) => r + 45), []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "recovered": return "text-green-400 bg-green-400/20";
      case "fatigued": return "text-yellow-400 bg-yellow-400/20";
      case "sore": return "text-red-400 bg-red-400/20";
      default: return "text-muted-foreground bg-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "recovered": return "Toparlandı";
      case "fatigued": return "Yorgun";
      case "sore": return "Ağrılı";
      default: return status;
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Dijital İkiz</h3>
      </div>

      <div
        ref={containerRef}
        className="relative backdrop-blur-xl bg-card border border-border rounded-2xl overflow-hidden"
        style={{ minHeight: 360 }}
        onClick={() => setShowGestureHint(false)}
      >
        {/* Body Visualization */}
        <div className="relative flex items-center justify-center py-8" style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: "transform 0.3s ease" }}>
          <svg viewBox="0 0 200 400" className="w-40 h-80">
            {/* Head */}
            <circle cx="100" cy="40" r="25" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" />
            {/* Torso */}
            <rect x="65" y="65" width="70" height="100" rx="10" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" />
            {/* Chest overlay */}
            <motion.rect
              x="70" y="70" width="60" height="40" rx="8"
              className="cursor-pointer"
              fill={selectedMuscle?.id === "chest" ? "hsl(68 100% 50% / 0.3)" : muscleGroups[0].status === "fatigued" ? "hsl(45 100% 50% / 0.15)" : "transparent"}
              stroke={selectedMuscle?.id === "chest" ? "hsl(68 100% 50%)" : "transparent"}
              strokeWidth="2"
              whileHover={{ fill: "hsl(68 100% 50% / 0.2)" }}
              onClick={() => setSelectedMuscle(muscleGroups[0])}
            />
            {/* Back area */}
            <motion.rect
              x="70" y="110" width="60" height="30" rx="5"
              className="cursor-pointer"
              fill={selectedMuscle?.id === "back" ? "hsl(68 100% 50% / 0.3)" : muscleGroups[1].status === "fatigued" ? "hsl(45 100% 50% / 0.15)" : "transparent"}
              stroke={selectedMuscle?.id === "back" ? "hsl(68 100% 50%)" : "transparent"}
              strokeWidth="2"
              whileHover={{ fill: "hsl(68 100% 50% / 0.2)" }}
              onClick={() => setSelectedMuscle(muscleGroups[1])}
            />
            {/* Arms */}
            <motion.rect x="35" y="70" width="25" height="80" rx="10" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1"
              className="cursor-pointer"
              onClick={() => setSelectedMuscle(muscleGroups[3])}
            />
            <motion.rect x="140" y="70" width="25" height="80" rx="10" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1"
              className="cursor-pointer"
              onClick={() => setSelectedMuscle(muscleGroups[3])}
            />
            {/* Shoulders */}
            <motion.circle cx="67" cy="72" r="12" fill={muscleGroups[2].recoveryPercent > 80 ? "hsl(142 71% 45% / 0.2)" : "hsl(45 100% 50% / 0.15)"}
              className="cursor-pointer" onClick={() => setSelectedMuscle(muscleGroups[2])}
            />
            <motion.circle cx="133" cy="72" r="12" fill={muscleGroups[2].recoveryPercent > 80 ? "hsl(142 71% 45% / 0.2)" : "hsl(45 100% 50% / 0.15)"}
              className="cursor-pointer" onClick={() => setSelectedMuscle(muscleGroups[2])}
            />
            {/* Legs */}
            <motion.rect x="65" y="170" width="30" height="110" rx="12" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1"
              className="cursor-pointer" onClick={() => setSelectedMuscle(muscleGroups[4])}
            />
            <motion.rect x="105" y="170" width="30" height="110" rx="12" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1"
              className="cursor-pointer" onClick={() => setSelectedMuscle(muscleGroups[4])}
            />
            {/* Core */}
            <motion.rect x="75" y="140" width="50" height="25" rx="5"
              fill={muscleGroups[5].recoveryPercent > 80 ? "hsl(142 71% 45% / 0.15)" : "hsl(45 100% 50% / 0.15)"}
              className="cursor-pointer" onClick={() => setSelectedMuscle(muscleGroups[5])}
            />
            {/* Feet */}
            <ellipse cx="80" cy="290" rx="15" ry="8" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" />
            <ellipse cx="120" cy="290" rx="15" ry="8" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" />
          </svg>
        </div>

        {/* Controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleZoomIn} className="p-2 rounded-lg bg-secondary/80 backdrop-blur-sm border border-border">
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleZoomOut} className="p-2 rounded-lg bg-secondary/80 backdrop-blur-sm border border-border">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleRotate} className="p-2 rounded-lg bg-secondary/80 backdrop-blur-sm border border-border">
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleReset} className="p-2 rounded-lg bg-secondary/80 backdrop-blur-sm border border-border">
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </div>

        {/* Gesture Hint */}
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

      {/* Muscle Detail Panel */}
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
                      selectedMuscle.recoveryPercent > 80 ? "bg-green-500" :
                      selectedMuscle.recoveryPercent > 50 ? "bg-yellow-500" : "bg-red-500"
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Legend */}
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
