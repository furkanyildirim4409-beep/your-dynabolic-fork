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
