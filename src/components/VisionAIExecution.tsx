const VisionAIExecution = ({ workoutTitle, onClose }: { workoutTitle: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-4">
    <h2 className="font-display text-xl text-foreground mb-4">{workoutTitle}</h2>
    <p className="text-muted-foreground text-sm mb-8">Vision AI Antrenman Modu (Demo)</p>
    <button onClick={onClose} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-display">KAPAT</button>
  </div>
);
export default VisionAIExecution;
