// Stub components for Kokpit page dependencies
const PerformanceRing = ({ score, label, sublabel }: any) => <div className="glass-card p-6 text-center"><div className="text-4xl font-bold text-primary">{score}</div><p className="text-foreground text-sm mt-2">{label}</p><p className="text-muted-foreground text-xs">{sublabel}</p></div>;
export default PerformanceRing;