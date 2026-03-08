export interface Supplement { id: string; name: string; dosage: string; timing: string; servingsLeft: number; totalServings: number; takenToday: boolean; icon: string; }
const SupplementTracker = ({ supplements, onToggle }: { supplements: Supplement[]; onToggle?: (id: string) => void }) => (
  <div className="space-y-2">{supplements.map(s => (<div key={s.id} className="glass-card p-3 flex items-center gap-3"><span className="text-xl">{s.icon}</span><div className="flex-1"><p className="text-foreground text-sm">{s.name}</p><p className="text-muted-foreground text-xs">{s.dosage} • {s.timing}</p></div><span className={`text-xs px-2 py-0.5 rounded-full ${s.takenToday ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>{s.takenToday ? "✓" : "Bekliyor"}</span></div>))}</div>
);
export default SupplementTracker;
