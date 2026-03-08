import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Play, Clock, Star, ChevronRight, Lock, Trophy, CheckCircle, X, ChevronLeft, Award, Target, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { hapticLight, hapticSuccess } from "@/lib/haptics";
import { toast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  type: "video" | "article" | "quiz";
}

interface Course {
  id: string;
  title: string;
  category: string;
  duration: string;
  lessons: Lesson[];
  thumbnail: string;
  locked: boolean;
  instructor: string;
  rating: number;
  description: string;
  xpReward: number;
}

const courses: Course[] = [
  {
    id: "1", title: "Hipertrofi Temelleri", category: "Antrenman", duration: "45 dk", instructor: "Koç Serdar", rating: 4.9, xpReward: 150, description: "Kas büyümesinin bilimsel temellerini öğrenin. Mekanik gerilim, metabolik stres ve kas hasarı kavramlarını anlayın.",
    thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop", locked: false,
    lessons: [
      { id: "l1", title: "Kas büyümesi nasıl olur?", duration: "8 dk", completed: true, type: "video" },
      { id: "l2", title: "Mekanik gerilim nedir?", duration: "6 dk", completed: true, type: "video" },
      { id: "l3", title: "Metabolik stres", duration: "5 dk", completed: true, type: "article" },
      { id: "l4", title: "Rep aralıkları", duration: "7 dk", completed: true, type: "video" },
      { id: "l5", title: "Volume yönetimi", duration: "6 dk", completed: true, type: "video" },
      { id: "l6", title: "Progressive overload", duration: "5 dk", completed: true, type: "article" },
      { id: "l7", title: "Deload stratejileri", duration: "4 dk", completed: false, type: "video" },
      { id: "l8", title: "Final Quiz", duration: "4 dk", completed: false, type: "quiz" },
    ],
  },
  {
    id: "2", title: "Makro Hesaplama", category: "Beslenme", duration: "30 dk", instructor: "Dyt. Elif", rating: 4.8, xpReward: 100, description: "Makro besinleri doğru hesaplamayı, öğün planlamayı ve kalori döngüsünü öğrenin.",
    thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=250&fit=crop", locked: false,
    lessons: [
      { id: "l9", title: "Kalori nedir?", duration: "6 dk", completed: true, type: "video" },
      { id: "l10", title: "Protein ihtiyacı", duration: "6 dk", completed: true, type: "video" },
      { id: "l11", title: "Karbonhidrat zamanlama", duration: "6 dk", completed: true, type: "article" },
      { id: "l12", title: "Yağ türleri", duration: "6 dk", completed: true, type: "video" },
      { id: "l13", title: "Final Quiz", duration: "6 dk", completed: true, type: "quiz" },
    ],
  },
  {
    id: "3", title: "Uyku & Toparlanma", category: "Sağlık", duration: "20 dk", instructor: "Dr. Burak", rating: 4.7, xpReward: 80, description: "Uyku kalitesini artırma, toparlanma stratejileri ve parasempatik aktivasyon.",
    thumbnail: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&h=250&fit=crop", locked: false,
    lessons: [
      { id: "l14", title: "Uyku döngüleri", duration: "5 dk", completed: false, type: "video" },
      { id: "l15", title: "Melatonin & sirkadyen ritim", duration: "5 dk", completed: false, type: "article" },
      { id: "l16", title: "Toparlanma protokolleri", duration: "5 dk", completed: false, type: "video" },
      { id: "l17", title: "Final Quiz", duration: "5 dk", completed: false, type: "quiz" },
    ],
  },
  {
    id: "4", title: "İleri Periodizasyon", category: "Antrenman", duration: "60 dk", instructor: "Koç Serdar", rating: 4.9, xpReward: 250, description: "Blok periodizasyon, DUP, konjuge metot ve peaking stratejilerini öğrenin.",
    thumbnail: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=250&fit=crop", locked: true,
    lessons: Array.from({ length: 12 }, (_, i) => ({ id: `l${18 + i}`, title: `Ders ${i + 1}`, duration: "5 dk", completed: false, type: "video" as const })),
  },
  {
    id: "5", title: "Supplement Rehberi", category: "Beslenme", duration: "35 dk", instructor: "Dyt. Elif", rating: 4.6, xpReward: 120, description: "Kanıta dayalı takviye rehberi. Kreatin, protein, omega-3 ve daha fazlası.",
    thumbnail: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=400&h=250&fit=crop", locked: false,
    lessons: [
      { id: "l30", title: "Kreatin", duration: "7 dk", completed: true, type: "video" },
      { id: "l31", title: "Whey Protein", duration: "6 dk", completed: true, type: "video" },
      { id: "l32", title: "Omega-3", duration: "5 dk", completed: false, type: "article" },
      { id: "l33", title: "Vitamin D", duration: "5 dk", completed: false, type: "video" },
      { id: "l34", title: "Kafein", duration: "6 dk", completed: false, type: "video" },
      { id: "l35", title: "Final Quiz", duration: "6 dk", completed: false, type: "quiz" },
    ],
  },
];

