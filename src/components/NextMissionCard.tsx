import { motion } from "framer-motion";
import { Play, Clock, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NextMissionCardProps {
  title: string;
  duration: string;
  calories?: string;
  coach?: string;
}

const NextMissionCard = ({ title, duration, calories = "350 kcal", coach }: NextMissionCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative overflow-hidden rounded-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900/90 to-black" />
      
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative p-5 flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
            Bugünkü Antrenman
          </p>
          
          <h3 className="text-primary font-display text-xl font-bold tracking-tight mb-2">
            {title}
          </h3>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{duration}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{calories}</span>
            </div>
          </div>
          
          {coach && (
            <p className="text-muted-foreground/60 text-[10px] mt-2 uppercase tracking-wider">
              {coach} atadı
            </p>
          )}
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/antrenman")}
          className="flex-shrink-0 w-14 h-14 rounded-full bg-primary flex items-center justify-center neon-glow-sm"
        >
          <Play className="w-6 h-6 text-primary-foreground fill-current ml-0.5" />
        </motion.button>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </motion.div>
  );
};

export default NextMissionCard;
