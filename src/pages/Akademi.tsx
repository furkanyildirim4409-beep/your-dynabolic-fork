import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Play, Clock, Star, ChevronRight, Lock } from "lucide-react";

const courses = [
  { id: "1", title: "Hipertrofi Temelleri", category: "Antrenman", duration: "45 dk", lessons: 8, completed: 6, thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop", locked: false },
  { id: "2", title: "Makro Hesaplama", category: "Beslenme", duration: "30 dk", lessons: 5, completed: 5, thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop", locked: false },
  { id: "3", title: "Uyku & Toparlanma", category: "Sağlık", duration: "20 dk", lessons: 4, completed: 0, thumbnail: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=250&fit=crop", locked: false },
  { id: "4", title: "İleri Periodizasyon", category: "Antrenman", duration: "60 dk", lessons: 12, completed: 0, thumbnail: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=250&fit=crop", locked: true },
  { id: "5", title: "Supplement Rehberi", category: "Beslenme", duration: "35 dk", lessons: 6, completed: 2, thumbnail: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&h=250&fit=crop", locked: false },
];

const categories = ["Hepsi", "Antrenman", "Beslenme", "Sağlık"];

const Akademi = () => {
  const [activeCategory, setActiveCategory] = useState("Hepsi");

  const filtered = courses.filter(c => activeCategory === "Hepsi" || c.category === activeCategory);

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">AKADEMİ</h1>
        </div>
        <p className="text-muted-foreground text-xs">Bilgini geliştir, seviye atla</p>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground border border-white/5"}`}>{cat}</button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((course, i) => (
          <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card overflow-hidden relative">
            <div className="relative h-32">
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              {course.locked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                <div>
                  <span className="text-primary text-[10px] font-display">{course.category}</span>
                  <h3 className="font-display text-sm text-foreground">{course.title}</h3>
                </div>
                {!course.locked && (
                  <button className="p-2 rounded-full bg-primary/20 text-primary">
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                <span className="text-muted-foreground text-xs">{course.lessons} ders</span>
              </div>
              {course.completed > 0 && !course.locked && (
                <span className="text-primary text-xs font-display">{course.completed}/{course.lessons}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Akademi;
