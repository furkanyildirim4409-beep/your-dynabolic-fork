import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  date: string;
  weight: number | null;
  body_fat_pct: number | null;
  note: string | null;
  view: string;
  created_at: string;
}

export interface UploadMetadata {
  date: string;
  weight?: number;
  bodyFatPct?: number;
  note?: string;
  view?: string;
}

export function useProgressPhotos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    if (!user?.id) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("progress_photos" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) throw error;
      setPhotos((data as any[] as ProgressPhoto[]) ?? []);
    } catch (err) {
      console.error("fetchProgressPhotos error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const uploadSinglePhoto = useCallback(
    async (file: File, metadata: UploadMetadata) => {
      if (!user?.id) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error: storageError } = await supabase.storage
        .from("progress-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (storageError) throw storageError;

      const { data: urlData } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 year signed URL

      if (!urlData?.signedUrl) throw new Error("Failed to create signed URL");

      const { error: dbError } = await supabase
        .from("progress_photos" as any)
        .insert({
          user_id: user.id,
          photo_url: urlData.signedUrl,
          date: metadata.date,
          weight: metadata.weight ?? null,
          body_fat_pct: metadata.bodyFatPct ?? null,
          note: metadata.note ?? null,
          view: metadata.view ?? "front",
        } as any);

      if (dbError) throw dbError;
    },
    [user?.id]
  );

  const uploadPhotos = useCallback(
    async (files: { file: File; view: string }[], metadata: UploadMetadata) => {
      for (const { file, view } of files) {
        await uploadSinglePhoto(file, { ...metadata, view });
      }
      await fetchPhotos();
      toast.success(`${files.length} fotoğraf yüklendi!`);
    },
    [uploadSinglePhoto, fetchPhotos]
  );

  const deletePhoto = useCallback(
    async (id: string, photoUrl: string) => {
      if (!user?.id) return;

      try {
        const urlParts = photoUrl.split("/progress-photos/");
        if (urlParts[1]) {
          await supabase.storage
            .from("progress-photos")
            .remove([decodeURIComponent(urlParts[1])]);
        }

        await supabase
          .from("progress_photos" as any)
          .delete()
          .eq("id", id);

        await fetchPhotos();
        toast.success("Fotoğraf silindi");
      } catch (err) {
        console.error("deletePhoto error:", err);
        toast.error("Fotoğraf silinemedi");
      }
    },
    [user?.id, fetchPhotos]
  );

  return { photos, loading, uploadPhotos, deletePhoto, refetch: fetchPhotos };
}
