// Stub components - these will be fully implemented in the next iteration
export const WorkoutCard = ({ title, day, exercises, duration, intensity, coachNote, onStart }: any) => (
  <button onClick={onStart} className="w-full glass-card p-4 text-left hover:bg-white/5 transition-colors">
    <div className="flex items-center justify-between mb-2"><span className="text-primary text-xs font-display">{day}</span><span className={`text-xs px-2 py-0.5 rounded-full ${intensity === "Yüksek" ? "bg-red-500/20 text-red-400" : intensity === "Orta" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>{intensity}</span></div>
    <h3 className="font-display text-sm text-foreground mb-1">{title}</h3>
    <p className="text-muted-foreground text-xs">{exercises} hareket • {duration}</p>
    {coachNote && <p className="text-muted-foreground text-[10px] mt-2 italic">💬 {coachNote}</p>}
  </button>
);
export default WorkoutCard;
