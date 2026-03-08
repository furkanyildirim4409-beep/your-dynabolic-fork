import { motion } from "framer-motion";

const DynabolicLoader = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex items-center justify-center">
    <div className="text-center">
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <h1 className="font-display text-4xl text-primary tracking-[0.3em] text-neon-glow">DYNABOLIC</h1>
      </motion.div>
      <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="mt-4 text-muted-foreground text-xs tracking-widest">YÜKLENİYOR...</motion.p>
      <div className="mt-6 w-48 h-1 mx-auto bg-secondary rounded-full overflow-hidden">
        <motion.div animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-1/3 h-full bg-primary rounded-full" />
      </div>
    </div>
  </motion.div>
);

export default DynabolicLoader;
