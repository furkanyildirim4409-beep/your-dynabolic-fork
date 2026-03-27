import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Language = "tr" | "en" | "de";
export type AppearanceMode = "dark" | "light";

interface NotificationSettings {
  workoutReminders: boolean;
  checkinReminders: boolean;
  coachMessages: boolean;
  payments: boolean;
  communityAlerts: boolean;
}

interface SettingsContextType {
  notifications: NotificationSettings;
  updateNotification: (key: keyof NotificationSettings, value: boolean) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  appearance: AppearanceMode;
  setAppearance: (mode: AppearanceMode) => void;
}

const defaultNotifications: NotificationSettings = {
  workoutReminders: true,
  checkinReminders: true,
  coachMessages: true,
  payments: true,
  communityAlerts: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem("dynabolic-notifications");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultNotifications, ...parsed };
    }
    return defaultNotifications;
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("dynabolic-language");
    return (saved as Language) || "tr";
  });

  const [appearance, setAppearanceState] = useState<AppearanceMode>(() => {
    const saved = localStorage.getItem("dynabolic-appearance");
    return (saved as AppearanceMode) || "dark";
  });

  // Sync push-related prefs to profiles.notification_preferences in Supabase
  const syncToSupabase = useCallback(async (prefs: NotificationSettings) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("profiles").update({
      notification_preferences: {
        push: true,
        email: true,
        alerts: true,
        checkin_reminders: prefs.checkinReminders,
        workout_reminders: prefs.workoutReminders,
      },
    }).eq("id", user.id);
  }, []);

  // On mount, load prefs from Supabase profile if available
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("notification_preferences").eq("id", user.id).single();
      if (profile?.notification_preferences && typeof profile.notification_preferences === "object") {
        const remote = profile.notification_preferences as Record<string, unknown>;
        setNotifications(prev => {
          const merged = {
            ...prev,
            checkinReminders: remote.checkin_reminders !== undefined ? Boolean(remote.checkin_reminders) : prev.checkinReminders,
            workoutReminders: remote.workout_reminders !== undefined ? Boolean(remote.workout_reminders) : prev.workoutReminders,
          };
          localStorage.setItem("dynabolic-notifications", JSON.stringify(merged));
          return merged;
        });
      }
    })();
  }, []);

  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem("dynabolic-notifications", JSON.stringify(updated));
      // Sync push-related prefs to Supabase
      if (key === "checkinReminders" || key === "workoutReminders") {
        syncToSupabase(updated);
      }
      return updated;
    });
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("dynabolic-language", lang);
  };

  const setAppearance = (mode: AppearanceMode) => {
    setAppearanceState(mode);
    localStorage.setItem("dynabolic-appearance", mode);
  };

  return (
    <SettingsContext.Provider value={{ notifications, updateNotification, language, setLanguage, appearance, setAppearance }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};

export const languageLabels: Record<Language, { native: string; flag: string }> = {
  tr: { native: "Türkçe", flag: "🇹🇷" },
  en: { native: "English", flag: "🇬🇧" },
  de: { native: "Deutsch", flag: "🇩🇪" },
};