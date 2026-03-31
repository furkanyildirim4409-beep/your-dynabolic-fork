import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Instagram, ChevronDown, Rocket, Loader2, ScanLine, Activity, Microscope, Calculator, Target, TrendingUp, Medal, Timer, Gauge, Watch, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const gridStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};
const gridItem = {
  hidden: { opacity: 0, y: 30, willChange: "transform, opacity" },
  show: { opacity: 1, y: 0, willChange: "auto", transition: { duration: 0.5, ease: "easeOut" as const } },
};

const analysisFeaturesAthletes = [
  {
    icon: ScanLine,
    title: "AI Beslenme Tarayıcı (NutriScanner)",
    desc: "Tabağının fotoğrafını çek, yapay zeka içindeki protein, karbonhidrat ve yağ miktarını saniyeler içinde analiz etsin. Manuel veri girişine son.",
    colSpan: "md:col-span-2 lg:col-span-2",
  },
  {
    icon: User,
    title: "3D Dijital İkiz (Avatar)",
    desc: "Sadece rakamlara bakma. Ölçümlerini gir, vücudunun 3D modelini oluştur ve değişimi milimetrik bir avatar üzerinden canlı izle.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
  {
    icon: Activity,
    title: "Vision AI Form Analizi",
    desc: "Kamerayı önüne koy, setini yap. Yapay zeka eklem açılarını hesaplasın, formundaki hataları anlık olarak düzeltsin.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
  {
    icon: Microscope,
    title: "AI Doktor & Kan Tahlili",
    desc: "Kan tahlili PDF'ini yükle. Sistem hormon ve vitamin değerlerini okusun, sağlığın için en optimize beslenme ve supplement planını çıkarsın.",
    colSpan: "md:col-span-2 lg:col-span-2",
  },
  {
    icon: Calculator,
    title: "Dinamik Gramaj Motoru",
    desc: "100g pirinç yerine yanlışlıkla 130g mı yedin? Sistem o günkü diğer öğünlerini saniyeler içinde revize eder, hedefini korur.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
  {
    icon: Target,
    title: "Otonom Uyum Algoritması",
    desc: "Diyetine ve antrenmanına ne kadar sadıksın? Haftalık 'Uyum Skorunu' hesaplayan ve seni motive eden akıllı radar.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
];

const performanceFeaturesAthletes = [
  {
    icon: TrendingUp,
    title: "Progressive Overload Radarı",
    desc: "Hangi harekette kaç kg arttırdın? Toplam tonajını (Volume Load) grafiklerle izle, gelişiminin durduğu anı (plato) önceden fark et.",
    colSpan: "md:col-span-2 lg:col-span-2",
  },
  {
    icon: Medal,
    title: "PR & Rekor Arşivi",
    desc: "Kişisel rekorlarını (Personal Records) tarih ve video kanıtıyla arşivle. Her yeni rekorda BioCoin kazan.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
  {
    icon: Timer,
    title: "Gelişmiş Rest Timer",
    desc: "Hangi egzersiz için ne kadar dinlenmen gerektiğini bilen, sesli ve haptik (titreşimli) uyarı veren akıllı mola sistemi.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
  {
    icon: Gauge,
    title: "RPE & Tempo Kontrolü",
    desc: "Sadece set/tekrar değil; setin zorluk derecesini (RPE) ve hareketin hızını (Tempo) profesyonel vücut geliştiriciler düzeyinde takip et.",
    colSpan: "md:col-span-2 lg:col-span-2",
  },
  {
    icon: Watch,
    title: "Giyilebilir Cihaz Senkronu",
    desc: "Apple Health, Garmin ve Oura entegrasyonu. Adım sayın, uykun ve kalp atış hızın otomatik olarak uygulamaya aksın.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
  {
    icon: FileText,
    title: "Özel Antrenman Notları",
    desc: "Her set için özel notlar al, bir sonraki antrenmanda 'Geçen hafta burada ne yapmıştım?' karmaşasını bitir.",
    colSpan: "md:col-span-1 lg:col-span-1",
  },
];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [instagram, setInstagram] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("waitlist").insert([
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          goal: goal || null,
          instagram: instagram.trim() || null,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          toast.error("Bu e-posta adresi zaten kayıtlı!");
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
      {/* Grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(68 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(68 100% 50%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, hsla(68,100%,50%,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ═══════ HERO ═══════ */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 min-h-[100dvh] flex flex-col items-center justify-center px-6"
      >
        {/* Logo */}
        <motion.div variants={item} className="mb-8">
          <svg
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-28 h-28 drop-shadow-[0_0_30px_hsla(68,100%,50%,0.4)]"
          >
            <motion.path
              d="M 50 20 L 50 180 L 100 180 C 150 180 180 150 180 100 C 180 50 150 20 100 20 Z"
              stroke="#CCFF00"
              strokeWidth="5"
              fill="transparent"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, fill: "rgba(204,255,0,0.06)" }}
              transition={{ pathLength: { duration: 1.2 }, fill: { duration: 0.4, delay: 1 } }}
            />
            <motion.path
              d="M 110 50 L 90 95 L 115 95 L 95 150 L 135 105 L 110 105 Z"
              fill="#CCFF00"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1 }}
              style={{ transformOrigin: "center" }}
            />
          </svg>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="text-center font-mono font-bold text-xl sm:text-2xl tracking-[0.2em] uppercase mb-3"
          style={{
            color: "#CCFF00",
            textShadow: "0 0 20px hsla(68,100%,50%,0.5), 0 0 60px hsla(68,100%,50%,0.2)",
          }}
        >
          DYNABOLIC
        </motion.h1>
        <motion.p
          variants={item}
          className="text-center font-mono text-xs tracking-[0.15em] uppercase text-white/60 mb-6"
        >
          Özel Beta Ön Kayıt
        </motion.p>

        {/* Sub-headline */}
        <motion.p
          variants={item}
          className="text-center text-white/70 text-sm leading-relaxed mb-10 max-w-xs"
        >
          Sıradan kalori sayıcıları ve işe yaramayan programları unut.{" "}
          <span className="text-[#CCFF00]/90 font-semibold">
            Elit Sporcu İşletim Sistemi
          </span>{" "}
          yükleniyor… İlk deneyimleyen sen ol.
        </motion.p>

        {/* Scroll indicator */}
        <motion.a
          variants={item}
          href="#phase-1"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("phase-1")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mt-8 flex flex-col items-center gap-2 cursor-pointer group"
        >
          <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/40 group-hover:text-[#CCFF00]/70 transition-colors">
            Süper Güçlerini Keşfet
          </span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5 text-[#CCFF00]/60" />
          </motion.div>
        </motion.a>
      </motion.div>

      {/* ═══════ PHASE 1: AI & ANALYSIS ═══════ */}
      <motion.section
        id="phase-1"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        variants={gridStagger}
        className="max-w-[1400px] mx-auto mt-24 md:mt-32 px-6 pb-32"
      >
        {/* Header */}
        <motion.p
          variants={gridItem}
          className="text-center text-xs font-mono tracking-[0.3em] uppercase text-[#CCFF00] mb-4"
        >
          FAZ 1: YENİ NESİL ANALİZ & AI
        </motion.p>
        <motion.h2
          variants={gridItem}
          className="text-center text-3xl md:text-5xl font-bold text-white mb-12 md:mb-16"
        >
          Sizin İçin Düşünen Dijital İkiziniz
        </motion.h2>

        {/* Bento Grid */}
        <motion.div
          variants={gridStagger}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {analysisFeaturesAthletes.map((f) => (
            <motion.div
              key={f.title}
              variants={gridItem}
              className={`${f.colSpan} bg-[#0a0a0a] border border-white/[0.05] rounded-3xl p-6 md:p-8 hover:border-[#CCFF00]/40 transition-all duration-500 transform-gpu will-change-transform [transform:translateZ(0)] group`}
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 0%, hsla(68,100%,50%,0.03) 0%, #0a0a0a 70%)",
              }}
            >
              <f.icon className="w-8 h-8 text-[#CCFF00] mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-white font-semibold text-base md:text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* ═══════ FORM ═══════ */}
      <div className="relative z-10 max-w-md mx-auto px-6 py-24 flex flex-col items-center">
        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-[#CCFF00] flex items-center justify-center">
              <Rocket className="w-7 h-7 text-[#CCFF00]" />
            </div>
            <h2 className="text-white font-mono font-bold text-lg tracking-wider uppercase">
              Kayıt Alındı
            </h2>
            <p className="text-white/60 text-sm">
              Sistem seni listeye ekledi. Lansman yaklaştığında seninle iletişime geçeceğiz.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="w-full space-y-4"
          >
            {/* Name */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Adın Soyadın"
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
                placeholder="E-posta Adresin"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 rounded-lg bg-white/[0.05] border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/30 transition-colors"
              />
            </div>

            {/* Goal */}
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full h-12 rounded-lg bg-white/[0.05] border border-white/10 px-4 text-sm text-white/70 appearance-none focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/30 transition-colors"
              >
                <option value="" disabled className="bg-black text-white/40">
                  Şu Anki Ana Hedefin Nedir?
                </option>
                <option value="hipertrofi" className="bg-black text-white">
                  Sınırları Zorlamak (Hipertrofi)
                </option>
                <option value="definisyon" className="bg-black text-white">
                  Sistemi Temizlemek (Definisyon)
                </option>
                <option value="guc" className="bg-black text-white">
                  Motoru Güçlendirmek (Saf Güç)
                </option>
              </select>
            </div>

            {/* Instagram */}
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="@kullaniciadi (opsiyonel)"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full h-12 rounded-lg bg-white/[0.05] border border-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#CCFF00]/50 focus:ring-1 focus:ring-[#CCFF00]/30 transition-colors"
              />
            </div>

            {/* CTA */}
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
                    Kaydediliyor...
                  </>
                ) : (
                  "Bekleme Listesine Katıl 🚀"
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

        {/* Footer */}
        <p className="mt-10 text-white/20 text-[10px] font-mono tracking-widest uppercase text-center">
          © 2026 Dynabolic · Tüm Hakları Saklıdır
        </p>
      </div>
    </div>
  );
};

export default Waitlist;
