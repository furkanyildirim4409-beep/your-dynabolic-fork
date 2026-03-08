import { Coins } from "lucide-react";
const BioCoinWallet = ({ balance, showLabel }: { balance: number; showLabel?: boolean }) => (
  <div className="flex items-center gap-2 bg-primary/20 px-3 py-1.5 rounded-full border border-primary/30">
    <Coins className="w-4 h-4 text-primary" />
    <span className="font-display text-sm text-primary">{balance.toLocaleString()}</span>
    {showLabel && <span className="text-xs text-muted-foreground">BIO</span>}
  </div>
);
export default BioCoinWallet;
