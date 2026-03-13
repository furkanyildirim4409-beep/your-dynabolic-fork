import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import IcosahedronBackground from "@/components/IcosahedronBackground";

type ViewState = "login" | "signup" | "forgot";

const getSafeRedirectPath = (redirect: string | null) => {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) return "/";
  return redirect;
};

const Login = () => {
  const [view, setView] = useState<ViewState>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, profile, signIn, signUp, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = getSafeRedirectPath(searchParams.get("redirect"));

  // Role-based redirect after login
  useEffect(() => {
    if (!user || !profile || isLoading) return;

    if (profile.role === "athlete") {
      navigate(redirectPath, { replace: true });
    } else if (profile.role === "coach") {
      toast.error("Bu panel sadece Öğrenciler içindir. Koç paneline gidin.");
      signOut();
    }
  }, [user, profile, isLoading, navigate, redirectPath, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "login") {
        await signIn(email, password);
      } else if (view === "signup") {
        await signUp(email, password, "athlete", fullName);
      }
    } catch {
      // errors handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Lütfen e-posta adresinizi girin.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Şifre sıfırlama bağlantısı e-postanıza gönderildi!");
      setView("login");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6 relative overflow-hidden safe-area-inset">
      {/* 3D Icosahedron Background */}
      <IcosahedronBackground />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern" />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-primary/5 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl sm:text-5xl text-primary tracking-[0.2em] sm:tracking-[0.3em] text-neon-glow"
          >
            DYNABOLIC
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-muted-foreground text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] mt-1.5 sm:mt-2 uppercase"
          >
            Elit Sporcu Sistemi
          </motion.p>
        </div>

        {/* Card */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 sm:p-8 shadow-2xl">
          {/* Forgot Password View */}
          {view === "forgot" ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-foreground text-lg font-semibold mb-2">Şifremi Unuttum</h2>
              <p className="text-muted-foreground text-sm mb-6">
                E-posta adresinizi girin, şifre sıfırlama bağlantısı göndereceğiz.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="E-posta"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold tracking-wide"
                >
                  {loading ? (
                    <span className="animate-pulse">Gönderiliyor...</span>
                  ) : (
                    "Sıfırlama Bağlantısı Gönder"
                  )}
                </Button>
              </form>
              <button
                type="button"
                onClick={() => setView("login")}
                className="mt-4 text-sm text-primary hover:underline w-full text-center"
              >
                ← Giriş sayfasına dön
              </button>
            </motion.div>
          ) : (
            <>
              {/* Toggle */}
              <div className="flex mb-6 sm:mb-8 bg-secondary/30 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    view === "login"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={() => setView("signup")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    view === "signup"
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Kayıt Ol
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name (signup only) */}
                {view === "signup" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ad Soyad"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12"
                    />
                  </motion.div>
                )}

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="E-posta"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Şifre"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-secondary/20 border-white/10 focus:border-primary/50 h-12"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold tracking-wide mt-2"
                >
                  {loading ? (
                    <span className="animate-pulse">İşleniyor...</span>
                  ) : view === "login" ? (
                    <>
                      <LogIn className="mr-2 h-4 w-4" /> Giriş Yap
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" /> Kayıt Ol
                    </>
                  )}
                </Button>
              </form>

              {/* Forgot password link */}
              {view === "login" && (
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center"
                >
                  Şifremi Unuttum
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 w-8 h-8 sm:w-12 sm:h-12 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-8 h-8 sm:w-12 sm:h-12 border-r-2 border-t-2 border-primary/30" />
      <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-8 h-8 sm:w-12 sm:h-12 border-l-2 border-b-2 border-primary/30" />
      <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 w-8 h-8 sm:w-12 sm:h-12 border-r-2 border-b-2 border-primary/30" />
    </div>
  );
};

export default Login;
