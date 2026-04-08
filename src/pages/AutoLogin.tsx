import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DynabolicLoader from "@/components/DynabolicLoader";
import { toast } from "sonner";

const AutoLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("Token bulunamadı");
      return;
    }
    handleAutoLogin(token);
  }, []);

  const handleAutoLogin = async (token: string) => {
    try {
      // Exchange custom token for magic link credentials
      const { data, error: fnError } = await supabase.functions.invoke(
        "exchange-auto-login-token",
        { body: { token } }
      );

      if (fnError || data?.error) {
        setError(data?.error || fnError?.message || "Giriş başarısız");
        return;
      }

      // Use the hashed_token to verify OTP and create session
      const { error: authError } = await supabase.auth.verifyOtp({
        token_hash: data.hashed_token,
        type: "magiclink",
      });

      if (authError) {
        setError("Oturum açılamadı: " + authError.message);
        return;
      }

      toast.success("Otomatik giriş başarılı!");
      navigate("/", { replace: true });
    } catch {
      setError("Beklenmeyen bir hata oluştu");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-4">
        <div className="text-destructive text-lg font-semibold">⚠️ {error}</div>
        <button
          onClick={() => navigate("/login", { replace: true })}
          className="text-primary underline text-sm"
        >
          Giriş sayfasına git
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <DynabolicLoader />
      <p className="text-muted-foreground text-sm animate-pulse">Giriş yapılıyor...</p>
    </div>
  );
};

export default AutoLogin;
