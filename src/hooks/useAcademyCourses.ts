import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export interface AcademyModule {
  id: string;
  title: string;
  videoUrl: string;
  fileName?: string;
  order: number;
}

export interface AcademyCourse {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  type: string;
  modules: AcademyModule[];
  tags: string[] | null;
  created_at: string;
  coach_id: string;
}

export function useAcademyCourses() {
  const { profile } = useAuth();
  const coachId = profile?.coach_id;

  return useQuery({
    queryKey: ["academy-courses", coachId],
    queryFn: async (): Promise<AcademyCourse[]> => {
      if (!coachId) return [];

      const { data, error } = await supabase
        .from("academy_content")
        .select("*")
        .eq("coach_id", coachId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Academy fetch error:", error.message);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        thumbnail: row.thumbnail,
        type: row.type,
        tags: row.tags,
        created_at: row.created_at,
        coach_id: row.coach_id,
        modules: parseModules(row.modules),
      }));
    },
    enabled: !!coachId,
    staleTime: 5 * 60 * 1000,
  });
}

function parseModules(raw: unknown): AcademyModule[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[])
    .map((m) => ({
      id: String(m.id ?? crypto.randomUUID()),
      title: String(m.title ?? ""),
      videoUrl: String(m.videoUrl ?? ""),
      fileName: m.fileName ? String(m.fileName) : undefined,
      order: Number(m.order ?? 0),
    }))
    .sort((a, b) => a.order - b.order);
}
