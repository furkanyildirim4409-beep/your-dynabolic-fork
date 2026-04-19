import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { MapPin, Truck, ShieldCheck, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  city: string;
  district: string;
  address: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  itemCount: number;
  onConfirm: (address: ShippingAddress) => void;
}

const TR_CITIES = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir",
  "Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli",
  "Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari",
  "Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir",
  "Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir",
  "Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat",
  "Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman",
  "Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce",
];

const schema = z.object({
  fullName: z.string().trim().min(2, "Ad Soyad en az 2 karakter").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+90|0)?5\d{9}$/, "Geçerli bir TR telefon numarası girin (5XX XXX XX XX)"),
  city: z.string().min(1, "Şehir seçin"),
  district: z.string().trim().min(2, "İlçe en az 2 karakter").max(60),
  address: z.string().trim().min(10, "Adres en az 10 karakter").max(500),
});

const formatTRY = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(n);

const NativeCheckoutModal = ({ isOpen, onClose, total, itemCount, onConfirm }: Props) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    const result = schema.safeParse({ fullName, phone, city, district, address });
    if (!result.success) {
      toast({
        title: "Eksik / Hatalı Bilgi",
        description: result.error.issues[0]?.message ?? "Lütfen formu kontrol edin.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    onConfirm(result.data as ShippingAddress);
    // parent will close — small UX delay reset
    setTimeout(() => setSubmitting(false), 400);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-white/10 text-foreground max-w-md p-0 overflow-hidden z-[9999] max-h-[90vh] flex flex-col">
        <DialogHeader className="p-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-primary" />
            <DialogTitle className="text-sm font-display uppercase tracking-wider text-foreground">
              TESLİMAT BİLGİLERİ
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Order summary */}
        <div className="px-5 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{itemCount} ürün</span>
          </div>
          <p className="font-display text-xl text-foreground font-bold">{formatTRY(total)}</p>
        </div>

        <AnimatePresence>
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 space-y-4 overflow-y-auto"
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Ad Soyad</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Adınız ve Soyadınız"
                className="bg-black/40 border-white/10 h-11"
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Telefon</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                placeholder="05XX XXX XX XX"
                className="bg-black/40 border-white/10 h-11 font-mono"
                maxLength={14}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Şehir</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="bg-black/40 border-white/10 h-11">
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent className="z-[10000] max-h-72">
                    {TR_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">İlçe</Label>
                <Input
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="İlçe"
                  className="bg-black/40 border-white/10 h-11"
                  maxLength={60}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Tam Adres</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Mahalle, sokak, bina no, daire no..."
                className="bg-black/40 border-white/10 min-h-[90px] resize-none"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground text-right">{address.length}/500</p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 bg-primary text-primary-foreground font-display tracking-wider hover:bg-primary/90 mt-2"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> İŞLENİYOR...
                </span>
              ) : (
                "GÜVENLİ ÖDEME ADIMINA GEÇ"
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 pt-1">
              <ShieldCheck className="w-3 h-3 text-green-500" />
              <span className="text-[11px] text-muted-foreground">
                Bilgileriniz şifrelenerek saklanır
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default NativeCheckoutModal;