const categoryList = ["Hepsi", "Antrenman", "Beslenme", "Sağlık"];

const Akademi = () => {
  const [activeCategory, setActiveCategory] = useState("Hepsi");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  const filtered = courses.filter(c => activeCategory === "Hepsi" || c.category === activeCategory);

  const getCompletedCount = (c: Course) => c.lessons.filter(l => l.completed).length;
  const getProgress = (c: Course) => (getCompletedCount(c) / c.lessons.length) * 100;

  const totalCompleted = courses.reduce((s, c) => s + getCompletedCount(c), 0);
  const totalLessons = courses.reduce((s, c) => s + c.lessons.length, 0);

  const handleStartLesson = (lesson: Lesson) => {
    hapticLight();
    setActiveLesson(lesson);
  };

  const handleCompleteLesson = () => {
    if (!activeLesson || !selectedCourse) return;
    hapticSuccess();
    toast({ title: "Ders Tamamlandı! 🎓", description: `+${Math.round(selectedCourse.xpReward / selectedCourse.lessons.length)} XP kazanıldı` });
    setActiveLesson(null);
  };

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

      {/* Overall progress */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-foreground text-sm font-display">Genel İlerleme</span>
          </div>
          <span className="text-primary text-xs font-display">{totalCompleted}/{totalLessons} ders</span>
        </div>
        <Progress value={(totalCompleted / totalLessons) * 100} className="h-2" />
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center">
            <p className="font-display text-lg text-foreground">{courses.filter(c => getProgress(c) === 100).length}</p>
            <p className="text-muted-foreground text-[9px]">TAMAMLANAN</p>
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-primary">{courses.filter(c => getProgress(c) > 0 && getProgress(c) < 100).length}</p>
            <p className="text-muted-foreground text-[9px]">DEVAM EDEN</p>
          </div>
          <div className="text-center">
            <p className="font-display text-lg text-yellow-500">{courses.reduce((s, c) => s + (getProgress(c) === 100 ? c.xpReward : 0), 0)}</p>
            <p className="text-muted-foreground text-[9px]">XP KAZANILAN</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {categoryList.map(cat => (
          <button key={cat} onClick={() => { hapticLight(); setActiveCategory(cat); }} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border"}`}>{cat}</button>
        ))}
      </div>

      {/* Course list */}
      <div className="space-y-4">
        {filtered.map((course, i) => {
          const completed = getCompletedCount(course);
          const progress = getProgress(course);
          return (
            <motion.button key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => !course.locked && setSelectedCourse(course)} className="w-full glass-card overflow-hidden relative text-left">
              <div className="relative h-36">
                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                {course.locked && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                      <p className="text-muted-foreground text-xs">Seviye 10 gerekli</p>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-sm">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-foreground text-[10px] font-display">{course.rating}</span>
                </div>
                <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                  <div>
                    <span className="text-primary text-[10px] font-display">{course.category}</span>
                    <h3 className="font-display text-sm text-foreground">{course.title}</h3>
                    <p className="text-muted-foreground text-[10px]">{course.instructor}</p>
                  </div>
                  {!course.locked && progress < 100 && (
                    <button className="p-2.5 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-4 h-4 text-primary-foreground" />
                    </button>
                  )}
                  {progress === 100 && (
                    <div className="p-2 rounded-full bg-emerald-500/20">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
                    <span className="text-muted-foreground text-xs">{course.lessons.length} ders</span>
                    <span className="text-yellow-500 text-xs flex items-center gap-0.5"><Zap className="w-3 h-3" />{course.xpReward} XP</span>
                  </div>
                  {completed > 0 && !course.locked && (
                    <span className="text-primary text-xs font-display">{completed}/{course.lessons.length}</span>
                  )}
                </div>
                {completed > 0 && !course.locked && <Progress value={progress} className="h-1" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && !activeLesson && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md overflow-y-auto">
            <div className="max-w-[430px] mx-auto pb-32">
              <div className="relative h-48">
                <img src={selectedCourse.thumbnail} alt={selectedCourse.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <button onClick={() => setSelectedCourse(null)} className="absolute top-4 left-4 p-2 rounded-full bg-background/50 backdrop-blur-sm">
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <div className="p-4 space-y-4 -mt-8 relative">
                <div>
                  <span className="text-primary text-[10px] font-display">{selectedCourse.category} • {selectedCourse.instructor}</span>
                  <h2 className="font-display text-xl text-foreground mt-1">{selectedCourse.title}</h2>
                  <p className="text-muted-foreground text-sm mt-2">{selectedCourse.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{selectedCourse.duration}</span>
                  <span className="text-muted-foreground text-xs flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{selectedCourse.rating}</span>
                  <span className="text-yellow-500 text-xs flex items-center gap-1"><Zap className="w-3 h-3" />{selectedCourse.xpReward} XP</span>
                </div>
                <Progress value={getProgress(selectedCourse)} className="h-2" />
                <div className="space-y-2">
                  {selectedCourse.lessons.map((lesson, i) => (
                    <motion.button key={lesson.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} onClick={() => handleStartLesson(lesson)} className="w-full glass-card p-3 flex items-center gap-3 text-left">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${lesson.completed ? "bg-emerald-500/20" : "bg-primary/10"}`}>
                        {lesson.completed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <span className="text-primary text-xs font-display">{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${lesson.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-muted-foreground text-[10px]">{lesson.duration}</span>
                          <span className="text-muted-foreground text-[10px] capitalize">{lesson.type === "quiz" ? "📝 Quiz" : lesson.type === "article" ? "📄 Makale" : "🎬 Video"}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Lesson Viewer */}
      <AnimatePresence>
        {activeLesson && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <button onClick={() => setActiveLesson(null)} className="p-2"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
              <p className="font-display text-sm text-foreground">{activeLesson.title}</p>
              <div className="w-9" />
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  {activeLesson.type === "video" && <Play className="w-10 h-10 text-primary" />}
                  {activeLesson.type === "article" && <BookOpen className="w-10 h-10 text-primary" />}
                  {activeLesson.type === "quiz" && <Target className="w-10 h-10 text-primary" />}
                </div>
                <h3 className="font-display text-foreground text-lg mb-2">{activeLesson.title}</h3>
                <p className="text-muted-foreground text-sm mb-6">{activeLesson.duration} • {activeLesson.type === "quiz" ? "Quiz" : activeLesson.type === "article" ? "Makale" : "Video"}</p>
                <p className="text-muted-foreground text-xs mb-8 max-w-xs mx-auto">Bu bir demo içerik gösterimidir. Gerçek uygulamada burada {activeLesson.type === "video" ? "video oynatıcı" : activeLesson.type === "article" ? "makale içeriği" : "quiz soruları"} gösterilecektir.</p>
                <Button onClick={handleCompleteLesson} className="bg-primary hover:bg-primary/90 font-display">
                  <CheckCircle className="w-4 h-4 mr-2" /> Tamamla
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Akademi;
