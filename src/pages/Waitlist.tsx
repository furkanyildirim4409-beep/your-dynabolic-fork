import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Instagram, ChevronDown, Rocket, Loader2 } from "lucide-react";
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

const Waitlist = () => {
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
    <div className="relative min-h-[100dvh] w-full bg-black overflow-hidden flex items-center justify-center">
      {/* Grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(68 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(68 100% 50%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, hsla(68,100%,50%,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 w-full max-w-md mx-auto px-6 py-12 flex flex-col items-center"
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

        {/* Form or Success */}
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
            variants={item}
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
        <motion.p
          variants={item}
          className="mt-10 text-white/20 text-[10px] font-mono tracking-widest uppercase text-center"
        >
          © 2026 Dynabolic · Tüm Hakları Saklıdır
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Waitlist;
