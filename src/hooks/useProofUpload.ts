import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export const useProofUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const uploadProof = async (file: File, challengeId: string, isChallenger: boolean) => {
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Dosya çok büyük", description: "Lütfen maksimum 50MB boyutunda bir video/görsel yükleyin.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const sanitized = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9.\-_]/g, "_")
        .replace(/_+/g, "_");
      const filePath = `${challengeId}/${Date.now()}_${sanitized}`;
      const { error: uploadError } = await supabase.storage
        .from("challenge-proofs")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("challenge-proofs")
        .getPublicUrl(filePath);

      const field = isChallenger ? "proof_url" : "opponent_proof_url";
      const { error: updateError } = await supabase
        .from("challenges")
        .update({ [field]: urlData.publicUrl } as any)
        .eq("id", challengeId);
      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["my-challenges"] });
      toast({ title: "Kanıt yüklendi! 📸", description: "Dosyan başarıyla kaydedildi." });
    } catch (err: any) {
      toast({ title: "Yükleme başarısız", description: err.message || "Bir hata oluştu.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadProof, isUploading };
};
