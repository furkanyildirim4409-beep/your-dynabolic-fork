import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Search, Star, Users, Trophy, ChevronRight, Heart } from "lucide-react";
import { coaches, getLeaderboardCoaches } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const categories = ["Hepsi", "Hipertrofi", "Powerlifting", "Mobilite", "Beslenme", "Yoga"];

const Kesfet = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Hepsi");
  const [searchQuery, setSearchQuery] = useState("");
  const leaderboard = getLeaderboardCoaches();

  const filteredCoaches = coaches.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeCategory !== "Hepsi" && !c.specialty.includes(activeCategory)) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">KEŞFET</h1>
        </div>
        <p className="text-muted-foreground text-xs">Koçları keşfet, toplulukla bağlan</p>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Koç veya program ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground border border-white/5"}`}>{cat}</button>
        ))}
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Liderlik Tablosu</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {leaderboard.map((coach, i) => (
            <motion.button key={coach.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} onClick={() => navigate(`/coach/${coach.id}`)} className="glass-card-premium p-4 min-w-[140px] text-center flex-shrink-0">
              <div className={`text-xs font-display mb-2 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : "text-amber-700"}`}>#{i + 1}</div>
              <Avatar className="w-12 h-12 mx-auto mb-2">
                <AvatarImage src={coach.avatar} />
                <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="text-foreground text-xs font-medium">{coach.name}</p>
              <p className="text-primary text-[10px] font-display">{coach.score} puan</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Coach cards */}
      <div>
        <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium mb-3">Koçlar</h2>
        <div className="space-y-3">
          {filteredCoaches.map((coach, i) => (
            <motion.button key={coach.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => navigate(`/coach/${coach.id}`)} className="w-full glass-card p-4 flex items-center gap-3 text-left">
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={coach.avatar} />
                  <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {coach.hasNewStory && <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-medium">{coach.name}</p>
                <p className="text-primary text-xs">{coach.specialty}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-muted-foreground text-[10px] flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{coach.rating}</span>
                  <span className="text-muted-foreground text-[10px] flex items-center gap-1"><Users className="w-3 h-3" />{coach.students}</span>
                  <span className="text-muted-foreground text-[10px] flex items-center gap-1"><Heart className="w-3 h-3" />{coach.followers}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Kesfet;
