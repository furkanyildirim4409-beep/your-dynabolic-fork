import { useState } from "react";
import { motion } from "framer-motion";
import { User, Calendar, Apple, Dumbbell, Check, Star, Shield, ArrowLeft, ShoppingCart, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { hapticLight, hapticSuccess } from "@/lib/haptics";

const COACHING_BIOCOIN_ELIGIBLE = false;

interface CoachingPackage {
  id: string; title: string; subtitle: string; price: number; duration: string; icon: React.ReactNode; features: string[]; popular?: boolean; color: string;
}

const coachingPackages: CoachingPackage[] = [
  { id: "pkg-1", title: "1 Aylık Uzaktan Eğitim", subtitle: "Kişisel antrenman programı", price: 1500, duration: "1 Ay", icon: <Dumbbell className="w-6 h-6" />, features: ["Haftalık program güncelleme", "7/24 mesaj desteği", "Video form analizi", "Haftalık check-in görüşmesi"], color: "from-blue-500 to-cyan-500" },
  { id: "pkg-2", title: "Beslenme Danışmanlığı", subtitle: "Kişiselleştirilmiş diyet planı", price: 1200, duration: "1 Ay", icon: <Apple className="w-6 h-6" />, features: ["Detaylı beslenme analizi", "Makro hesaplama", "Supplement önerileri", "Haftalık menü planı"], color: "from-green-500 to-emerald-500" },
  { id: "pkg-3", title: "VIP Koçluk Paketi", subtitle: "Antrenman + Beslenme + Yaşam Koçluğu", price: 3500, duration: "1 Ay", icon: <Star className="w-6 h-6" />, features: ["Sınırsız iletişim", "Günlük program ayarı", "Aylık yüz yüze görüşme", "Özel supplement planı", "Mental koçluk desteği", "Öncelikli destek"], popular: true, color: "from-primary to-yellow-500" },
  { id: "pkg-4", title: "3 Aylık Dönüşüm", subtitle: "Uzun vadeli hedefler için", price: 4000, duration: "3 Ay", icon: <Calendar className="w-6 h-6" />, features: ["12 haftalık periodizasyon", "Aylık vücut analizi", "Progress fotoğraf takibi", "Deload hafta planlaması", "%20 indirimli fiyat"], color: "from-purple-500 to-pink-500" },
];

const Services = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleAddToCart = (pkg: CoachingPackage) => {
    hapticSuccess();
    addToCart({ id: `coaching-${pkg.id}`, title: pkg.title, price: pkg.price, image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop", coachName: "Koç Serdar", type: "coaching" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4 px-4 py-4 relative z-50">
          <button onClick={() => { hapticLight(); navigate(-1); }} className="relative z-50 flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary active:scale-95 transition-all" aria-label="Geri Dön"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <div><h1 className="font-display text-xl text-foreground">HİZMETLER</h1><p className="text-muted-foreground text-xs">Koçluk Paketleri</p></div>
        </div>
      </div>
      <div className="px-4 py-6 pb-32 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center mb-4"><User className="w-8 h-8 text-primary" /></div>
          <h2 className="font-display text-lg text-foreground mb-2">ELİT KOÇLUK DENEYİMİ</h2>
          <p className="text-muted-foreground text-sm">Profesyonel koçlarımızla hedeflerinize ulaşın.</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground"><Shield className="w-4 h-4 text-green-500" /><span>%100 Memnuniyet Garantisi</span></div>
        </motion.div>
        <div className="space-y-4">
          {coachingPackages.map((pkg, index) => (
            <motion.div key={pkg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`glass-card p-5 relative overflow-hidden ${pkg.popular ? "border-primary/50" : ""}`}>
              {pkg.popular && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">POPÜLER</div>}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${pkg.color} opacity-10 blur-3xl rounded-full`} />
              <div className="flex items-start gap-4 relative">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center text-white flex-shrink-0`}>{pkg.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div><h3 className="font-display text-sm text-foreground">{pkg.title}</h3><p className="text-xs text-muted-foreground">{pkg.subtitle}</p></div>
                    <div className="text-right flex-shrink-0"><p className="font-display text-xl text-primary">{pkg.price}₺</p><p className="text-[10px] text-muted-foreground">{pkg.duration}</p></div>
                  </div>
                  <div className="mt-3 space-y-1.5">{pkg.features.map((feature, i) => (<div key={i} className="flex items-center gap-2 text-xs text-muted-foreground"><Check className="w-3 h-3 text-primary flex-shrink-0" /><span>{feature}</span></div>))}</div>
                  {!COACHING_BIOCOIN_ELIGIBLE && (<div className="mt-3 flex items-center gap-2 p-2 bg-muted/30 rounded-lg border border-white/5"><Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" /><span className="text-[10px] text-muted-foreground">Bio-Coin koçluk hizmetlerinde kullanılamaz</span></div>)}
                  <Button onClick={() => handleAddToCart(pkg)} className={`w-full mt-4 h-10 font-display text-sm tracking-wider gap-2 ${pkg.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-white/10 text-foreground hover:bg-white/20"}`}><ShoppingCart className="w-4 h-4" />SEPETE EKLE</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-6 py-4">
          <div className="text-center"><p className="font-display text-xl text-primary">500+</p><p className="text-[10px] text-muted-foreground">Başarılı Dönüşüm</p></div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center"><p className="font-display text-xl text-primary">4.9</p><p className="text-[10px] text-muted-foreground">Ortalama Puan</p></div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center"><p className="font-display text-xl text-primary">10+</p><p className="text-[10px] text-muted-foreground">Yıl Deneyim</p></div>
        </motion.div>
      </div>
    </div>
  );
};

export default Services;
