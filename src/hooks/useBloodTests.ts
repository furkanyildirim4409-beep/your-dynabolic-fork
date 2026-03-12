import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface BloodTestBiomarker {
  name: string;
  value: number;
  unit: string;
  ref: string;
  status: "normal" | "low" | "high";
  change?: number;
}

export interface BloodTest {
  id: string;
  user_id: string;
  date: string;
  file_name: string;
  document_url: string;
  status: string;
  coach_notes: string | null;
  extracted_data: BloodTestBiomarker[];
  created_at: string;
}

const generateMockBiomarkers = (): BloodTestBiomarker[] => {
  const rand = (min: number, max: number) => +(min + Math.random() * (max - min)).toFixed(1);
  const vitD = rand(15, 55);
  const ferritin = rand(18, 120);
  const testo = rand(400, 850);
  const cortisol = rand(8, 22);
  const tsh = rand(0.5, 4.5);
  const hb = rand(12.5, 17.5);
  const crp = rand(0.1, 5);
  const b12 = rand(180, 900);
  const creatinin = rand(0.6, 1.4);
  const ast = rand(10, 50);
  const alt = rand(7, 56);
  const ck = rand(30, 300);
  const mg = rand(1.5, 2.5);

  const check = (val: number, low: number, high: number): "normal" | "low" | "high" =>
    val < low ? "low" : val > high ? "high" : "normal";

  return [
    { name: "Testosteron", value: testo, unit: "ng/dL", ref: "300-1000", status: check(testo, 300, 1000) },
    { name: "Kortizol", value: cortisol, unit: "µg/dL", ref: "6-23", status: check(cortisol, 6, 23) },
    { name: "TSH", value: tsh, unit: "mIU/L", ref: "0.4-4.0", status: check(tsh, 0.4, 4.0) },
    { name: "Vitamin D", value: vitD, unit: "ng/mL", ref: "30-100", status: check(vitD, 30, 100) },
    { name: "Vitamin B12", value: b12, unit: "pg/mL", ref: "200-900", status: check(b12, 200, 900) },
    { name: "Ferritin", value: ferritin, unit: "ng/mL", ref: "30-400", status: check(ferritin, 30, 400) },
    { name: "Hemoglobin", value: hb, unit: "g/dL", ref: "13.5-17.5", status: check(hb, 13.5, 17.5) },
    { name: "CRP", value: crp, unit: "mg/L", ref: "0-3", status: check(crp, 0, 3) },
    { name: "Kreatin Kinaz (CK)", value: ck, unit: "U/L", ref: "30-200", status: check(ck, 30, 200) },
    { name: "Kreatinin", value: creatinin, unit: "mg/dL", ref: "0.7-1.3", status: check(creatinin, 0.7, 1.3) },
    { name: "AST", value: ast, unit: "U/L", ref: "10-40", status: check(ast, 10, 40) },
    { name: "ALT", value: alt, unit: "U/L", ref: "7-56", status: check(alt, 7, 56) },
    { name: "Magnezyum", value: mg, unit: "mg/dL", ref: "1.7-2.2", status: check(mg, 1.7, 2.2) },
  ];
};

export const useBloodTests = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<BloodTest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("blood_tests")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (!error && data) {
      setTests(data.map((d: any) => ({
        ...d,
        extracted_data: (d.extracted_data as BloodTestBiomarker[]) || [],
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchTests(); }, [fetchTests]);

  const uploadTest = useCallback(async (file: File, date: string) => {
    if (!user) return;
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("blood-test-pdfs")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Yükleme Hatası", description: uploadError.message, variant: "destructive" });
      return;
    }

    const mockBiomarkers = generateMockBiomarkers();

    const { error: insertError } = await supabase.from("blood_tests").insert({
      user_id: user.id,
      date,
      file_name: file.name,
      document_url: filePath,
      status: "analyzed",
      extracted_data: mockBiomarkers as any,
    });

    if (insertError) {
      toast({ title: "Kayıt Hatası", description: insertError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Tahlil Yüklendi ✅", description: "Kan tahlili başarıyla analiz edildi." });
    await fetchTests();
  }, [user, fetchTests]);

  const deleteTest = useCallback(async (id: string, documentUrl: string) => {
    await supabase.storage.from("blood-test-pdfs").remove([documentUrl]);
    const { error } = await supabase.from("blood_tests").delete().eq("id", id);
    if (error) {
      toast({ title: "Silme Hatası", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Silindi", description: "Kan tahlili başarıyla silindi." });
    await fetchTests();
  }, [fetchTests]);

  return { tests, loading, uploadTest, deleteTest, refetch: fetchTests };
};
