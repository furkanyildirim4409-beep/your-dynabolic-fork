import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, Clock, Star, ChevronRight, ChevronLeft, Award, Zap, Film, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hapticLight } from "@/lib/haptics";
import { useAcademyCourses, AcademyCourse, AcademyModule } from "@/hooks/useAcademyCourses";
import { useCoachProfile } from "@/hooks/useCoachProfile";

const categoryList = ["Hepsi", "Antrenman", "Beslenme", "Sağlık"];

const Akademi = () => {
  const [activeCategory, setActiveCategory] = useState("Hepsi");
  const [selectedCourse, setSelectedCourse] = useState<AcademyCourse | null>(null);
  const [activeModule, setActiveModule] = useState<AcademyModule | null>(null);

  const { data: courses = [], isLoading } = useAcademyCourses();
  const { data: coach } = useCoachProfile();

  const filtered = courses.filter(c => activeCategory === "Hepsi" || c.category === activeCategory);

  const totalModules = courses.reduce((s, c) => s + c.modules.length, 0);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <h1 className="font-display text-xl font-bold text-foreground">AKADEMİ</h1>
        </div>
        <p className="text-muted-foreground text-xs">Bilgini geliştir, seviye atla</p>
      </motion.div>

      {/* Overall stats */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-foreground text-sm font-display">Kurs Kütüphanesi</span>
          </div>
          <span className="text-primary text-xs font-display">{courses.length} kurs</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center">
            <p className="font-display text-lg text-foreground">{courses.length}</p>
            <p className="text-muted-foreground text-[9px]">TOPLAM KURS</p>
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-primary">{totalModules}</p>
            <p className="text-muted-foreground text-[9px]">TOPLAM MODÜL</p>
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-yellow-500">{new Set(courses.map(c => c.category)).size}</p>
            <p className="text-muted-foreground text-[9px]">KATEGORİ</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categoryList.map(cat => (
          <button key={cat} onClick={() => { hapticLight(); setActiveCategory(cat); }} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"}`}>{cat}</button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card overflow-hidden">
              <Skeleton className="h-36 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="glass-card p-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-display text-sm mb-1">Henüz kurs yok</p>
          <p className="text-muted-foreground text-xs">Koçunuz kurs eklediğinde burada görünecek.</p>
        </div>
      )}

      {/* Course list */}
      <div className="space-y-4">
        {filtered.map((course, i) => (
          <motion.button key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedCourse(course)} className="w-full glass-card overflow-hidden relative text-left">
            <div className="relative h-36">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Film className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm">
                <Zap className="w-3 h-3 text-yellow-500" />
                <span className="text-foreground text-[10px] font-display">{course.modules.length} Bölüm</span>
              </div>
              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                <div>
                  <span className="text-primary text-[10px] font-display">{course.category}</span>
                  <h3 className="font-display text-sm text-foreground">{course.title}</h3>
                  {coach?.full_name && <p className="text-muted-foreground text-[10px]">{coach.full_name}</p>}
                </div>
                <button className="p-2.5 rounded-full bg-primary flex items-center justify-center">
                  <Play className="w-4 h-4 text-primary-foreground" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{course.type}</span>
                <span className="text-muted-foreground text-xs">{course.modules.length} modül</span>
              </div>
              {course.description && (
                <p className="text-muted-foreground text-xs mt-1.5 line-clamp-2">{course.description}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && !activeModule && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto">
            <div className="max-w-[430px] mx-auto pb-32">
              <div className="relative h-48">
                {selectedCourse.thumbnail ? (
                  <img src={selectedCourse.thumbnail} alt={selectedCourse.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                    <Film className="w-14 h-14 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <button onClick={() => setSelectedCourse(null)} className="absolute top-4 left-4 p-2 rounded-full bg-background/50 backdrop-blur-sm">
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <div className="p-4 space-y-4 -mt-8 relative">
                <div>
                  <span className="text-primary text-[10px] font-display">{selectedCourse.category}{coach?.full_name ? ` • ${coach.full_name}` : ""}</span>
                  <h2 className="font-display text-xl text-foreground mt-1">{selectedCourse.title}</h2>
                  {selectedCourse.description && (
                    <p className="text-muted-foreground text-sm mt-2">{selectedCourse.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{selectedCourse.type}</span>
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><Film className="w-3 h-3" />{selectedCourse.modules.length} modül</span>
                </div>
                {selectedCourse.tags && selectedCourse.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCourse.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-[10px]">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  {selectedCourse.modules.map((mod, i) => (
                    <motion.button key={mod.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} onClick={() => { hapticLight(); setActiveModule(mod); }} className="w-full glass-card p-3 flex items-center gap-3 text-left">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                        <span className="text-primary text-xs font-display">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{mod.title}</p>
                        {mod.videoUrl && (
                          <span className="text-muted-foreground text-[10px]">🎬 Video</span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  ))}
                  {selectedCourse.modules.length === 0 && (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground text-xs">Bu kursta henüz modül yok.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Module Video Player */}
      <AnimatePresence>
        {activeModule && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button onClick={() => setActiveModule(null)} className="p-2">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <p className="font-display text-sm text-foreground truncate max-w-[60%]">{activeModule.title}</p>
              <div className="w-9" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-4">
              {activeModule.videoUrl ? (
                <div className="w-full max-w-lg">
                  <video
                    key={activeModule.videoUrl}
                    src={activeModule.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full rounded-xl aspect-video bg-black"
                  />
                  <h3 className="font-display text-foreground text-lg mt-4">{activeModule.title}</h3>
                  {selectedCourse && (
                    <p className="text-muted-foreground text-xs mt-1">{selectedCourse.title} • Modül {selectedCourse.modules.findIndex(m => m.id === activeModule.id) + 1}/{selectedCourse.modules.length}</p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Play className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-display text-foreground text-lg mb-2">{activeModule.title}</h3>
                  <p className="text-muted-foreground text-sm">Bu modül için video henüz yüklenmemiş.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Akademi;
