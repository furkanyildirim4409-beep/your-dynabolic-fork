import { motion } from "framer-motion";
import DynabolicLogo from "@/components/DynabolicLogo";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.4 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] } },
};

const CoachWaitlist = () => {
  const scrollToForm = () => {
    const el = document.getElementById("coach-form");
    if (el) el.scrollIntoView({ behavior: "smooth" });
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
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-32 md:pt-28 md:pb-44 max-w-5xl mx-auto"
      >
        {/* Eyebrow */}
        <motion.p
          variants={item}
          className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase mb-6"
          style={{ color: "#CCFF00" }}
        >
          Elit Antrenör İşletim Sistemi
        </motion.p>

        {/* Headline */}
        <motion.h1
          variants={item}
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
        <motion.p
          variants={item}
          className="text-base sm:text-lg md:text-xl text-white/50 leading-relaxed max-w-2xl mb-12"
        >
          100'den fazla sporcuyu sıfır hata, sıfır gecikme ve yapay zeka destekli
          otonom takip sistemiyle tek bir merkezden yönetin.
        </motion.p>

        {/* CTA */}
        <motion.button
          variants={item}
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
      </motion.section>

      {/* Form anchor for Part 3 */}
      <div id="coach-form" />
    </div>
  );
};

export default CoachWaitlist;
