// Central Mock Data for DYNABOLIC MVP
// All data is in Turkish as per requirements

import type { CoachAdjustment, ProgramExercise } from "@/types/shared-models";

// ============================================
// COACH ADJUSTMENTS (Real-time updates from Admin Panel)
// ============================================

export const coachAdjustments: CoachAdjustment[] = [
  {
    id: "adj-001",
    athleteId: "user-001",
    type: "intensity",
    previousValue: 70,
    value: 85,
    message: "Bu hafta daha yüksek yoğunlukla çalışabilirsin. Formun çok iyi, performansın artıyor!",
    appliedAt: new Date().toISOString(),
  },
  {
    id: "adj-002",
    athleteId: "user-001",
    type: "calories",
    previousValue: 2400,
    value: 2600,
    message: "Kas kütlesi artışı için kalori alımını yükseltiyoruz. Özellikle antrenman sonrası karbonhidratı artır.",
    appliedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "adj-003",
    athleteId: "user-001",
    type: "volume",
    previousValue: 16,
    value: 20,
    message: "Toparlanman mükemmel görünüyor. Set sayısını artırıyoruz.",
    appliedAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

export const getLatestAdjustment = (athleteId: string, acknowledgedIds: string[]): CoachAdjustment | null => {
  const unacknowledged = coachAdjustments
    .filter((adj) => adj.athleteId === athleteId && !acknowledgedIds.includes(adj.id))
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  return unacknowledged[0] || null;
};

// ============================================
// DETAILED EXERCISE DATA
// ============================================

export const detailedExercises: (ProgramExercise & { targetReps: number; tempo: string; restDuration: number; videoUrl?: string })[] = [
  { id: "a1", name: "Barbell Bench Press", category: "chest_back", targetReps: 12, tempo: "2-0-1-0", sets: 5, reps: 0, rpe: 9, videoUrl: "https://i.pinimg.com/originals/8e/34/bb/8e34bb41d30ceb2f65aa7873a87a4371.gif", notes: "Piramit: 30-12-10-8-6. Barı göğsüne değdir, sektirme yapma!", restDuration: 90 },
  { id: "a2", name: "Incline Barbell Press", category: "chest_back", targetReps: 10, tempo: "3-0-1-0", sets: 5, reps: 0, rpe: 8.5, notes: "Üst göğüs açısı 45 derece.", restDuration: 90 },
  { id: "a3", name: "Dumbbell Flyes", category: "chest_back", targetReps: 15, tempo: "3-1-1-0", sets: 5, reps: 0, rpe: 9, notes: "Göğüs kafesini iyice aç.", restDuration: 0 },
  { id: "a4", name: "Dumbbell Pullover", category: "chest_back", targetReps: 15, tempo: "2-1-1-1", sets: 5, reps: 0, rpe: 8, notes: "Sırt ve göğüs aynı anda çalışır.", restDuration: 90 },
  { id: "a5", name: "Wide Grip Chin Up", category: "chest_back", targetReps: 10, tempo: "2-0-1-1", sets: 4, reps: 0, rpe: 10, notes: "Çeneni bara vur!", restDuration: 90 },
  { id: "a6", name: "Bent Over Row", category: "chest_back", targetReps: 12, tempo: "2-0-1-0", sets: 5, reps: 0, rpe: 9, notes: "Belini düz tut.", restDuration: 60 },
  { id: "a7", name: "Leg Raise", category: "chest_back", targetReps: 25, tempo: "1-0-1-0", sets: 5, reps: 0, rpe: 8, notes: "Karın kaslarını sık.", restDuration: 30 },
  { id: "b1", name: "Clean & Press", category: "shoulder_arm", targetReps: 5, tempo: "X-0-X-0", sets: 5, reps: 0, rpe: 9.5, notes: "Patlayıcı güç!", restDuration: 120 },
  { id: "b2", name: "Dumbbell Press", category: "shoulder_arm", targetReps: 10, tempo: "2-0-1-0", sets: 5, reps: 0, rpe: 9, notes: "Omuz başları yanacak!", restDuration: 0 },
  { id: "b3", name: "Front Raise", category: "shoulder_arm", targetReps: 12, tempo: "2-0-1-1", sets: 5, reps: 0, rpe: 8.5, notes: "Sallanmadan kaldır.", restDuration: 90 },
  { id: "b4", name: "Barbell Curl", category: "shoulder_arm", targetReps: 10, tempo: "2-0-1-0", sets: 5, reps: 0, rpe: 9, notes: "Dirsekleri sabitle.", restDuration: 60 },
  { id: "b5", name: "Close Grip Bench", category: "shoulder_arm", targetReps: 10, tempo: "3-0-1-0", sets: 5, reps: 0, rpe: 9, notes: "Triceps odaklı.", restDuration: 60 },
  { id: "b6", name: "Skullcrushers", category: "shoulder_arm", targetReps: 12, tempo: "2-0-1-0", sets: 5, reps: 0, rpe: 9, notes: "Alnına kadar indir.", restDuration: 60 },
  { id: "b7", name: "Wrist Curl", category: "shoulder_arm", targetReps: 20, tempo: "1-0-1-0", sets: 5, reps: 0, rpe: 8, notes: "Bilekleri yak!", restDuration: 30 },
  { id: "c1", name: "Squat", category: "legs", targetReps: 10, tempo: "3-0-1-0", sets: 5, reps: 0, rpe: 9.5, notes: "KRAL HAREKET!", restDuration: 120 },
  { id: "c2", name: "Stiff Leg Deadlift", category: "legs", targetReps: 10, tempo: "2-0-1-0", sets: 5, reps: 0, rpe: 9, notes: "Arka bacakları gerdir.", restDuration: 90 },
  { id: "c3", name: "Lunges", category: "legs", targetReps: 12, tempo: "2-0-1-0", sets: 5, reps: 0, rpe: 8.5, notes: "Diz yere değmesin.", restDuration: 60 },
  { id: "c4", name: "Leg Extension", category: "legs", targetReps: 15, tempo: "1-0-1-1", sets: 5, reps: 0, rpe: 9, notes: "Tepede 1 saniye sık.", restDuration: 0 },
  { id: "c5", name: "Leg Curl", category: "legs", targetReps: 15, tempo: "2-0-1-0", sets: 5, reps: 0, rpe: 9, notes: "Kalçayı kaldırma.", restDuration: 90 },
  { id: "c6", name: "Calf Raise", category: "legs", targetReps: 20, tempo: "1-1-1-1", sets: 5, reps: 0, rpe: 9, notes: "Tam esnet, tam parmak ucu.", restDuration: 45 },
];

// ============================================
// COACHES DATABASE
// ============================================

export interface Coach {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  specialty: string;
  followers: string;
  students: number;
  rating: number;
  score: number;
  level: number;
  hasNewStory: boolean;
  highlights: { id: string; title: string; thumbnail: string }[];
  posts: { id: string; type: "transformation" | "video" | "motivation"; beforeImage?: string; afterImage?: string; videoThumbnail?: string; content?: string; likes: number; comments: number; }[];
  products: { id: string; title: string; price: number; bioCoins?: number; image: string; type: "ebook" | "pdf" | "apparel" | "equipment"; }[];
  packages: { id: string; title: string; price: number; description: string; features: string[]; }[];
  storyContent: { image: string; text: string; };
}

export interface FoodItem {
  id: string; name: string; portion: string; calories: number; protein: number; carbs: number; fat: number;
}

export interface WorkoutHistoryEntry {
  id: string; date: string; dateShort: string; name: string; duration: string; tonnage: string; exercises: number; bioCoins: number; completed: boolean;
  details: { exerciseName: string; sets: { weight: number; reps: number; isFailure?: boolean; }[]; }[];
}

export interface Notification {
  id: string; type: "coach" | "system" | "achievement" | "health" | "payment" | "program" | "checkin"; title: string; message: string; time: string; read: boolean; coachId?: string; actionUrl?: string; priority?: "low" | "normal" | "high";
}

export const coaches: Coach[] = [
  {
    id: "1", name: "Koç Serdar", avatar: "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&h=400&fit=crop&crop=face", bio: "Elit Performans Koçu | Bio-Hacker 🧬 | 10+ Yıl Deneyim | 500+ Başarılı Dönüşüm", specialty: "Hipertrofi & Vücut Geliştirme", followers: "12.4K", students: 150, rating: 4.9, score: 9850, level: 10, hasNewStory: true,
    storyContent: { image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1200&fit=crop", text: "Bugünkü ipucu: Kas büyümesi için uyku kalitesi kritik! Günde minimum 7-8 saat uyku hedefle. 💪" },
    highlights: [
      { id: "1", title: "Değişimler", thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop" },
      { id: "2", title: "Soru-Cevap", thumbnail: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=100&h=100&fit=crop" },
      { id: "3", title: "Yemekler", thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=100&h=100&fit=crop" },
      { id: "4", title: "Motivasyon", thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=100&h=100&fit=crop" },
    ],
    posts: [
      { id: "1", type: "transformation", beforeImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=500&fit=crop", afterImage: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=500&fit=crop", content: "12 haftalık dönüşüm programı sonucu. Disiplin + Bilim = Sonuç 💪", likes: 2847, comments: 156 },
      { id: "2", type: "video", videoThumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop", content: "Squat formunda dikkat etmeniz gereken 3 kritik nokta! 🎯", likes: 1892, comments: 89 },
    ],
    products: [
      { id: "1", title: "Kol İnşa Rehberi (E-Kitap)", price: 150, bioCoins: 500, image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=300&fit=crop", type: "ebook" },
      { id: "2", title: "Dynabolic Lifting Straps", price: 250, image: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=300&h=300&fit=crop", type: "equipment" },
    ],
    packages: [
      { id: "1", title: "Online Koçluk (Aylık)", price: 1500, description: "Kişiselleştirilmiş antrenman ve beslenme programı", features: ["Haftalık program güncelleme", "7/24 mesaj desteği", "Video form analizi", "Haftalık check-in"] },
      { id: "2", title: "Yarışma Hazırlık", price: 3000, description: "Vücut geliştirme yarışmalarına tam hazırlık paketi", features: ["Günlük takip", "Posing eğitimi", "Peak week stratejisi", "Sahne hazırlığı"] },
    ],
  },
  {
    id: "2", name: "Koç Elif", avatar: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400&h=400&fit=crop&crop=face", bio: "Mobilite & Fonksiyonel Antrenör 🧘‍♀️ | Fizik Tedavi Uzmanı", specialty: "Mobilite & Fonksiyonel Güç", followers: "8.7K", students: 120, rating: 4.8, score: 8720, level: 9, hasNewStory: true,
    storyContent: { image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=1200&fit=crop", text: "Sabah 10 dakika esneme, gününüze enerji katar! 🧘‍♀️" },
    highlights: [
      { id: "1", title: "Esneme", thumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100&h=100&fit=crop" },
      { id: "2", title: "Yoga", thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100&h=100&fit=crop" },
    ],
    posts: [
      { id: "1", type: "video", videoThumbnail: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=400&fit=crop", content: "Günlük 5 dakikada omuz mobilitesini artır! 🎯", likes: 1523, comments: 89 },
    ],
    products: [
      { id: "1", title: "Evde Mobilite Planı", price: 200, bioCoins: 650, image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=300&fit=crop", type: "pdf" },
    ],
    packages: [
      { id: "1", title: "Mobilite Koçluğu (Aylık)", price: 1200, description: "Kişisel esneklik programı", features: ["Haftalık esneme rutini", "Video analiz", "Postür düzeltme"] },
    ],
  },
  {
    id: "3", name: "Koç Mehmet", avatar: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400&h=400&fit=crop&crop=face", bio: "Powerlifting Antrenörü 🏋️ | Türkiye Şampiyonu", specialty: "Güç & Powerlifting", followers: "15.2K", students: 95, rating: 4.7, score: 7540, level: 9, hasNewStory: false,
    storyContent: { image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&h=1200&fit=crop", text: "Bugün deadlift günü! Form her şeyden önemli. 🏋️" },
    highlights: [
      { id: "1", title: "PR'lar", thumbnail: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=100&h=100&fit=crop" },
      { id: "2", title: "Teknik", thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop" },
    ],
    posts: [
      { id: "1", type: "video", videoThumbnail: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=400&fit=crop", content: "300kg Deadlift PR! 🔥", likes: 4521, comments: 312 },
    ],
    products: [
      { id: "1", title: "S.B.D. Programı (12 Hafta)", price: 300, bioCoins: 1000, image: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=300&h=300&fit=crop", type: "ebook" },
    ],
    packages: [
      { id: "1", title: "Powerlifting Koçluğu (Aylık)", price: 1800, description: "Squat, Bench, Deadlift odaklı güç programı", features: ["Kişisel program", "Haftalık video analiz", "PR takibi"] },
    ],
  },
];

export const getCoachById = (id: string): Coach | undefined => coaches.find((coach) => coach.id === id);
export const getLeaderboardCoaches = (): Coach[] => [...coaches].sort((a, b) => b.score - a.score);

// ============================================
// FOOD DATABASE
// ============================================

export const foodDatabase: FoodItem[] = [
  { id: "1", name: "Haşlanmış Yumurta", portion: "1 adet", calories: 70, protein: 6, carbs: 0.5, fat: 5 },
  { id: "2", name: "Tavuk Göğsü (Pişmiş)", portion: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "3", name: "Basmati Pirinç", portion: "100g", calories: 130, protein: 2.5, carbs: 28, fat: 0.3 },
  { id: "4", name: "Yulaf Ezmesi", portion: "50g", calories: 180, protein: 6, carbs: 30, fat: 3 },
  { id: "5", name: "Whey Protein", portion: "1 ölçek", calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { id: "6", name: "Muz", portion: "1 orta boy", calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
];

// ============================================
// WORKOUT HISTORY
// ============================================

export const workoutHistory: WorkoutHistoryEntry[] = [
  {
    id: "1", date: "27 Ocak 2026", dateShort: "27 Oca", name: "Göğüs & Arka Kol", duration: "55dk", tonnage: "4.2 Ton", exercises: 6, bioCoins: 75, completed: true,
    details: [
      { exerciseName: "Bench Press", sets: [{ weight: 100, reps: 12 }, { weight: 100, reps: 10 }, { weight: 100, reps: 8, isFailure: true }] },
      { exerciseName: "Incline Dumbbell Press", sets: [{ weight: 35, reps: 12 }, { weight: 35, reps: 10 }] },
      { exerciseName: "Cable Fly", sets: [{ weight: 20, reps: 15 }, { weight: 25, reps: 10, isFailure: true }] },
    ],
  },
  {
    id: "2", date: "25 Ocak 2026", dateShort: "25 Oca", name: "Bacak & Core", duration: "48dk", tonnage: "5.8 Ton", exercises: 5, bioCoins: 80, completed: true,
    details: [
      { exerciseName: "Squat", sets: [{ weight: 140, reps: 8 }, { weight: 150, reps: 6 }, { weight: 160, reps: 4 }] },
      { exerciseName: "Leg Press", sets: [{ weight: 250, reps: 12 }, { weight: 300, reps: 8, isFailure: true }] },
    ],
  },
  {
    id: "3", date: "23 Ocak 2026", dateShort: "23 Oca", name: "Sırt & Biceps", duration: "52dk", tonnage: "3.9 Ton", exercises: 7, bioCoins: 70, completed: true,
    details: [
      { exerciseName: "Deadlift", sets: [{ weight: 180, reps: 5 }, { weight: 200, reps: 3 }] },
      { exerciseName: "Lat Pulldown", sets: [{ weight: 70, reps: 12 }, { weight: 85, reps: 8 }] },
    ],
  },
];

// ============================================
// NOTIFICATIONS
// ============================================

export const notifications: Notification[] = [
  { id: "1", type: "coach", title: "Koç Serdar", message: "Programını güncelledi. Yeni haftanın antrenmanlarını kontrol et!", time: "5dk önce", read: false, coachId: "1", priority: "high" },
  { id: "2", type: "achievement", title: "Yeni Rozet!", message: '"150 Antrenman" rozetini kazandın! +50 Bio-Coin 🎉', time: "2sa önce", read: false, priority: "normal" },
  { id: "3", type: "health", title: "Toparlanma Uyarısı", message: "Göğüs kaslarınız dinlenme gerektiriyor.", time: "2sa önce", read: false, priority: "high" },
  { id: "4", type: "payment", title: "Ödeme Hatırlatması", message: "Aylık koçluk ödemesi yarın son gün.", time: "12sa önce", read: false, actionUrl: "/odemeler", priority: "high" },
  { id: "5", type: "program", title: "Program Güncellendi", message: "Bu haftaki antrenmanlarınız hazır.", time: "1g önce", read: true, priority: "normal" },
  { id: "6", type: "checkin", title: "Check-in Zamanı", message: "Günlük durumunuzu bildirin.", time: "4sa önce", read: false, priority: "normal" },
];

// ============================================
// ASSIGNED WORKOUTS
// ============================================

export const assignedWorkouts = [
  { id: "w1", title: "Arnold: Gün 1 (Göğüs & Sırt)", day: "Pazartesi", exercises: 7, duration: "75 dk", intensity: "Yüksek" as const, coachNote: "Haftaya güçlü başla.", categoryFilter: "chest_back" },
  { id: "w2", title: "Arnold: Gün 2 (Omuz & Kol)", day: "Salı", exercises: 7, duration: "60 dk", intensity: "Orta" as const, coachNote: "Omuz başlarını hisset.", categoryFilter: "shoulder_arm" },
  { id: "w3", title: "Arnold: Gün 3 (Bacak)", day: "Çarşamba", exercises: 6, duration: "80 dk", intensity: "Yüksek" as const, coachNote: "Squat'ta derin in.", categoryFilter: "legs" },
  { id: "w4", title: "Arnold: Gün 4 (Göğüs & Sırt)", day: "Perşembe", exercises: 7, duration: "75 dk", intensity: "Yüksek" as const, coachNote: "Ağırlıkları %5 artır.", categoryFilter: "chest_back" },
  { id: "w5", title: "Arnold: Gün 5 (Omuz & Kol)", day: "Cuma", exercises: 7, duration: "60 dk", intensity: "Orta" as const, coachNote: "Arnold kolları buradan çıkar!", categoryFilter: "shoulder_arm" },
  { id: "w6", title: "Arnold: Gün 6 (Bacak)", day: "Cumartesi", exercises: 6, duration: "80 dk", intensity: "Yüksek" as const, coachNote: "Haftanın son bacak günü.", categoryFilter: "legs" },
  { id: "w7", title: "Dinlenme Günü", day: "Pazar", exercises: 0, duration: "—", intensity: "Düşük" as const, coachNote: "Aktif dinlenme.", categoryFilter: "rest" },
];

export const assignedCoach = coaches[0];

// ============================================
// INVOICES DATA
// ============================================

import type { Invoice, CoachStory, BloodworkReport } from "@/types/shared-models";

export const bloodworkReports: BloodworkReport[] = [
  { id: "bw-1", uploadDate: "2026-01-15", fileName: "kan_tahlili_ocak_2026.pdf", fileType: "pdf", status: "analyzed", coachNotes: "Vitamin D seviyesi düşük.", analysisDate: "2026-01-16", flaggedValues: ["Vitamin D", "Ferritin"] },
  { id: "bw-2", uploadDate: "2025-10-20", fileName: "check_up_ekim.pdf", fileType: "pdf", status: "analyzed", coachNotes: "Tüm değerler normal.", analysisDate: "2025-10-22" },
  { id: "bw-3", uploadDate: "2026-01-27", fileName: "yeni_tahlil.jpg", fileType: "image", status: "pending" },
];

export const invoices: Invoice[] = [
  { id: "1", clientId: "user-1", clientName: "Ahmet Yılmaz", amount: 1500, status: "paid", date: "2026-01-15", serviceType: "Aylık Koçluk" },
  { id: "2", clientId: "user-1", clientName: "Ahmet Yılmaz", amount: 300, status: "pending", date: "2026-01-28", dueDate: "2026-02-02", serviceType: "E-Kitap" },
  { id: "3", clientId: "user-1", clientName: "Ahmet Yılmaz", amount: 1500, status: "overdue", date: "2026-01-01", dueDate: "2026-01-15", serviceType: "Aylık Koçluk" },
];

export const coachStories: CoachStory[] = [
  { id: "1", title: "Haftalık Dönüşüm", thumbnail: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop", category: "Değişimler", content: { image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=1200&fit=crop", text: "12 haftada inanılmaz dönüşüm! 💪" }, createdAt: "2026-01-27T10:00:00Z" },
  { id: "3", title: "Sıkça Sorulan", thumbnail: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=100&h=100&fit=crop", category: "Soru-Cevap", content: { image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=1200&fit=crop", text: "Protein ne zaman alınmalı?" }, createdAt: "2026-01-25T09:00:00Z" },
  { id: "6", title: "Günün İpucu", thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop", category: "Antrenman", content: { image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=1200&fit=crop", text: "Bench Press'te omuz ağrısı mı? Skapular retraksiyon yap!" }, createdAt: "2026-01-22T08:00:00Z" },
  { id: "8", title: "Pazartesi Motivasyonu", thumbnail: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop", category: "Motivasyon", content: { image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=1200&fit=crop", text: '"Disiplin, motivasyonun bittiği yerde başlar." 🔥' }, createdAt: "2026-01-20T07:00:00Z" },
];

// ============================================
// WEARABLE METRICS
// ============================================

export const wearableMetrics = {
  rhr: { value: 58, change: -2, unit: "bpm" },
  hrv: { value: 42, change: 5, unit: "ms" },
  sleep: { total: 7.2, deep: 23, rem: 18, light: 59, unit: "saat" },
  steps: { value: 8456, change: 12, goal: 10000 },
  lastSync: "2 saat önce",
};

export const currentUser = {
  id: "user-1", name: "Ahmet Yılmaz", email: "ahmet@example.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop", memberSince: "2025-06-15", level: 12, bioCoins: 2450, readinessScore: 85, streak: 14,
};

// ============================================
// ASSIGNED SUPPLEMENTS
// ============================================

export interface SupplementData {
  id: string; name: string; dosage: string; timing: string; servingsLeft: number; totalServings: number; takenToday: boolean; icon: string;
}

export const assignedSupplements: SupplementData[] = [
  { id: "sup-1", name: "Kreatin Monohidrat", dosage: "5g", timing: "Antrenman Sonrası", servingsLeft: 12, totalServings: 30, takenToday: true, icon: "💪" },
  { id: "sup-2", name: "Whey Protein", dosage: "30g (1 scoop)", timing: "Antrenman Sonrası", servingsLeft: 4, totalServings: 30, takenToday: false, icon: "🥤" },
  { id: "sup-3", name: "Omega-3", dosage: "2 kapsül", timing: "Sabah", servingsLeft: 18, totalServings: 60, takenToday: true, icon: "🐟" },
  { id: "sup-4", name: "Vitamin D3", dosage: "2000 IU", timing: "Sabah", servingsLeft: 3, totalServings: 90, takenToday: false, icon: "☀️" },
];

export interface ExerciseHistoryRecord {
  exerciseName: string; date: string; sets: { weight: number; reps: number; isFailure?: boolean; }[];
}

export const exerciseHistory: ExerciseHistoryRecord[] = [
  { exerciseName: "Bench Press", date: "2026-01-27", sets: [{ weight: 100, reps: 12 }, { weight: 100, reps: 10 }, { weight: 100, reps: 8, isFailure: true }] },
  { exerciseName: "Bench Press", date: "2026-01-20", sets: [{ weight: 97.5, reps: 10 }, { weight: 97.5, reps: 10 }] },
  { exerciseName: "Squat", date: "2026-01-25", sets: [{ weight: 140, reps: 8 }, { weight: 150, reps: 6 }, { weight: 160, reps: 4 }] },
  { exerciseName: "Squat", date: "2026-01-18", sets: [{ weight: 135, reps: 8 }, { weight: 145, reps: 6 }] },
  { exerciseName: "Deadlift", date: "2026-01-23", sets: [{ weight: 180, reps: 5 }, { weight: 200, reps: 3 }] },
  { exerciseName: "Deadlift", date: "2026-01-16", sets: [{ weight: 175, reps: 5 }, { weight: 190, reps: 3 }] },
];
