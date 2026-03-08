import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut, Trophy, Coins, Flame, Target, Calendar, ChevronRight, Edit2, Camera, Scan, FileText, History, Award, TrendingUp, Share2, Shield } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { currentUser, workoutHistory } from "@/lib/mockData";
import SettingsPanel from "@/components/SettingsPanel";
import BioCoinWallet from "@/components/BioCoinWallet";
import BodyScanUpload from "@/components/BodyScanUpload";
import BloodworkUpload from "@/components/BloodworkUpload";
import PersonalRecords from "@/components/PersonalRecords";
import TransformationTimeline from "@/components/profile/TransformationTimeline";
import { useNavigate } from "react-router-dom";
import { hapticLight, hapticMedium } from "@/lib/haptics";

const Profil = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showBodyScan, setShowBodyScan] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "records" | "bloodwork" | "transformation">("overview");

  const stats = [
    { label: "Seviye", value: currentUser.level, icon: <Target className="w-4 h-4 text-primary" /> },
    { label: "Seri", value: `${currentUser.streak} gün`, icon: <Flame className="w-4 h-4 text-orange-400" /> },
    { label: "Bio-Coin", value: currentUser.bioCoins.toLocaleString(), icon: <Coins className="w-4 h-4 text-yellow-500" /> },
    { label: "Antrenman", value: workoutHistory.length, icon: <Calendar className="w-4 h-4 text-blue-400" /> },
  ];

  const menuItems = [
    { label: "Bio-Coin Cüzdan", icon: <Coins className="w-5 h-5 text-yellow-500" />, onClick: () => setShowWallet(true) },
    { label: "Başarımlar", icon: <Trophy className="w-5 h-5 text-amber-500" />, onClick: () => navigate("/achievements") },
    { label: "Vücut Taraması", icon: <Scan className="w-5 h-5 text-primary" />, onClick: () => { hapticMedium(); setShowBodyScan(true); } },
    { label: "Sağlık Trendleri", icon: <TrendingUp className="w-5 h-5 text-emerald-400" />, onClick: () => navigate("/saglik-trendleri") },
    { label: "Ayarlar", icon: <Settings className="w-5 h-5 text-muted-foreground" />, onClick: () => setShowSettings(true) },
    { label: "Çıkış Yap", icon: <LogOut className="w-5 h-5 text-destructive" />, onClick: signOut, danger: true },
  ];

  const sectionTabs = [
    { key: "overview" as const, label: "Genel" },
    { key: "records" as const, label: "Rekorlar" },
    { key: "bloodwork" as const, label: "Kan Tahlili" },
    { key: "transformation" as const, label: "Dönüşüm" },
  ];

  // XP calculation
  const currentXP = 720;
  const nextLevelXP = 1000;
  const xpProgress = (currentXP / nextLevelXP) * 100;

  return (
    <div className="space-y-6 pb-24">
      {/* Profile Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-4">
        <div className="relative inline-block mb-3">
          <div className="p-1 rounded-full bg-gradient-to-tr from-primary via-primary/50 to-primary">
            <Avatar className="w-24 h-24 border-2 border-background">
              <AvatarImage src={currentUser.avatar} />
              <AvatarFallback className="text-2xl">{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </div>
          <button className="absolute bottom-1 right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
            <Camera className="w-3 h-3" />
          </button>
        </div>
        <h1 className="font-display text-xl font-bold text-foreground">{profile?.full_name || "Sporcu"}</h1>
        <p className="text-muted-foreground text-xs mt-1">{currentUser.email}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-display flex items-center gap-1"><Shield className="w-3 h-3" /> Seviye {currentUser.level}</span>
          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-display flex items-center gap-1"><Coins className="w-3 h-3" /> {currentUser.bioCoins}</span>
        </div>
      </motion.div>

      {/* Level progress */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted-foreground text-xs font-display">Seviye {currentUser.level}</span>
          <span className="text-muted-foreground text-xs font-display">Seviye {currentUser.level + 1}</span>
        </div>
        <Progress value={xpProgress} className="h-2.5" />
        <div className="flex items-center justify-between mt-2">
          <p className="text-muted-foreground text-[10px]">{currentXP} / {nextLevelXP} XP</p>
          <p className="text-primary text-[10px] font-display">{nextLevelXP - currentXP} XP kaldı</p>
        </div>
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

      {/* Section tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        {sectionTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { hapticLight(); setActiveSection(tab.key); }}
            className={`flex-1 py-2 rounded-lg text-[10px] font-display transition-all ${activeSection === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        {activeSection === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            {/* Workout history */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Son Antrenmanlar</h2>
                <button onClick={() => navigate("/antrenman")} className="text-primary text-xs flex items-center gap-1">Tümü <ChevronRight className="w-3 h-3" /></button>
              </div>
              <div className="space-y-2">
                {workoutHistory.slice(0, 5).map((w, i) => (
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
                <motion.button key={item.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.05 }} onClick={item.onClick} className={`w-full glass-card p-4 flex items-center gap-3 text-left transition-all ${item.danger ? "hover:border-destructive/30" : "hover:border-primary/20"}`}>
                  {item.icon}
                  <span className={`flex-1 text-sm ${item.danger ? "text-destructive" : "text-foreground"}`}>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {activeSection === "records" && (
          <motion.div key="records" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <PersonalRecords />
          </motion.div>
        )}

        {activeSection === "bloodwork" && (
          <motion.div key="bloodwork" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <BloodworkUpload />
          </motion.div>
        )}

        {activeSection === "transformation" && (
          <motion.div key="transformation" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <TransformationTimeline />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <BioCoinWallet isOpen={showWallet} onClose={() => setShowWallet(false)} />
      <BodyScanUpload isOpen={showBodyScan} onClose={() => setShowBodyScan(false)} />
    </div>
  );
};

export default Profil;
