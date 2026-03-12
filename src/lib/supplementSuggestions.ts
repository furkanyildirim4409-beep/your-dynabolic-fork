import type { BloodTestBiomarker } from "@/hooks/useBloodTests";

export interface SupplementSuggestion {
  id: string;
  name: string;
  reason: string;
  price: number;
  image: string;
}

const supplementMap: Record<string, { name: string; reason: string }> = {
  "Vitamin D":   { name: "Vitamin D3 + K2 (2000 IU)", reason: "Kan tahlilinizde Vitamin D seviyeniz düşük." },
  "Ferritin":    { name: "Demir Bisglisinat", reason: "Ferritin seviyeniz referans aralığının altında." },
  "Vitamin B12": { name: "Metilkobalamin B12 (1000 mcg)", reason: "B12 vitamininiz düşük, sinir sistemi desteği gerekli." },
  "Magnezyum":   { name: "Magnezyum Bisglisinat (400 mg)", reason: "Magnezyum seviyeniz düşük, kas ve uyku kalitesini etkileyebilir." },
  "Testosteron": { name: "Çinko + D3 + Ashwagandha", reason: "Testosteron seviyeniz düşük, doğal destek önerilir." },
};

const highSupplementMap: Record<string, { name: string; reason: string }> = {
  "CRP":      { name: "Omega-3 (EPA/DHA) 2000 mg", reason: "CRP yüksek — kronik inflamasyon riski. Omega-3 anti-inflamatuar destek sağlar." },
  "Kortizol": { name: "Ashwagandha + Magnezyum", reason: "Kortizol seviyeniz yüksek — stres yönetimi için adaptojenik destek." },
};

const supplementPrices: Record<string, number> = {
  "Vitamin D3 + K2 (2000 IU)": 120,
  "Demir Bisglisinat": 95,
  "Metilkobalamin B12 (1000 mcg)": 110,
  "Magnezyum Bisglisinat (400 mg)": 130,
  "Çinko + D3 + Ashwagandha": 180,
  "Omega-3 (EPA/DHA) 2000 mg": 250,
  "Ashwagandha + Magnezyum": 160,
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const generateSupplementSuggestions = (data: BloodTestBiomarker[]): SupplementSuggestion[] => {
  const suggestions: SupplementSuggestion[] = [];
  const seen = new Set<string>();

  data.forEach((b) => {
    let entry: { name: string; reason: string } | undefined;
    if (b.status === "low") entry = supplementMap[b.name];
    if (b.status === "high") entry = highSupplementMap[b.name];

    if (entry && !seen.has(entry.name)) {
      seen.add(entry.name);
      suggestions.push({
        id: `supp-${slugify(entry.name)}`,
        name: entry.name,
        reason: entry.reason,
        price: supplementPrices[entry.name] || 100,
        image: "/placeholder.svg",
      });
    }
  });

  return suggestions;
};
