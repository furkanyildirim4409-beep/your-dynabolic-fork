import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name?: string;
  role?: string;
  avatar_url?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: "coach" | "athlete", fullName: string) => Promise<void>;
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
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) {
      console.error("Profile fetch error:", error.message);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(async () => {
            const p = await fetchProfile(newSession.user.id);
            setProfile(p);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        fetchProfile(existing.user.id).then((p) => {
          setProfile(p);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Giriş başarılı!");
  };

  const signUp = async (email: string, password: string, role: "coach" | "athlete", fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName },
      },
    });
    if (error) {
      toast.error(error.message);
      throw error;
    }

    if (data.user) {
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({ role, full_name: fullName })
        .eq("id", data.user.id);
      if (updateError) {
        console.error("Profile update error:", updateError.message);
      }
    }

    toast.success("Kayıt başarılı! E-postanızı kontrol edin.");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    toast.success("Çıkış yapıldı.");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};