import { useState } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Clock, Flame, Heart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const recipes = [
  { id: "1", title: "Protein Pancake", category: "Kahvaltı", time: "15 dk", calories: 350, protein: 35, image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop", liked: true },
  { id: "2", title: "Tavuklu Quinoa Bowl", category: "Öğle", time: "25 dk", calories: 480, protein: 45, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", liked: false },
  { id: "3", title: "Somon & Tatlı Patates", category: "Akşam", time: "30 dk", calories: 520, protein: 42, image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop", liked: true },
  { id: "4", title: "Protein Smoothie", category: "Ara Öğün", time: "5 dk", calories: 280, protein: 30, image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop", liked: false },
  { id: "5", title: "Yulaf & Fıstık Ezmesi", category: "Kahvaltı", time: "10 dk", calories: 420, protein: 20, image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop", liked: false },
];

const categories = ["Hepsi", "Kahvaltı", "Öğle", "Akşam", "Ara Öğün"];

const Tarifler = () => {
  const [activeCategory, setActiveCategory] = useState("Hepsi");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = recipes.filter(r => {
    if (activeCategory !== "Hepsi" && r.category !== activeCategory) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">TARİFLER</h1>
        </div>
        <p className="text-muted-foreground text-xs">Fitness dostu tarifler</p>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Tarif ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground border border-white/5"}`}>{cat}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((recipe, i) => (
          <motion.div key={recipe.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden">
            <div className="relative h-28">
              <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" loading="lazy" />
              <button className="absolute top-2 right-2 p-1">
                <Heart className={`w-4 h-4 ${recipe.liked ? "text-red-500 fill-red-500" : "text-white/50"}`} />
              </button>
            </div>
            <div className="p-3">
              <p className="text-foreground text-xs font-medium mb-1">{recipe.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] flex items-center gap-0.5"><Clock className="w-3 h-3" />{recipe.time}</span>
                <span className="text-muted-foreground text-[10px] flex items-center gap-0.5"><Flame className="w-3 h-3" />{recipe.calories}</span>
              </div>
              <p className="text-primary text-[10px] mt-1">{recipe.protein}g protein</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Tarifler;
