import { motion } from "framer-motion";
import { Swords, Clock, Trophy, Check, X, Flame, Dumbbell, Calendar, Coins } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Challenge, 
  getChallengeTypeLabel,
  getStatusLabel,
  getStatusColor 
} from "@/lib/challengeData";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";
import { useChallengeStreaks } from "@/hooks/useChallengeStreaks";

interface ChallengeCardProps {
  challenge: Challenge;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onViewDetails?: (challenge: Challenge) => void;
}

const ChallengeCard = ({ challenge, onAccept, onDecline, onViewDetails }: ChallengeCardProps) => {
  const { calculateBonus, streakData } = useChallengeStreaks();
  
  const isIncoming = challenge.challengedId === "current" && challenge.status === "pending";
  const isActive = challenge.status === "active";
  const isCompleted = challenge.status === "completed";
  const isWinner = isCompleted && challenge.winnerId === "current";
  const isLoser = isCompleted && challenge.winnerId !== "current";
  
  // Calculate potential bonus
  const potentialBonus = calculateBonus(challenge.bioCoinsReward, streakData.currentWinStreak + 1);
  const hasBonus = potentialBonus.multiplier > 1;
  
  // Determine opponent (the other person in the challenge)
  const isChallenger = challenge.challengerId === "current";
  const opponent = isChallenger 
    ? { name: challenge.challengedName, avatar: challenge.challengedAvatar, value: challenge.challengedValue }
    : { name: challenge.challengerName, avatar: challenge.challengerAvatar, value: challenge.challengerValue };

  const yourValue = isChallenger ? challenge.challengerValue : (challenge.challengedValue || 0);

  // Calculate days remaining
  const daysRemaining = Math.max(0, Math.ceil(
    (new Date(challenge.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
  };

  const handleAccept = () => {
    hapticSuccess();
    onAccept?.(challenge.id);
  };

  const handleDecline = () => {
    hapticMedium();
    onDecline?.(challenge.id);
  };

  // Border color based on status
  const getBorderColor = () => {
    if (isWinner) return "border-l-emerald-500";
    if (isLoser) return "border-l-red-500";
    if (isActive) return "border-l-primary";
    if (isIncoming) return "border-l-yellow-500";
    return "border-l-muted-foreground/30";
  };

  // Result icon and color
  const getResultDisplay = () => {
    if (isWinner) {
      return { icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/20", label: "Kazandın" };
    }
    if (isLoser) {
      return { icon: X, color: "text-red-400", bg: "bg-red-500/20", label: "Kaybettin" };
    }
    if (isActive) {
      return { icon: Swords, color: "text-primary", bg: "bg-primary/20", label: "Aktif" };
    }
    if (isIncoming) {
      return { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Bekliyor" };
    }
    return { icon: Swords, color: "text-muted-foreground", bg: "bg-secondary", label: "Gönderildi" };
  };

  const result = getResultDisplay();
  const ResultIcon = result.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => { hapticLight(); onViewDetails?.(challenge); }}
      className={`glass-card p-3 cursor-pointer border-l-2 ${getBorderColor()} relative`}
    >
      <div className="flex items-center gap-3">
        {/* Result Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${result.bg}`}>
          <ResultIcon className={`w-5 h-5 ${result.color}`} />
        </div>

        {/* Challenge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${result.color}`}>
              {result.label}
            </span>
            <span className="text-muted-foreground text-xs">vs</span>
            <span className="text-foreground text-sm truncate">
              {opponent.name.split(" ")[0]}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
            {challenge.type === "pr" ? (
              <span className="flex items-center gap-1">
                <Dumbbell className="w-3 h-3" />
                {challenge.exercise || "PR Challenge"}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Flame className="w-3 h-3" />
                Antrenman Serisi
              </span>
            )}
            <span>•</span>
            {isCompleted ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(challenge.deadline)}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {daysRemaining} gün kaldı
              </span>
            )}
          </div>
        </div>

        {/* Score / Reward */}
        <div className="text-right shrink-0">
          {isCompleted ? (
            <>
              <div className="flex items-center gap-1 justify-end">
                <span className={`font-display text-sm ${isWinner ? "text-emerald-400" : "text-red-400"}`}>
                  {yourValue}{challenge.type === "pr" ? "kg" : ""}
                </span>
                <span className="text-muted-foreground text-xs">-</span>
                <span className="text-muted-foreground text-sm">
                  {opponent.value || challenge.targetValue}{challenge.type === "pr" ? "kg" : ""}
                </span>
              </div>
              {isWinner && (
                <span className="text-yellow-400 text-[10px]">
                  +{challenge.bioCoinsReward} coin
                </span>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-1 justify-end text-yellow-400">
                <Trophy className="w-3 h-3" />
                <span className="font-display text-sm">{challenge.bioCoinsReward}</span>
              </div>
              {hasBonus && (
                <span className="flex items-center gap-0.5 justify-end text-emerald-400 text-[10px]">
                  <Coins className="w-2.5 h-2.5" />
                  +{potentialBonus.bonus} bonus
                </span>
              )}
            </>
          )}
        </div>

        {/* Opponent Avatar */}
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarImage src={opponent.avatar} className="object-cover" />
          <AvatarFallback className="bg-secondary text-xs">
            {opponent.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Action Buttons for Incoming Challenges */}
      {isIncoming && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); handleDecline(); }}
            className="flex-1 h-8 border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <X className="w-3 h-3 mr-1" />
            Reddet
          </Button>
          <Button
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleAccept(); }}
            className="flex-1 h-8 bg-primary hover:bg-primary/90"
          >
            <Check className="w-3 h-3 mr-1" />
            Kabul Et
          </Button>
        </div>
      )}

      {/* Active Challenge Progress */}
      {isActive && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Hedef: {challenge.targetValue}{challenge.type === "pr" ? "kg" : " gün"}</span>
            <span className="text-primary font-medium">
              {yourValue}/{challenge.targetValue}
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (yourValue / challenge.targetValue) * 100)}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ChallengeCard;