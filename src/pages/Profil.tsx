import { useState } from "react";
import { motion } from "framer-motion";
import { User, Settings, LogOut, Trophy, Coins, Flame, Target, Calendar, ChevronRight, Edit2, Camera } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { currentUser, workoutHistory } from "@/lib/mockData";
import SettingsPanel from "@/components/SettingsPanel";
import BioCoinWallet from "@/components/BioCoinWallet";

const Profil = () => {
  const { profile, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showWallet, setShowWallet] = useState(false);

  const stats = [
    { label: "Seviye", value: currentUser.level, icon: <Target className="w-4 h-4 text-primary" /> },
    { label: "Seri", value: `${currentUser.streak} gün`, icon: <Flame className="w-4 h-4 text-orange-400" /> },
    { label: "Bio-Coin", value: currentUser.bioCoins.toLocaleString(), icon: <Coins className="w-4 h-4 text-yellow-500" /> },
    { label: "Antrenman", value: workoutHistory.length, icon: <Calendar className="w-4 h-4 text-blue-400" /> },
  ];

  const menuItems = [
    { label: "Bio-Coin Cüzdan", icon: <Coins className="w-5 h-5 text-yellow-500" />, onClick: () => setShowWallet(true) },
    { label: "Ayarlar", icon: <Settings className="w-5 h-5 text-muted-foreground" />, onClick: () => setShowSettings(true) },
    { label: "Çıkış Yap", icon: <LogOut className="w-5 h-5 text-red-400" />, onClick: signOut, danger: true },
  ];

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-4">
        <div className="relative inline-block mb-3">
          <Avatar className="w-24 h-24 border-2 border-primary/30">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback className="text-2xl">{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground">
            <Camera className="w-3 h-3" />
          </button>
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">{profile?.full_name || "Sporcu"}</h1>
        <p className="text-muted-foreground text-xs mt-1">{currentUser.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-display">Seviye {currentUser.level}</span>
          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-display">{currentUser.bioCoins} Coin</span>
        </div>
      </motion.div>

      {/* Level progress */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-xs">Seviye {currentUser.level}</span>
          <span className="text-muted-foreground text-xs">Seviye {currentUser.level + 1}</span>
        </div>
        <Progress value={72} className="h-2" />
        <p className="text-muted-foreground text-[10px] mt-1 text-center">280 XP daha gerekli</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} className="glass-card p-3 text-center">
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <p className="font-display text-sm text-foreground">{stat.value}</p>
            <p className="text-muted-foreground text-[10px]">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Workout history */}
      <div>
        <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-3">Son Antrenmanlar</h2>
        <div className="space-y-2">
          {workoutHistory.slice(0, 3).map((w, i) => (
            <motion.div key={w.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }} className="glass-card p-3 flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm">{w.name}</p>
                <p className="text-muted-foreground text-xs">{w.date} • {w.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-primary text-xs font-display">{w.tonnage}</p>
                <p className="text-yellow-500 text-[10px]">+{w.bioCoins} coin</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {menuItems.map((item, i) => (
          <motion.button key={item.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.05 }} onClick={item.onClick} className={`w-full glass-card p-4 flex items-center gap-3 text-left ${item.danger ? "hover:border-red-500/30" : "hover:border-white/10"}`}>
            {item.icon}
            <span className={`flex-1 text-sm ${item.danger ? "text-red-400" : "text-foreground"}`}>{item.label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <BioCoinWallet isOpen={showWallet} onClose={() => setShowWallet(false)} />
    </div>
  );
};

export default Profil;
