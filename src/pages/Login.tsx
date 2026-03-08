import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import IcosahedronBackground from "@/components/IcosahedronBackground";

type ViewState = "login" | "signup" | "forgot";

const Login = () => {
  const [view, setView] = useState<ViewState>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, role, signIn, signUp, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || isLoading) return;
    if (role === "coach") { toast.error("Bu panel sadece Öğrenciler içindir."); signOut(); }
    else navigate("/", { replace: true });
  }, [user, role, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { if (view === "login") await signIn(email, password); else if (view === "signup") await signUp(email, password, fullName); } catch {} finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Lütfen e-posta adresinizi girin."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success("Şifre sıfırlama bağlantısı gönderildi!"); setView("login"); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <IcosahedronBackground />
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="font-display text-5xl text-primary tracking-[0.3em] text-neon-glow">DYNABOLIC</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-muted-foreground text-xs tracking-[0.3em] mt-2 uppercase">Elit Sporcu Sistemi</motion.p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {view === "forgot" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-foreground text-lg font-semibold mb-2">Şifremi Unuttum</h2>
              <p className="text-muted-foreground text-sm mb-6">E-posta adresinizi girin.</p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12" /></div>
                <Button type="submit" disabled={loading} className="w-full h-12">{loading ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}</Button>
              </form>
              <button onClick={() => setView("login")} className="mt-4 text-sm text-primary hover:underline w-full text-center">← Giriş sayfasına dön</button>
            </motion.div>
          ) : (
            <>
              <div className="flex mb-8 bg-secondary/30 rounded-xl p-1">
                <button onClick={() => setView("login")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${view === "login" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground"}`}>Giriş Yap</button>
                <button onClick={() => setView("signup")} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${view === "signup" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground"}`}>Kayıt Ol</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {view === "signup" && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Ad Soyad" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12" /></motion.div>}
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12" /></div>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12" /></div>
                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold mt-2">{loading ? "İşleniyor..." : view === "login" ? <><LogIn className="mr-2 h-4 w-4" /> Giriş Yap</> : <><UserPlus className="mr-2 h-4 w-4" /> Kayıt Ol</>}</Button>
              </form>
              {view === "login" && <button onClick={() => setView("forgot")} className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center">Şifremi Unuttum</button>}
            </>
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

export default Login;
