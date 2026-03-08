import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import IcosahedronBackground from "@/components/IcosahedronBackground";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setIsRecovery(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Şifreler eşleşmiyor!"); return; }
    if (password.length < 6) { toast.error("Şifre en az 6 karakter olmalı!"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); } else { setSuccess(true); toast.success("Şifreniz başarıyla güncellendi!"); setTimeout(() => navigate("/login", { replace: true }), 2000); }
  };

  if (!isRecovery && !success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <IcosahedronBackground />
        <div className="absolute inset-0 grid-pattern" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center">
          <h1 className="font-display text-3xl text-primary tracking-[0.3em] text-neon-glow mb-4">DYNABOLIC</h1>
          <p className="text-muted-foreground text-sm">Geçersiz veya süresi dolmuş bağlantı.</p>
          <Button variant="outline" className="mt-6 border-primary/30 text-primary" onClick={() => navigate("/login")}>Giriş Sayfasına Dön</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <IcosahedronBackground />
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-primary tracking-[0.3em] text-neon-glow">DYNABOLIC</h1>
          <p className="text-muted-foreground text-xs tracking-[0.2em] mt-2">ŞİFRE SIFIRLAMA</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {success ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <p className="text-foreground font-medium">Şifreniz güncellendi!</p>
              <p className="text-muted-foreground text-sm mt-2">Yönlendiriliyorsunuz...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="password" placeholder="Yeni Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12" /></div>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="password" placeholder="Yeni Şifre (Tekrar)" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12" /></div>
              <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold tracking-wide">{loading ? <span className="animate-pulse">İşleniyor...</span> : "Şifreyi Güncelle"}</Button>
            </form>
          )}
        </div>
      </motion.div>
      <div className="absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-8 right-8 w-12 h-12 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 border-primary/30" />
    </div>
  );
};

export default ResetPassword;
