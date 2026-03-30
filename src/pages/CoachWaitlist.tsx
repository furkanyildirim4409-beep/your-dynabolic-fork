import { useState } from "react";
import { motion } from "framer-motion";
import { Microscope, Activity, Wand2, Calculator, RefreshCw, User, Mail, Instagram, ChevronDown, Loader2, Rocket, Store, GraduationCap, LayoutTemplate, Pill, MessageSquare, Trophy, Wallet, UserPlus, ShieldCheck, FileText, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DynabolicLogo from "@/components/DynabolicLogo";

const aiDoctorFeatures = [
  {
    icon: Microscope,
    title: "AI Destekli Kan Tahlili Analizi",
    description: "Sporcunun kan tahlili PDF'ini sisteme yükle. Yapay zeka değerleri (Testosteron, Kortizol, AST, ALT) okusun, referans aralıklarını karşılaştırsın ve sana özel beslenme/supplement protokolü önersin.",
    colSpan: "md:col-span-2 lg:col-span-2",
  },
  {
    icon: Activity,
    title: "Otonom Uyum Skoru (Adherence)",
    description: "Kim diyeti bozdu, kim antrenmanı astı? Sistem, tüm öğrencilerin verilerini anlık tarar ve 'Haftalık Uyum Puanı' düşük olanları kırmızı alarm ile önüne düşürür.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
  {
    icon: Wand2,
    title: "AI Program Jeneratörü",
    description: "Boş sayfaya bakmaya son. Sporcunun hedefini, sakatlık geçmişini ve tahlillerini seç; AI sana 10 saniyede kişiselleştirilmiş 4 haftalık taslak program üretsin. Sen sadece ince ayar yap.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
  {
    icon: Calculator,
    title: "Dinamik Gramaj Matematiği",
    description: "Sporcu 100g pirinç yerine 120g mı yedi? Uygulama sana sormaz. Anında aradaki 20g farkı hesaplar, o günkü protein, yağ ve kalori limitlerini otonom olarak yeniden dengeler.",
    colSpan: "md:col-span-2 lg:col-span-2",
  },
  {
    icon: RefreshCw,
    title: "AI Destekli Canlı Revizyon",
    description: "Sporcu platoya (gelişim duraklamasına) mı girdi? AI bunu hacim grafiklerinden tespit eder ve sana 'Kaloriyi %10 Düşür' veya 'Volume Load'u Artır' gibi spesifik aksiyonlar sunar.",
    colSpan: "md:col-span-1 lg:col-span-2",
  },
];

const operationsFeatures = [
  {
    icon: Users,
    title: "Merkezi Komuta Paneli",
    description: "Yüzlerce sporcuyu tek bir ekranda toplayın. Yeni gelenler, aktif aboneler ve uyarı veren sporcuları renk kodlarıyla anında filtreleyin. WhatsApp karmaşasına son verin.",
    colSpan: 2,
  },
  {
    icon: RefreshCw,
    title: "Canlı Program Revizesi",
    description: "Sporcunun antrenman veya beslenme planında yaptığın değişiklikler, o an sporcunun telefonunda sayfayı yenilemesine gerek kalmadan anında güncellenir.",
    colSpan: 1,
  },
  {
    icon: Pill,
    title: "Gelişmiş Supplement Protokolleri",
    description: "Kreatin, vitamin ve özel kür döngüleri. Sadece yemek değil, tüm ek gıda takvimini miligramına ve saatine kadar profesyonelce planla.",
    colSpan: 1,
  },
  {
    icon: TrendingUp,
    title: "Progressive Overload Takibi",
    description: "Sporcunun kaldırdığı ağırlık hacmini (Volume Load) haftalık grafiklerle izle. Platoya (gelişim duraklamasına) giren sporcuları algoritma sana bildirsin.",
    colSpan: 1,
  },
  {
    icon: Camera,
    title: "Form & Postür Analizi",
    description: "Ön, arka ve yan form fotoğraflarını tarih damgasıyla arşivle. Sporcularının değişimini kanıta dayalı, profesyonel slider'lar ile görselleştir.",
    colSpan: 1,
  },
];

const financeFeatures = [
  {
    icon: Wallet,
    title: "Ciro & Hak Ediş Merkezi",
    description: "Finansal şeffaflık. Aktif abonelikler, aylık gelir tahminleri ve alt koçlarınızın hak ediş hesaplamalarını tek bir ekrandan, profesyonelce yönetin.",
    colSpan: 2,
  },
  {
    icon: UserPlus,
    title: "Asistan & Alt Koç Atama",
    description: "Operasyonu büyüt. Sistemine asistanlar ve alt antrenörler ekle, yetkilerini sen belirle, iş yükünü profesyonelce dağıt.",
    colSpan: 1,
  },
  {
    icon: ShieldCheck,
    title: "Super Admin Dashboard",
    description: "Tüm sistemin kuş bakışı görünümü. Hangi koç kaç sporcu yönetiyor, hangi bölge daha karlı? Veriye dayalı büyüme kararları al.",
    colSpan: 1,
  },
  {
    icon: FileText,
    title: "Gelişmiş PDF Raporlama",
    description: "Öğrencilerine sadece mesaj değil, profesyonel gelişim raporları sun. Antrenman ve beslenme verilerini şık PDF dosyalarına dönüştür.",
    colSpan: 1,
  },
  {
    icon: Medal,
    title: "Kurumsal Otorite & White-Label",
    description: "Sıradan bir uygulamayı değil, kendi yönettiğin teknolojik bir ekosistemi sun. Teknolojin, markanın en büyük referansı olsun.",
    colSpan: 1,
  },
];
const heroContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.4 } },
};
const item = {
  hidden: { opacity: 0, y: 24, willChange: "transform, opacity" as const },
  show: { opacity: 1, y: 0, willChange: "auto" as const, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const CoachWaitlist = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [athleteCount, setAthleteCount] = useState("");
  const [instagram, setInstagram] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const scrollToForm = () => {
    const el = document.getElementById("coach-form");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("waitlist").insert([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: "coach",
          specialty: specialty || null,
          athlete_count: athleteCount || null,
          instagram: instagram.trim() || null,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          toast.error("Bu e-posta zaten koç listemizde!");
        } else {
          toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
        }
        return;
      }

      setSubmitted(true);
      toast.success("Kayıt başarılı! 🚀");
    } catch {
      toast.error("Bağlantı hatası, lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-black overflow-x-hidden">
      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#CCFF00 1px, transparent 1px), linear-gradient(90deg, #CCFF00 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, hsla(68,100%,50%,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Top Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-20 flex items-center justify-between px-6 md:px-12 py-5"
      >
        <div className="flex items-center gap-3">
          <DynabolicLogo size={36} animate={false} />
          <span
            className="font-mono font-bold text-sm tracking-[0.2em] uppercase"
            style={{ color: "#CCFF00" }}
          >
            Dynabolic
          </span>
        </div>
        <span className="text-[10px] sm:text-xs font-mono tracking-[0.15em] uppercase border border-[#CCFF00]/30 text-[#CCFF00]/80 rounded-full px-3 py-1">
          For Coaches
        </span>
      </motion.nav>

      {/* Hero */}
      <motion.section
        variants={heroContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-32 md:pt-28 md:pb-44 max-w-5xl mx-auto"
      >
        {/* Eyebrow */}
        <motion.p
          variants={heroItem}
          className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-6"
          style={{ color: "#CCFF00" }}
        >
          Elit Antrenör İşletim Sistemi
        </motion.p>

        {/* Headline */}
        <motion.h1
          variants={heroItem}
          className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8"
          style={{
            color: "#fff",
            textShadow: "0 0 40px hsla(0,0%,100%,0.15), 0 0 80px hsla(68,100%,50%,0.08)",
          }}
        >
          WhatsApp ve Excel'i{" "}
          <span className="text-white/40">Çöpe Atın.</span>
          <br />
          Atlet İmparatorluğunuzu{" "}
          <span
            style={{
              color: "#CCFF00",
              textShadow: "0 0 30px hsla(68,100%,50%,0.5), 0 0 60px hsla(68,100%,50%,0.2)",
            }}
          >
            Kurun.
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p variants={heroItem} className="text-base sm:text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mb-12">
          100'den fazla sporcuyu sıfır hata, sıfır gecikme ve yapay zeka destekli
          otonom takip sistemiyle tek bir merkezden yönetin.
        </motion.p>

        {/* CTA */}
        <motion.button
          variants={heroItem}
          onClick={scrollToForm}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="relative rounded-full px-10 py-4 font-bold text-sm sm:text-base tracking-wider uppercase text-black bg-[#CCFF00] transition-shadow hover:shadow-[0_0_40px_hsla(68,100%,50%,0.55)]"
        >
          <span className="relative z-10">Koç Bekleme Listesine Katıl</span>
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-[#CCFF00]"
            animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.button>

        {/* Scroll Indicator */}
        <motion.div
          variants={heroItem}
          onClick={() => document.getElementById("phase-1")?.scrollIntoView({ behavior: "smooth" })}
          className="mt-16 flex flex-col items-center gap-2 cursor-pointer group"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-[#CCFF00]/60 group-hover:text-[#CCFF00] transition-colors" />
          </motion.div>
          <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-[#CCFF00]/50 group-hover:text-[#CCFF00]/80 transition-colors">
            Mühendisliği Keşfet
          </span>
        </motion.div>
      </motion.section>

      {/* Phase 1: AI Doctor & Otonom Zekâ */}
      <motion.section
        id="phase-1"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="relative z-10 px-6 md:px-12 pb-32 max-w-[1400px] mx-auto"
      >
        <motion.p
          variants={item}
          className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-4 text-center"
          style={{ color: "#CCFF00" }}
        >
          FAZ 1: AI DOCTOR & OTONOM ZEKÂ
        </motion.p>
        <motion.h2
          variants={item}
          className="text-3xl sm:text-3xl md:text-5xl font-bold text-white text-center mb-12"
        >
          Sizin İçin Düşünen, Analiz Eden ve Uyaran Bir Asistan
        </motion.h2>

        <motion.div
          variants={container}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {aiDoctorFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className={`bg-[#0a0a0a] border border-white/[0.05] rounded-3xl p-6 md:p-8 hover:border-[#CCFF00]/40 transition-all duration-500 relative overflow-hidden transform-gpu will-change-transform [transform:translateZ(0)] ${feature.colSpan}`}
              style={{
                background: "radial-gradient(ellipse at 30% 0%, hsla(68,100%,50%,0.04), transparent 70%), #0a0a0a",
              }}
            >
              <div className="w-10 h-10 rounded-full border border-[#CCFF00]/30 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Phase 2: Operations */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="relative z-10 px-6 md:px-12 pt-8 md:pt-12 pb-32 max-w-6xl mx-auto"
      >
        <motion.p
          variants={item}
          className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-4 text-center"
          style={{ color: "#CCFF00" }}
        >
          Faz 2: Operasyon
        </motion.p>
        <motion.h2
          variants={item}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-12"
        >
          Saha Kontrolü ve Atlet Yönetimi
        </motion.h2>

        <motion.div
          variants={container}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {operationsFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className={`bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-3xl p-6 md:p-8 hover:border-[#CCFF00]/40 transition-all duration-500 relative overflow-hidden transform-gpu will-change-transform backface-hidden [transform:translateZ(0)] ${feature.colSpan === 2 ? "md:col-span-2" : "md:col-span-1"}`}
              style={{
                background: "radial-gradient(ellipse at 30% 0%, hsla(68,100%,50%,0.04), transparent 70%)",
              }}
            >
              <div className="w-10 h-10 rounded-full border border-[#CCFF00]/30 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Phase 3: Institutional & Finance */}
      <motion.section
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="relative z-10 px-6 md:px-12 pt-8 md:pt-12 pb-32 max-w-6xl mx-auto"
      >
        <motion.p
          variants={item}
          className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-4 text-center"
          style={{ color: "#CCFF00" }}
        >
          Faz 3: Kurumsallaşma & Finans
        </motion.p>
        <motion.h2
          variants={item}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-12"
        >
          Bir Antrenörden Daha Fazlası Olun
        </motion.h2>

        <motion.div
          variants={container}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
        >
          {financeFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className={`bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-3xl p-6 md:p-8 hover:border-[#CCFF00]/40 transition-all duration-500 relative overflow-hidden transform-gpu will-change-transform backface-hidden [transform:translateZ(0)] ${feature.colSpan === 2 ? "md:col-span-2" : "md:col-span-1"}`}
              style={{
                background: "radial-gradient(ellipse at 30% 0%, hsla(68,100%,50%,0.04), transparent 70%)",
              }}
            >
              <div className="w-10 h-10 rounded-full border border-[#CCFF00]/30 flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-[#CCFF00]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Trust Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="relative z-10 max-w-2xl mx-auto px-6 pb-20 text-center"
      >
        <p className="text-sm text-white/40 leading-relaxed">
          Sınırlı Beta Kontenjanı: Sadece{" "}
          <span className="text-[#CCFF00]/70 font-semibold">50 Elit Antrenör</span>{" "}
          kabul edilecektir. Erken erişim ve ömür boyu kurucu avantajları için yerinizi ayırtın.
        </p>
      </motion.div>

      {/* Coach Form */}
      <motion.section
        id="coach-form"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 px-6 md:px-12 pb-32 max-w-xl mx-auto"
      >
        <motion.p
          variants={item}
          className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-4 text-center"
          style={{ color: "#CCFF00" }}
        >
          Erken Erişim
        </motion.p>
        <motion.h2
          variants={item}
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-12"
        >
          Komuta Merkezine Geçiş
        </motion.h2>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-10"
          >
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#CCFF00] flex items-center justify-center">
              <Rocket className="w-7 h-7 text-[#CCFF00]" />
            </div>
            <h3 className="text-white font-mono font-bold text-lg tracking-wider uppercase">
              Kayıt Alındı
            </h3>
            <p className="text-white/60 text-sm">
              Koç Komuta Merkezi hazır olduğunda seninle iletişime geçeceğiz.
            </p>
          </motion.div>
        ) : (
          <motion.form
            variants={item}
            onSubmit={handleSubmit}
            className="w-full space-y-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 md:p-10"
          >
            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Adınız Soyadınız"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-12 rounded-lg bg-white/[0.05] border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/30 transition-colors"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="email"
                placeholder="Profesyonel E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 rounded-lg bg-white/[0.05] border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/30 transition-colors"
              />
            </div>

            {/* Specialty */}
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full h-12 rounded-lg bg-white/[0.05] border border-white/10 px-4 text-sm text-white/70 appearance-none focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/30 transition-colors"
              >
                <option value="" disabled className="bg-black text-white/40">
                  Uzmanlık Alanınız
                </option>
                <option value="bodybuilding" className="bg-black text-white">Vücut Geliştirme</option>
                <option value="strength" className="bg-black text-white">Güç / Kondisyon</option>
                <option value="functional" className="bg-black text-white">Fonksiyonel Fitness</option>
                <option value="dietitian" className="bg-black text-white">Diyetisyen</option>
              </select>
            </div>

            {/* Athlete Count */}
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <select
                value={athleteCount}
                onChange={(e) => setAthleteCount(e.target.value)}
                className="w-full h-12 rounded-lg bg-white/[0.05] border border-white/10 px-4 text-sm text-white/70 appearance-none focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/30 transition-colors"
              >
                <option value="" disabled className="bg-black text-white/40">
                  Aktif Sporcu Sayınız
                </option>
                <option value="1-10" className="bg-black text-white">1 – 10</option>
                <option value="11-50" className="bg-black text-white">11 – 50</option>
                <option value="50+" className="bg-black text-white">50+</option>
              </select>
            </div>

            {/* Instagram */}
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="@instagram (opsiyonel)"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full h-12 rounded-lg bg-white/[0.05] border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/30 transition-colors"
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={isSubmitting ? {} : { scale: 1.02 }}
              whileTap={isSubmitting ? {} : { scale: 0.98 }}
              className="relative w-full h-14 mt-4 rounded-xl font-bold text-sm tracking-wider uppercase text-black bg-[#CCFF00] overflow-hidden transition-shadow hover:shadow-[0_0_30px_hsla(68,100%,50%,0.5)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sisteme Kaydediliyor...
                  </>
                ) : (
                  "Koç Bekleme Listesine Katıl 🚀"
                )}
              </span>
              {!isSubmitting && (
                <motion.span
                  className="absolute inset-0 rounded-xl border-2 border-[#CCFF00]"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.button>
          </motion.form>
        )}
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20 font-mono tracking-wide">
            © 2026 Dynabolic OS. All Systems Operational.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/15 hover:text-white/40 cursor-pointer transition-colors">
              Gizlilik Politikası
            </span>
            <span className="text-xs text-white/20">|</span>
            <span className="text-xs text-white/15 hover:text-white/40 cursor-pointer transition-colors">
              Kullanım Koşulları
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CoachWaitlist;
