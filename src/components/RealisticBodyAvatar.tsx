const RealisticBodyAvatar = ({ waistScale }: { waistScale: number }) => (
  <div className="h-64 flex items-center justify-center bg-secondary/20 rounded-xl"><div className="text-center"><div className="text-6xl mb-2">🧍</div><p className="text-muted-foreground text-xs">3D Avatar (Demo)</p><p className="text-primary text-xs">Bel Oranı: {waistScale.toFixed(2)}</p></div></div>
);
export default RealisticBodyAvatar;
