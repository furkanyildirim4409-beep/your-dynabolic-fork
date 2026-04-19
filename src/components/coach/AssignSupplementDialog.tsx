import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, Pill, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts, type ShopifyProduct } from "@/lib/shopify";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  athleteId: string;
  athleteName: string;
}

const TIMINGS = [
  "Sabah", "Öğle", "Akşam", "Antrenman öncesi", "Antrenman sonrası", "Yatmadan",
];

export default function AssignSupplementDialog({ isOpen, onClose, athleteId, athleteName }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<ShopifyProduct | null>(null);
  const [dosage, setDosage] = useState("1 kapsül");
  const [timing, setTiming] = useState("Sabah");
  const [totalServings, setTotalServings] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearch(""); setDebounced(""); setSelected(null);
      setDosage("1 kapsül"); setTiming("Sabah"); setTotalServings(30);
    }
  }, [isOpen]);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shopify-products-coach-search", debounced],
    queryFn: () => getProducts({ limit: 20, query: debounced || undefined }),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const canSubmit = useMemo(
    () => !!selected && dosage.trim().length > 0 && timing.length > 0 && totalServings > 0 && !submitting,
    [selected, dosage, timing, totalServings, submitting],
  );

  const handleSubmit = async () => {
    if (!user || !selected) return;
    setSubmitting(true);
    const { error } = await supabase.from("assigned_supplements").insert({
      coach_id: user.id,
      athlete_id: athleteId,
      name_and_dosage: selected.title,
      dosage: dosage.trim(),
      timing,
      total_servings: totalServings,
      servings_left: totalServings,
      icon: "💊",
      is_active: true,
      shopify_product_id: selected.id,
      shopify_variant_id: selected.variantId,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Atama başarısız", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["assigned_supplements", athleteId] });
    toast({ title: "Takviye atandı 💊", description: `${selected.title} → ${athleteName}` });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-background border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" /> TAKVİYE ATA
          </DialogTitle>
          <DialogDescription>
            {athleteName} için Shopify mağazasından gerçek bir ürün seç.
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ürün ara (whey, kreatin, vitamin...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {isLoading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              )}
              {!isLoading && products.length === 0 && (
                <p className="text-center py-8 text-muted-foreground text-sm">
                  Ürün bulunamadı.
                </p>
              )}
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border transition-colors text-left"
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.imageAlt} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Pill className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-1">{p.title}</p>
                    <p className="text-xs text-primary font-display">
                      {p.price.toLocaleString()} {p.currencyCode === "TRY" ? "₺" : p.currencyCode}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              {selected.imageUrl && (
                <img src={selected.imageUrl} alt={selected.imageAlt} className="w-14 h-14 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium line-clamp-2">{selected.title}</p>
                <p className="text-xs text-primary font-display">
                  {selected.price.toLocaleString()} {selected.currencyCode === "TRY" ? "₺" : selected.currencyCode}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Değiştir</Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Doz</Label>
                <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="örn: 1 kapsül, 1 ölçek" />
              </div>
              <div>
                <Label>Zamanlama</Label>
                <Select value={timing} onValueChange={setTiming}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMINGS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Toplam Servis Sayısı</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={totalServings}
                  onChange={(e) => setTotalServings(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full font-display h-11">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> ATAMAYI ONAYLA</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
