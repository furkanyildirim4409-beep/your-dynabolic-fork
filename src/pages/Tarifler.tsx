import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UtensilsCrossed, Clock, Flame, Heart, Search, X, ChevronLeft, Users, Star, Bookmark, Share2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hapticLight } from "@/lib/haptics";

interface Recipe {
  id: string;
  title: string;
  category: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image: string;
  liked: boolean;
  servings: number;
  difficulty: string;
  rating: number;
  reviews: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
}

const recipes: Recipe[] = [
  {
    id: "1", title: "Protein Pancake", category: "Kahvaltı", time: "15 dk", calories: 350, protein: 35, carbs: 30, fat: 8, servings: 2, difficulty: "Kolay", rating: 4.8, reviews: 127,
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop", liked: true,
    ingredients: ["2 scoop whey protein", "1 yumurta", "50g yulaf unu", "100ml süt", "1 tatlı kaşığı bal", "Tarçın"],
    instructions: ["Tüm malzemeleri blender'da karıştırın", "Yapışmaz tavayı kısık ateşte ısıtın", "Hamuru tavaya dökün ve 2 dk pişirin", "Çevirip diğer tarafını da pişirin", "Meyve ve bal ile servis edin"],
    tags: ["Yüksek Protein", "Hızlı"],
  },
  {
    id: "2", title: "Tavuklu Quinoa Bowl", category: "Öğle", time: "25 dk", calories: 480, protein: 45, carbs: 42, fat: 12, servings: 1, difficulty: "Orta", rating: 4.7, reviews: 89,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop", liked: false,
    ingredients: ["200g tavuk göğsü", "100g quinoa", "1 avokado", "Cherry domates", "Ispanak", "Limon sosu"],
    instructions: ["Quinoa'yı haşlayın", "Tavuğu marine edip ızgarada pişirin", "Avokadoyu dilimleyin", "Bowl'u hazırlayıp sosla servis edin"],
    tags: ["Meal Prep", "Dengeli"],
  },
  {
    id: "3", title: "Somon & Tatlı Patates", category: "Akşam", time: "30 dk", calories: 520, protein: 42, carbs: 35, fat: 22, servings: 1, difficulty: "Orta", rating: 4.9, reviews: 156,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop", liked: true,
    ingredients: ["200g somon fileto", "1 tatlı patates", "Brokoli", "Zeytinyağı", "Limon", "Sarımsak"],
    instructions: ["Fırını 200°C'ye ısıtın", "Tatlı patatesi küp doğrayıp fırına verin", "Somonu baharatlarla marine edin", "20 dk fırınlayın", "Brokoli ile servis edin"],
    tags: ["Omega-3", "Fırın"],
  },
  {
    id: "4", title: "Protein Smoothie", category: "Ara Öğün", time: "5 dk", calories: 280, protein: 30, carbs: 25, fat: 8, servings: 1, difficulty: "Kolay", rating: 4.6, reviews: 203,
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop", liked: false,
    ingredients: ["1 scoop whey protein", "1 muz", "200ml badem sütü", "1 yemek kaşığı fıstık ezmesi", "Buz"],
    instructions: ["Tüm malzemeleri blender'a ekleyin", "Pürüzsüz olana kadar karıştırın", "Bardağa dökün ve servis edin"],
    tags: ["Hızlı", "Post-Workout"],
  },
  {
    id: "5", title: "Yulaf & Fıstık Ezmesi", category: "Kahvaltı", time: "10 dk", calories: 420, protein: 20, carbs: 50, fat: 16, servings: 1, difficulty: "Kolay", rating: 4.5, reviews: 91,
    image: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop", liked: false,
    ingredients: ["80g yulaf", "250ml süt", "2 yemek kaşığı fıstık ezmesi", "1 muz", "Tarçın", "Bal"],
    instructions: ["Yulafı sütle orta ateşte pişirin", "Kıvam alınca ocaktan alın", "Fıstık ezmesi ve muz dilimlerini ekleyin", "Tarçın ve bal ile servis edin"],
    tags: ["Enerji", "Lif"],
  },
  {
    id: "6", title: "Dana Etli Wrap", category: "Öğle", time: "20 dk", calories: 450, protein: 38, carbs: 35, fat: 18, servings: 2, difficulty: "Kolay", rating: 4.7, reviews: 74,
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop", liked: false,
    ingredients: ["200g dana kıyma", "2 tam buğday lavaş", "Marul", "Domates", "Yoğurt sos", "Baharatlar"],
    instructions: ["Kıymayı baharatlarla kavurun", "Lavaşı ısıtın", "Malzemeleri lavaşa dizin", "Sarıp servis edin"],
    tags: ["Yüksek Protein", "Pratik"],
  },
];

const categories = ["Hepsi", "Kahvaltı", "Öğle", "Akşam", "Ara Öğün"];

