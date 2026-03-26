import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

export const useProofUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const uploadProof = async (file: File, challengeId: string, isChallenger: boolean) => {
    setIsUploading(true);
    try {
      const filePath = `${challengeId}/${Date.now()}_${file.name}`;
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
