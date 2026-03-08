import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, Star, Users, Trophy, ChevronRight, Heart, TrendingUp, Zap, BookOpen, Award, Crown, Filter, SlidersHorizontal } from "lucide-react";
import { coaches, getLeaderboardCoaches } from "@/lib/mockData";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { hapticLight } from "@/lib/haptics";

const categories = ["Hepsi", "Hipertrofi", "Powerlifting", "Mobilite", "Beslenme", "Yoga"];

interface FeaturedProgram {
  id: string;
  title: string;
  coach: string;
  coachAvatar: string;
  image: string;
  duration: string;
  level: string;
  rating: number;
  enrollments: number;
  price: number;
  tags: string[];
}

const featuredPrograms: FeaturedProgram[] = [
  { id: "fp1", title: "12 Hafta Hipertrofi", coach: "Koç Serdar", coachAvatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop", duration: "12 Hafta", level: "Orta", rating: 4.9, enrollments: 342, price: 799, tags: ["Kas Kütlesi", "Push/Pull"] },
  { id: "fp2", title: "Güç Döngüsü 5x5", coach: "Koç Elif", coachAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100", image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=250&fit=crop", duration: "8 Hafta", level: "İleri", rating: 4.8, enrollments: 198, price: 599, tags: ["Güç", "Compound"] },
  { id: "fp3", title: "Yağ Yakma Programı", coach: "Koç Burak", coachAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=250&fit=crop", duration: "6 Hafta", level: "Başlangıç", rating: 4.7, enrollments: 521, price: 499, tags: ["Kardio", "HIIT"] },
];

const trendingTopics = [
  { id: "tt1", title: "Kreatin Yükleme", views: "12.4K", emoji: "💊" },
  { id: "tt2", title: "Uyku Optimizasyonu", views: "8.7K", emoji: "😴" },
  { id: "tt3", title: "Deload Haftası", views: "6.2K", emoji: "🔄" },
  { id: "tt4", title: "RPE Ölçekleme", views: "5.1K", emoji: "📊" },
];

const communityPosts = [
  { id: "cp1", author: "Mehmet D.", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80", content: "3 ayda bench press PR'ımı 120kg'dan 145kg'a çıkardım! 💪", likes: 87, comments: 23, time: "2 saat önce" },
  { id: "cp2", author: "Zeynep K.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80", content: "Bugünkü squat PR: 100kg x 5! İlk kez bu ağırlığı taşıdım 🎉", likes: 134, comments: 41, time: "4 saat önce" },
  { id: "cp3", author: "Burak Ş.", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80", content: "6 aylık dönüşüm fotoğraflarım hazır. 92kg → 80kg, yağ oranı %22 → %14", likes: 256, comments: 67, time: "6 saat önce" },
];

const Kesfet = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Hepsi");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const leaderboard = getLeaderboardCoaches();

  const filteredCoaches = coaches.filter(c => {
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeCategory !== "Hepsi" && !c.specialty.includes(activeCategory)) return false;
    return true;
  });

  const handleLikePost = (postId: string) => {
    hapticLight();
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <h1 className="font-display text-xl font-bold text-foreground">KEŞFET</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSearch(!showSearch)} className="p-2">
            <Search className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">Koçları keşfet, toplulukla bağlan</p>
      </motion.div>

      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Koç, program veya konu ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border" autoFocus />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button key={cat} onClick={() => { hapticLight(); setActiveCategory(cat); }} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"}`}>{cat}</button>
        ))}
      </div>

      {/* Featured Programs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-primary" />
          <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Öne Çıkan Programlar</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {featuredPrograms.map((program, i) => (
            <motion.div key={program.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="glass-card min-w-[260px] overflow-hidden flex-shrink-0">
              <div className="relative h-32">
                <img src={program.image} alt={program.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm text-[10px] font-display text-foreground">{program.level}</div>
                <div className="absolute bottom-2 left-3">
                  <p className="text-foreground text-sm font-display">{program.title}</p>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-5 h-5"><AvatarImage src={program.coachAvatar} /><AvatarFallback className="text-[8px]">{program.coach.charAt(0)}</AvatarFallback></Avatar>
                  <span className="text-muted-foreground text-[10px]">{program.coach}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-[10px] flex items-center gap-0.5"><Star className="w-3 h-3 text-yellow-500" />{program.rating}</span>
                    <span className="text-muted-foreground text-[10px]">{program.enrollments} kişi</span>
                    <span className="text-muted-foreground text-[10px]">{program.duration}</span>
                  </div>
                  <span className="text-primary font-display text-sm">₺{program.price}</span>
                </div>
                <div className="flex gap-1 mt-2">
                  {program.tags.map(tag => (
                    <span key={tag} className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Trend Konular</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {trendingTopics.map((topic, i) => (
            <motion.button key={topic.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-3 flex items-center gap-3 text-left">
              <span className="text-2xl">{topic.emoji}</span>
              <div>
                <p className="text-foreground text-xs font-medium">{topic.title}</p>
                <p className="text-muted-foreground text-[10px]">{topic.views} görüntülenme</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Liderlik Tablosu</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {leaderboard.map((coach, i) => (
            <motion.button key={coach.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} onClick={() => navigate(`/coach/${coach.id}`)} className="glass-card p-4 min-w-[140px] text-center flex-shrink-0">
              <div className={`text-xs font-display mb-2 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-zinc-400" : "text-amber-700"}`}>
                {i === 0 ? <Crown className="w-4 h-4 mx-auto" /> : `#${i + 1}`}
              </div>
              <Avatar className="w-12 h-12 mx-auto mb-2 ring-2 ring-offset-2 ring-offset-background ring-primary/30">
                <AvatarImage src={coach.avatar} />
                <AvatarFallback>{coach.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <p className="text-foreground text-xs font-medium">{coach.name}</p>
              <p className="text-primary text-[10px] font-display">{coach.score} puan</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Community Feed */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="text-muted-foreground text-xs uppercase tracking-widest font-medium">Topluluk</h2>
        </div>
        <div className="space-y-3">
          {communityPosts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-8 h-8"><AvatarImage src={post.avatar} /><AvatarFallback>{post.author.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">{post.author}</p>
                  <p className="text-muted-foreground text-[10px]">{post.time}</p>
                </div>
              </div>
              <p className="text-foreground text-sm mb-3">{post.content}</p>
              <div className="flex items-center gap-4">
                <button onClick={() => handleLikePost(post.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Heart className={`w-4 h-4 ${likedPosts[post.id] ? "text-destructive fill-red-500" : ""}`} />
                  {post.likes + (likedPosts[post.id] ? 1 : 0)}
                </button>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">💬 {post.comments}</span>
              </div>
            </motion.div>
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
