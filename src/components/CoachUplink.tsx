import { motion } from "framer-motion";
import { Wifi, WifiOff, MessageCircle, ChevronRight } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CoachProfile } from "@/hooks/useCoachProfile";

interface CoachUplinkProps {
  coach: CoachProfile | null | undefined;
  isLoading?: boolean;
  onChatOpen?: () => void;
  onProfileClick?: () => void;
}

const CoachUplink = ({ coach, isLoading, onChatOpen, onProfileClick }: CoachUplinkProps) => {
  const isOnline = true;
  const lastSeen = "Şimdi aktif";
  const unreadMessages = 2;

  const coachName = coach?.full_name || "Koç";
  const coachInitials = coachName.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center gap-3">
        {/* Hexagon Avatar */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onProfileClick}
          className="relative flex-shrink-0"
        >
          <div className="w-14 h-14 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/20 rounded-xl rotate-45 transform" />
            <div className="absolute inset-1 bg-card rounded-lg rotate-45 transform overflow-hidden">
              <Avatar className="w-full h-full -rotate-45">
                <AvatarImage src={coach?.avatar_url || ""} alt={coachName} className="object-cover" />
                <AvatarFallback className="bg-secondary text-foreground text-xs -rotate-45">{coachInitials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          {/* Status indicator */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${isOnline ? "bg-green-500" : "bg-muted-foreground"}`} />
        </motion.button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-foreground text-sm font-medium truncate">{coachName}</p>
            {isOnline ? (
              <Wifi className="w-3 h-3 text-green-400 flex-shrink-0" />
            ) : (
              <WifiOff className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className="text-muted-foreground text-xs">{lastSeen}</p>
          {coach?.specialty && (
            <p className="text-muted-foreground text-xs truncate">{coach.specialty}</p>
          )}
        </div>

        {/* Chat Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onChatOpen}
          className="relative p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-primary" />
          {unreadMessages > 0 && (
            <div className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-destructive flex items-center justify-center">
              <span className="text-[9px] font-bold text-destructive-foreground">{unreadMessages}</span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Quick Info Bar */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
        <div className="flex-1 text-center">
          {coach?.gym_name && (
            <>
              <p className="text-primary text-sm font-bold truncate">{coach.gym_name}</p>
              <p className="text-muted-foreground text-[10px]">Salon</p>
            </>
          )}
        </div>
        <div className="w-px h-6 bg-border" />
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onProfileClick}
          className="flex-1 flex items-center justify-center gap-1 text-primary text-xs font-medium"
        >
          Profil <ChevronRight className="w-3 h-3" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CoachUplink;
