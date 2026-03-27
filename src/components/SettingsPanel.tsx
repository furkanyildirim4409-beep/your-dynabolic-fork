import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Bell, Globe, Moon, Sun, WifiOff, Download, Smartphone, Lock, 
  HelpCircle, ChevronRight, Dumbbell, MessageSquare, CreditCard, 
  Users, FileText, AlertTriangle, BellRing, ClipboardCheck, UtensilsCrossed
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useSettings, Language, languageLabels } from "@/context/SettingsContext";
import { useOfflineMode } from "@/context/OfflineContext";
import { toast } from "@/hooks/use-toast";
import { hapticLight, hapticMedium, hapticSuccess } from "@/lib/haptics";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const { notifications, updateNotification, language, setLanguage, appearance, setAppearance } = useSettings();
  const { isOffline, setOfflineMode } = useOfflineMode();
  const [isExporting, setIsExporting] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: subscribePush } = usePushNotifications();

  const pushPermission = typeof Notification !== "undefined" ? Notification.permission : "default";

  const handlePushToggle = async () => {
    if (pushSubscribed) return;
    setIsPushLoading(true);
    hapticMedium();
    try {
      const ok = await subscribePush();
      if (ok) {
        hapticSuccess();
        toast({ title: "Push Bildirimleri Aktif 🔔", description: "Düello, mesaj ve koç uyarıları için bildirim alacaksınız." });
      } else {
        toast({ title: "İzin Verilmedi", description: "Tarayıcı bildirim izni reddedildi.", variant: "destructive" });
      }
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleExportData = async () => {
    if (isOffline) {
      toast({ title: "İnternet Gerekli", description: "Veri dışa aktarımı için internet bağlantısı gerekli.", variant: "destructive" });
      return;
    }
    hapticMedium();
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setIsExporting(false);
    hapticSuccess();
    toast({ title: "PDF Hazır! 📄", description: "Verileriniz başarıyla dışa aktarıldı." });
    toast({ title: "İndirme Başlatıldı", description: "dynabolic-verilerim.pdf kaydediliyor..." });
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    hapticLight();
    updateNotification(key, !notifications[key]);
  };

  const handleLanguageChange = (lang: Language) => {
    hapticLight();
    setLanguage(lang);
    toast({ title: `Dil değiştirildi: ${languageLabels[lang].flag} ${languageLabels[lang].native}`, description: "Uygulama yeniden başlatıldığında uygulanacak." });
  };

  const handleAppearanceChange = (mode: "dark" | "light") => {
    hapticLight();
    setAppearance(mode);
    toast({ title: mode === "dark" ? "Karanlık Mod Aktif 🌙" : "Aydınlık Mod Aktif ☀️", description: mode === "light" ? "Aydınlık mod yakında kullanılabilir olacak." : "" });
  };

  const handleOfflineToggle = () => {
    hapticMedium();
    setOfflineMode(!isOffline);
    toast({ title: !isOffline ? "Çevrimdışı Mod Aktif 📴" : "Çevrimiçi Mod Aktif 🌐", description: !isOffline ? "Önbellek verileri kullanılacak. Yüklemeler devre dışı." : "Tüm özellikler kullanılabilir." });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-white/10 overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 p-4 border-b border-white/10 bg-background/95 backdrop-blur-xl flex items-center justify-between">
            <h2 className="font-display text-lg text-foreground">AYARLAR</h2>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-6 pb-24">
            {/* Notifications */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Bildirimler</span>
              </div>
              <div className="glass-card divide-y divide-white/5">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Dumbbell className="w-4 h-4 text-primary" /></div>
                    <div><p className="text-foreground text-sm font-medium">Antrenman Hatırlatıcıları</p><p className="text-muted-foreground text-xs">Akşam antrenman push bildirimi</p></div>
                  </div>
                  <Switch checked={notifications.workoutReminders} onCheckedChange={() => handleNotificationToggle("workoutReminders")} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center"><ClipboardCheck className="w-4 h-4 text-orange-400" /></div>
                    <div><p className="text-foreground text-sm font-medium">Check-in Hatırlatıcısı</p><p className="text-muted-foreground text-xs">Sabah günlük check-in push bildirimi</p></div>
                  </div>
                  <Switch checked={notifications.checkinReminders} onCheckedChange={() => handleNotificationToggle("checkinReminders")} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center"><UtensilsCrossed className="w-4 h-4 text-amber-400" /></div>
                    <div><p className="text-foreground text-sm font-medium">Öğün Hatırlatıcısı</p><p className="text-muted-foreground text-xs">14:00'te yemek kaydı yoksa bildirim</p></div>
                  </div>
                  <Switch checked={notifications.mealReminders} onCheckedChange={() => handleNotificationToggle("mealReminders")} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-blue-400" /></div>
                    <div><p className="text-foreground text-sm font-medium">Koç Mesajları</p><p className="text-muted-foreground text-xs">Koçunuzdan gelen mesajlar</p></div>
                  </div>
                  <Switch checked={notifications.coachMessages} onCheckedChange={() => handleNotificationToggle("coachMessages")} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-400" /></div>
                    <div><p className="text-foreground text-sm font-medium">Ödemeler</p><p className="text-muted-foreground text-xs">Fatura ve ödeme bildirimleri</p></div>
                  </div>
                  <Switch checked={notifications.payments} onCheckedChange={() => handleNotificationToggle("payments")} />
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center"><Users className="w-4 h-4 text-purple-400" /></div>
                    <div><p className="text-foreground text-sm font-medium">Topluluk Bildirimleri</p><p className="text-muted-foreground text-xs">Meydan okumalar ve liderlik</p></div>
                  </div>
                  <Switch checked={notifications.communityAlerts} onCheckedChange={() => handleNotificationToggle("communityAlerts")} />
                </div>
                {pushSupported && (
                  <div className="p-4 space-y-3">
                    <div className="rounded-xl bg-secondary/30 backdrop-blur border border-border/50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
                            <BellRing className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-foreground text-sm font-semibold">Push Bildirimleri</p>
                              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                pushPermission === "granted" ? "bg-emerald-500/15 text-emerald-400" :
                                pushPermission === "denied" ? "bg-destructive/15 text-destructive" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  pushPermission === "granted" ? "bg-emerald-400" :
                                  pushPermission === "denied" ? "bg-destructive" :
                                  "bg-muted-foreground"
                                }`} />
                                {pushPermission === "granted" ? "Aktif" : pushPermission === "denied" ? "Engelli" : "Kapalı"}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs mt-0.5">Yeni düellolar, mesajlar ve koç uyarıları için anlık bildirim al.</p>
                          </div>
                        </div>
                        <Switch
                          checked={pushSubscribed}
                          onCheckedChange={handlePushToggle}
                          disabled={isPushLoading || pushSubscribed}
                        />
                      </div>
                      {pushPermission === "denied" && (
                        <p className="text-[11px] text-muted-foreground/70 bg-destructive/5 rounded-lg px-3 py-2 border border-destructive/10">
                          ⚠️ Bildirimler tarayıcı ayarlarından engellenmiş. Etkinleştirmek için tarayıcı site ayarlarından bildirimlere izin verin.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Tercihler</span>
              </div>
              <div className="glass-card divide-y divide-white/5">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Globe className="w-4 h-4 text-primary" /></div>
                    <div><p className="text-foreground text-sm font-medium">Dil</p><p className="text-muted-foreground text-xs">Uygulama dilini seç</p></div>
                  </div>
                  <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
                    <SelectTrigger className="w-32 h-9 bg-secondary border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      {(Object.keys(languageLabels) as Language[]).map((lang) => (
                        <SelectItem key={lang} value={lang} className="text-foreground">
                          <span className="flex items-center gap-2"><span>{languageLabels[lang].flag}</span><span>{languageLabels[lang].native}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      {appearance === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                    </div>
                    <div><p className="text-foreground text-sm font-medium">Görünüm</p><p className="text-muted-foreground text-xs">Tema tercihini seç</p></div>
                  </div>
                  <div className="flex bg-secondary rounded-lg p-1">
                    <button onClick={() => handleAppearanceChange("dark")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${appearance === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      <Moon className="w-3 h-3 inline mr-1" />Koyu
                    </button>
                    <button onClick={() => handleAppearanceChange("light")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${appearance === "light" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      <Sun className="w-3 h-3 inline mr-1" />Açık
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* System */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <WifiOff className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Sistem</span>
              </div>
              <div className="glass-card divide-y divide-white/5">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isOffline ? "bg-yellow-500/20" : "bg-secondary"}`}>
                      <WifiOff className={`w-4 h-4 ${isOffline ? "text-yellow-400" : "text-muted-foreground"}`} />
                    </div>
                    <div><p className="text-foreground text-sm font-medium">Çevrimdışı Mod</p><p className="text-muted-foreground text-xs">Test için önbellek verileri kullan</p></div>
                  </div>
                  <Switch checked={isOffline} onCheckedChange={handleOfflineToggle} />
                </div>
                <button onClick={handleExportData} disabled={isExporting} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors disabled:opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      {isExporting ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><FileText className="w-4 h-4 text-primary" /></motion.div>
                      ) : (
                        <Download className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="text-foreground text-sm font-medium">{isExporting ? "PDF Oluşturuluyor..." : "Verilerimi Dışa Aktar"}</p>
                      <p className="text-muted-foreground text-xs">{isExporting ? "Lütfen bekleyin" : "Tüm verilerinizi PDF olarak indirin"}</p>
                    </div>
                  </div>
                  {!isExporting && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => toast({ title: "Cihaz Bağlantısı (Demo)" })} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><Smartphone className="w-4 h-4 text-muted-foreground" /></div>
                    <div className="text-left"><p className="text-foreground text-sm font-medium">Cihaz Bağlantısı</p><p className="text-muted-foreground text-xs">Akıllı saat ve bantlar</p></div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Account */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Hesap</span>
              </div>
              <div className="glass-card divide-y divide-white/5">
                <button onClick={() => toast({ title: "Gizlilik Ayarları (Demo)" })} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><Lock className="w-4 h-4 text-muted-foreground" /></div>
                    <div className="text-left"><p className="text-foreground text-sm font-medium">Gizlilik</p><p className="text-muted-foreground text-xs">Veri paylaşım ayarları</p></div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => toast({ title: "Yardım & Destek (Demo)" })} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center"><HelpCircle className="w-4 h-4 text-muted-foreground" /></div>
                    <div className="text-left"><p className="text-foreground text-sm font-medium">Yardım & Destek</p><p className="text-muted-foreground text-xs">SSS ve iletişim</p></div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Offline Warning */}
            {isOffline && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400 text-sm font-medium">Çevrimdışı Mod Aktif</p>
                  <p className="text-muted-foreground text-xs mt-1">Yükleme özellikleri devre dışı. Veriler önbellekten gösteriliyor.</p>
                </div>
              </motion.div>
            )}

            {/* App Version */}
            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-muted-foreground text-xs">DYNABOLIC v1.0.0</p>
              <p className="text-muted-foreground/50 text-[10px] mt-1">© 2026 Dynabolic Labs</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsPanel;
