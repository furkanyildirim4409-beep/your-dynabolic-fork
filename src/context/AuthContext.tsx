import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  level?: number;
  bio_coins?: number;
  readiness_score?: number;
  streak?: number;
  current_weight?: number;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", userId)
      .single();
    if (error) { console.error("Profile fetch error:", error.message); return null; }
    return data as any;
  } catch { return null; }
}

async function fetchRole(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", userId)
      .single();
    if (error) { console.error("Role fetch error:", error.message); return "athlete"; }
    return (data as any)?.role || "athlete";
  } catch { return "athlete"; }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = async (u: User) => {
    const [p, r] = await Promise.all([fetchProfile(u.id), fetchRole(u.id)]);
    setProfile(p);
    setRole(r);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setTimeout(async () => {
            await loadUserData(newSession.user);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        loadUserData(existing.user).then(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); throw error; }
    toast.success("Giriş başarılı!");
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
    });
    if (error) { toast.error(error.message); throw error; }
    toast.success("Kayıt başarılı! E-postanızı kontrol edin.");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error(error.message); throw error; }
    setUser(null); setSession(null); setProfile(null); setRole(null);
    toast.success("Çıkış yapıldı.");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
