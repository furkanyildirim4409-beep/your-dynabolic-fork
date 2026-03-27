import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Bell, Shield, LogOut, AlertTriangle, TrendingUp, Target, Coins, ChevronRight, Camera, WifiOff, Ruler, Info, Users, Loader2 } from "lucide-react";
import RealisticBodyAvatar from "@/components/RealisticBodyAvatar";
import BioCoinWallet from "@/components/BioCoinWallet";
import BodyScanUpload from "@/components/BodyScanUpload";
import BloodworkUpload from "@/components/BloodworkUpload";
import WearableDeviceSync from "@/components/WearableDeviceSync";
import TransformationTimeline from "@/components/profile/TransformationTimeline";
import WeightHistoryChart from "@/components/WeightHistoryChart";
import SettingsPanel from "@/components/SettingsPanel";
import UpdateMeasurementsModal from "@/components/UpdateMeasurementsModal";

import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { useOfflineMode } from "@/context/OfflineContext";
import { useAuth } from "@/context/AuthContext";
import { useBodyMeasurements, calcMuscleMass, calcBMR, calcTDEE } from "@/hooks/useBodyMeasurements";


const Profil = () => {
  const [timelineValue, setTimelineValue] = useState([50]);
  const [showSettings, setShowSettings] = useState(false);
  const [showBodyScan, setShowBodyScan] = useState(false);
  const [showMeasurements, setShowMeasurements] = useState(false);
  
  const { isOffline } = useOfflineMode();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { latest: latestMeasurement } = useBodyMeasurements();
  
  
  // Base values from real data or defaults
  const hasRealBodyFat = latestMeasurement?.body_fat_pct && Number(latestMeasurement.body_fat_pct) > 0;
  const currentBodyFat = hasRealBodyFat ? Number(latestMeasurement.body_fat_pct) : null;
  const profileWeight = profile?.current_weight ? Number(profile.current_weight) : null;
  const recalculatedMuscleMass =
    currentBodyFat != null && profileWeight != null
      ? calcMuscleMass(profileWeight, currentBodyFat)
      : null;
  const currentMuscleMass =
    recalculatedMuscleMass ??
    (latestMeasurement?.muscle_mass_kg ? Number(latestMeasurement.muscle_mass_kg) : null);
  const currentWaist = latestMeasurement?.waist ? Number(latestMeasurement.waist) : 85;

  // BMR calculation from profile data
  const profileAny = profile as Record<string, unknown> | null;
  const profileHeight = profileAny?.height_cm ? Number(profileAny.height_cm) : null;
  const profileGender = (profileAny?.gender as "male" | "female") ?? "male";
  const profileBirthDate = profileAny?.birth_date ? String(profileAny.birth_date) : null;
  const profileAge = profileBirthDate
    ? Math.floor((Date.now() - new Date(profileBirthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;
  const calculatedBMR =
    profileWeight && profileHeight && profileAge
      ? calcBMR(profileWeight, profileHeight, profileAge, profileGender)
      : null;
  const profileActivityLevel = (profileAny?.activity_level as string) ?? "moderate";
  const calculatedTDEE = calculatedBMR ? calcTDEE(calculatedBMR, profileActivityLevel) : null;

  // Timeline slider always controls projection — interpolate from current toward goal
  const progress = timelineValue[0] / 100;
  const goalWaist = currentWaist * 0.85; // 15% waist reduction target
  const projectedWaist = currentWaist - (currentWaist - goalWaist) * progress;
  const waistScale = projectedWaist / 85;

  const bodyStats = [
    { label: "Boy", value: profileHeight ? `${profileHeight} cm` : "—" },
    { label: "Kilo", value: profile?.current_weight ? `${profile.current_weight} kg` : "—" },
    { label: "Yağ Oranı", value: latestMeasurement?.body_fat_pct && Number(latestMeasurement.body_fat_pct) > 0 ? `%${latestMeasurement.body_fat_pct}` : "—", highlight: true },
    { label: "Kas Kütlesi", value: currentMuscleMass != null ? `${currentMuscleMass} kg` : "—", highlight: true, tooltip: "Yağsız Vücut Kütlesi (LBM) baz alınarak hesaplanmıştır" },
    { label: "BMI", value: profileWeight && profileHeight ? (profileWeight / ((profileHeight / 100) ** 2)).toFixed(1) : "—" },
    { label: "BMR", value: calculatedBMR ? `${calculatedBMR.toLocaleString()} kcal` : "—", tooltip: "Mifflin-St Jeor formülüyle hesaplanmıştır" },
    { label: "TDEE", value: calculatedTDEE ? `${calculatedTDEE.toLocaleString()} kcal` : "—", highlight: true, tooltip: "BMR × aktivite çarpanı ile günlük kalori ihtiyacı" },
  ];

  const recoveryZones = [
    { zone: "Göğüs", status: "Toparlanma Gerekiyor", severity: "high" },
    { zone: "Omuz", status: "Toparlanma Gerekiyor", severity: "high" },
    { zone: "Bacak", status: "Hazır", severity: "ok" },
    { zone: "Sırt", status: "Yarın Hazır", severity: "medium" },
  ];

  const handleSettingsAction = async (action: string) => {
    if (action === "logout") {
      await signOut();
      navigate("/login", { replace: true });
    } else if (action === "athletes") {
      navigate("/sporcularim");
    } else {
      toast({
        title: `${action} (Demo)`,
        description: "Bu özellik yakında aktif olacak!",
      });
    }
  };

  const isCoach = profile?.role === "coach";

  const menuItems = [
    ...(isCoach ? [{ icon: Users, label: "Sporcularım", description: "Sporcu makro hedeflerini yönet", action: "athletes" }] : []),
    { icon: Settings, label: "Ayarlar", description: "Uygulama tercihlerini düzenle", action: "settings" },
    { icon: Bell, label: "Bildirimler", description: "Hatırlatıcıları yönet", action: "notifications" },
    { icon: Shield, label: "Gizlilik", description: "Veri paylaşım ayarları", action: "privacy" },
    { icon: LogOut, label: "Çıkış Yap", description: "Hesabından çık", danger: true, action: "logout" },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header with Bio-Coins */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground">PROFİL</h1>
          <p className="text-muted-foreground text-sm">Dijital İkiz & Vücut Analizi</p>
        </div>
        <BioCoinWallet balance={profile?.bio_coins ?? 0} showLabel />
      </div>

      {/* User ID Card Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-4 flex items-center gap-4 border border-primary/30"
      >
        <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center neon-glow-sm relative">
          <User className="w-10 h-10 text-primary" />
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] px-1.5 py-0.5 rounded-full font-bold">
            ELİT
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl text-foreground">{profile?.full_name || "SPORCU"}</h3>
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <p className="text-primary text-sm font-medium">{profile?.email}</p>
          <div className="flex gap-6 mt-3">
            <div className="text-center">
              <p className="font-display text-lg text-primary">847</p>
              <p className="text-muted-foreground text-[10px]">Antrenman</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg text-foreground">156</p>
              <p className="text-muted-foreground text-[10px]">Gün Serisi</p>
            </div>
            <div className="text-center">
              <p className="font-display text-lg text-foreground">12</p>
              <p className="text-muted-foreground text-[10px]">Rozet</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3D Avatar Section - Now Realistic */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-display text-lg text-foreground tracking-wide">
            DİJİTAL İKİZ
          </h2>
          <div className="flex items-center gap-1">
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] text-muted-foreground">CANLI</span>
          </div>
        </div>

        {/* Realistic 3D Avatar */}
        <RealisticBodyAvatar
          waistScale={waistScale}
          measurements={latestMeasurement ? {
            neck: latestMeasurement.neck,
            chest: latestMeasurement.chest,
            shoulder: latestMeasurement.shoulder,
            waist: latestMeasurement.waist,
            hips: latestMeasurement.hips,
            arm: latestMeasurement.arm,
            thigh: latestMeasurement.thigh,
          } : undefined}
        />

        {/* Recovery Alert */}
        <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div>
            <p className="text-destructive text-xs font-medium">
              KAS TOPARLANMASI GEREKİYOR
            </p>
            <p className="text-muted-foreground text-[10px]">
              Göğüs ve Omuz bölgeleri dinlenme gerektirir
            </p>
          </div>
        </div>
      </motion.div>

      {/* Timeline AI - Body Transformation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg text-foreground tracking-wide">
            ZAMAN YOLCULUĞU
          </h2>
        </div>

        {/* Timeline Slider */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">BUGÜN</span>
            <span className="text-primary font-medium">HEDEF (TEMMUZ 2026)</span>
          </div>
          
          <Slider
            value={timelineValue}
            onValueChange={setTimelineValue}
            max={100}
            step={1}
            className="w-full"
          />

          {/* Tooltip */}
          <div className="text-center">
            <span className="inline-block bg-primary/20 text-primary text-xs px-3 py-1 rounded-full">
              TAHMİNİ FİZİK: {Math.round(timelineValue[0])}% İlerleme
            </span>
          </div>

          {/* Projected Stats */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
            <div className="text-center p-2 bg-secondary/50 rounded-lg">
              <p className="text-muted-foreground text-[10px]">TAHMİNİ YAĞ</p>
              <p className="font-display text-lg text-stat-hrv">
                {currentBodyFat != null
                  ? `%${(currentBodyFat - progress * (currentBodyFat * 0.25)).toFixed(1)}`
                  : "—"}
              </p>
            </div>
            <div className="text-center p-2 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-1">
                <p className="text-muted-foreground text-[10px]">TAHMİNİ KAS</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent><p>Yağsız Vücut Kütlesi (LBM) baz alınarak hesaplanmıştır</p></TooltipContent>
                </Tooltip>
              </div>
              <p className="font-display text-lg text-primary">
                {currentMuscleMass != null
                  ? `${(currentMuscleMass + progress * 4).toFixed(1)}kg`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bio-Coins Earned Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg text-foreground tracking-wide">
            BIO-COIN CÜZDANI
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-primary/10 border border-primary/30 rounded-xl">
            <p className="font-display text-2xl text-primary">{(profile?.bio_coins ?? 0).toLocaleString()}</p>
            <p className="text-muted-foreground text-[10px]">TOPLAM</p>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-xl">
            <p className="font-display text-2xl text-foreground">+125</p>
            <p className="text-muted-foreground text-[10px]">BU HAFTA</p>
          </div>
          <div className="text-center p-3 bg-secondary/50 rounded-xl">
            <p className="font-display text-2xl text-foreground">3</p>
            <p className="text-muted-foreground text-[10px]">SATIN ALIM</p>
          </div>
        </div>

        <p className="text-muted-foreground text-xs mt-3 text-center">
          Her tamamlanan antrenman = Bio-Coin kazanırsın! 💪
        </p>
      </motion.div>

      {/* Wearable Device Sync */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.19 }}
      >
        <WearableDeviceSync />
      </motion.div>

      {/* Recovery Zones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg text-foreground tracking-wide">
            TOPARLANMA BÖLGELERİ
          </h2>
        </div>

        <div className="space-y-2">
          {recoveryZones.map((zone, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl"
            >
              <span className="text-foreground text-sm">{zone.zone}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                zone.severity === "high" 
                  ? "bg-destructive/20 text-destructive" 
                  : zone.severity === "medium"
                  ? "bg-yellow-500/20 text-yellow-500"
                  : "bg-stat-hrv/20 text-stat-hrv"
              }`}>
                {zone.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weight History Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.23 }}
      >
        <WeightHistoryChart />
      </motion.div>


      {/* Body Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-foreground tracking-wide">
            VÜCUT VERİLERİ
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowMeasurements(true)}
            className="text-xs gap-1.5"
          >
            <Ruler className="w-3.5 h-3.5" />
            Güncelle
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {bodyStats.map((stat, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-xl ${
                stat.highlight 
                  ? "bg-primary/10 border border-primary/30" 
                  : "bg-secondary/50"
              }`}
            >
              <div className="flex items-center gap-1">
                <p className="text-muted-foreground text-xs">{stat.label}</p>
                {stat.tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent><p>{stat.tooltip}</p></TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className={`font-display text-lg mt-1 ${
                stat.highlight ? "text-primary" : "text-foreground"
              }`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>


      {/* Transformation Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <TransformationTimeline />
      </motion.div>

      {/* Body Scan Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32 }}
        className="glass-card p-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Camera className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg text-foreground tracking-wide">
            YENİ FOTOĞRAF EKLE
          </h2>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4">
          İlerlemenizi takip etmek için güncel vücut fotoğraflarınızı ekleyin.
        </p>
        
        {isOffline ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                disabled
                className="w-full h-12 font-display opacity-50 cursor-not-allowed"
              >
                <WifiOff className="w-5 h-5 mr-2" />
                FOTOĞRAF YÜKLE
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>İnternet bağlantısı gerekli</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button 
            onClick={() => setShowBodyScan(true)}
            className="w-full h-12 font-display neon-glow-sm"
          >
            <Camera className="w-5 h-5 mr-2" />
            FOTOĞRAF YÜKLE
          </Button>
        )}
      </motion.div>

      {/* Bloodwork Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <BloodworkUpload disabled={isOffline} />
      </motion.div>

      {/* Settings Menu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card p-4 space-y-2"
      >
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => item.action === "settings" ? setShowSettings(true) : handleSettingsAction(item.action)}
            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors text-left"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              item.danger ? "bg-destructive/20" : "bg-primary/10"
            }`}>
              <item.icon className={`w-5 h-5 ${item.danger ? "text-destructive" : "text-primary"}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium text-sm ${item.danger ? "text-destructive" : "text-foreground"}`}>
                {item.label}
              </p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </motion.div>

      {/* Settings Panel */}
      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Body Scan Upload Modal */}
      <BodyScanUpload 
        isOpen={showBodyScan} 
        onClose={() => setShowBodyScan(false)} 
      />

      {/* Update Measurements Modal */}
      <UpdateMeasurementsModal
        isOpen={showMeasurements}
        onClose={() => setShowMeasurements(false)}
      />

    </div>
  );
};

export default Profil;