const Tarifler = () => {
  const [activeCategory, setActiveCategory] = useState("Hepsi");
  const [searchQuery, setSearchQuery] = useState("");
  const [likedRecipes, setLikedRecipes] = useState<Record<string, boolean>>(Object.fromEntries(recipes.filter(r => r.liked).map(r => [r.id, true])));
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Record<string, boolean>>({});

  const filtered = recipes.filter(r => {
    if (activeCategory !== "Hepsi" && r.category !== activeCategory) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    hapticLight();
    setLikedRecipes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = (id: string) => {
    hapticLight();
    setSavedRecipes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">TARİFLER</h1>
        </div>
        <p className="text-muted-foreground text-xs">Fitness dostu {recipes.length} tarif</p>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Tarif ara..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button key={cat} onClick={() => { hapticLight(); setActiveCategory(cat); }} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"}`}>{cat}</button>
        ))}
      </div>

      {/* Recipe grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((recipe, i) => (
          <motion.button key={recipe.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedRecipe(recipe)} className="glass-card overflow-hidden text-left">
            <div className="relative h-28">
              <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" loading="lazy" />
              <button onClick={(e) => handleLike(recipe.id, e)} className="absolute top-2 right-2 p-1">
                <Heart className={`w-4 h-4 ${likedRecipes[recipe.id] ? "text-destructive fill-red-500" : "text-white/50"}`} />
              </button>
              <div className="absolute bottom-1 left-2 px-1.5 py-0.5 rounded-full bg-background/70 backdrop-blur-sm text-[9px] text-foreground font-display">{recipe.difficulty}</div>
            </div>
            <div className="p-3">
              <p className="text-foreground text-xs font-medium mb-1">{recipe.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] flex items-center gap-0.5"><Clock className="w-3 h-3" />{recipe.time}</span>
                <span className="text-muted-foreground text-[10px] flex items-center gap-0.5"><Flame className="w-3 h-3" />{recipe.calories}</span>
              </div>
              <p className="text-primary text-[10px] mt-1">{recipe.protein}g protein</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background overflow-y-auto">
            <div className="max-w-[430px] mx-auto pb-32">
              {/* Hero image */}
              <div className="relative h-56">
                <img src={selectedRecipe.image} alt={selectedRecipe.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                <button onClick={() => setSelectedRecipe(null)} className="absolute top-4 left-4 p-2 rounded-full bg-background/50 backdrop-blur-sm">
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => handleLike(selectedRecipe.id)} className="p-2 rounded-full bg-background/50 backdrop-blur-sm">
                    <Heart className={`w-5 h-5 ${likedRecipes[selectedRecipe.id] ? "text-destructive fill-red-500" : "text-foreground"}`} />
                  </button>
                  <button onClick={() => handleSave(selectedRecipe.id)} className="p-2 rounded-full bg-background/50 backdrop-blur-sm">
                    <Bookmark className={`w-5 h-5 ${savedRecipes[selectedRecipe.id] ? "text-primary fill-primary" : "text-foreground"}`} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-5 -mt-8 relative">
                {/* Title & meta */}
                <div>
                  <span className="text-primary text-[10px] font-display">{selectedRecipe.category} • {selectedRecipe.difficulty}</span>
                  <h2 className="font-display text-xl text-foreground mt-1">{selectedRecipe.title}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-muted-foreground text-xs flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{selectedRecipe.rating} ({selectedRecipe.reviews})</span>
                    <span className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{selectedRecipe.time}</span>
                    <span className="text-muted-foreground text-xs flex items-center gap-1"><Users className="w-3 h-3" />{selectedRecipe.servings} kişi</span>
                  </div>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Kalori", value: selectedRecipe.calories, unit: "kcal", colorClass: "text-orange-400" },
                    { label: "Protein", value: selectedRecipe.protein, unit: "g", colorClass: "text-destructive" },
                    { label: "Karb", value: selectedRecipe.carbs, unit: "g", colorClass: "text-yellow-400" },
                    { label: "Yağ", value: selectedRecipe.fat, unit: "g", colorClass: "text-blue-400" },
                  ].map(m => (
                    <div key={m.label} className="glass-card p-2 text-center">
                      <p className={`font-display text-lg ${m.colorClass}`}>{m.value}</p>
                      <p className="text-muted-foreground text-[9px]">{m.unit} {m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedRecipe.tags.map(tag => (
                    <span key={tag} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="font-display text-sm text-foreground mb-3">Malzemeler</h3>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-[10px]">{i + 1}</span>
                        </div>
                        <span className="text-foreground text-sm">{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="font-display text-sm text-foreground mb-3">Hazırlanışı</h3>
                  <div className="space-y-3">
                    {selectedRecipe.instructions.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-primary text-xs font-display">{i + 1}</span>
                        </div>
                        <p className="text-foreground text-sm flex-1 pt-1">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tarifler;
