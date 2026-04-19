import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Share2, Verified } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import PostCommentsDrawer from "@/components/PostCommentsDrawer";
import { useToggleLike } from "@/hooks/useSocialFeed";
import { useAuth } from "@/context/AuthContext";
import { usePostCommentsCount } from "@/hooks/usePostComments";

const CommentCountBadge = ({ postId }: { postId: string }) => {
  const { data: count } = usePostCommentsCount(postId);
  return <span className="text-xs">{count ?? 0}</span>;
};

const sharePost = async (postId: string, content?: string | null) => {
  const url = `${window.location.origin}/post/${postId}`;
  const shareData = {
    title: "Dynabolic Gönderisi",
    text: content ? content.substring(0, 50) + "..." : "Bu gönderiye göz at!",
    url,
  };
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try {
      await (navigator as any).share(shareData);
      return;
    } catch (err: any) {
      if (err?.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Bağlantı kopyalandı! (Masaüstü panosuna)");
  } catch {
    toast.error("Paylaşım başarısız");
  }
};

interface PostRow {
  id: string;
  coach_id: string;
  content: string | null;
  type: string | null;
  before_image_url: string | null;
  after_image_url: string | null;
  video_thumbnail_url: string | null;
  video_url: string | null;
  image_url: string | null;
  created_at: string;
  coach: { full_name: string; avatar_url: string | null } | null;
  likes_count: number;
  user_has_liked: boolean;
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<PostRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const { mutate: toggleLike } = useToggleLike();

  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      const { data: row } = await (supabase as any)
        .from("social_posts")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      if (!row) {
        setPost(null);
        setLoading(false);
        return;
      }
      const { data: coach } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", row.coach_id)
        .maybeSingle();
      const { count } = await (supabase as any)
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", id);
      let liked = false;
      if (user) {
        const { data: likeRow } = await (supabase as any)
          .from("post_likes")
          .select("id")
          .eq("post_id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        liked = !!likeRow;
      }
      if (!active) return;
      setPost({
        ...row,
        coach: coach ?? null,
        likes_count: count ?? 0,
        user_has_liked: liked,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, user?.id]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Geri">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display text-base text-foreground tracking-wide">GÖNDERİ</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4">
        {loading ? (
          <div className="glass-card overflow-hidden">
            <div className="p-4 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2 w-20" />
              </div>
            </div>
            <Skeleton className="aspect-square mx-4 rounded-lg" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : !post ? (
          <div className="glass-card p-8 text-center">
            <p className="text-muted-foreground text-sm">Gönderi bulunamadı.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
            <button
              onClick={() => post.coach_id && navigate(`/coach/${post.coach_id}`)}
              className="w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors"
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.coach?.avatar_url || ""} alt={post.coach?.full_name || ""} className="object-cover" />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {(post.coach?.full_name || "K").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1">
                  <span className="text-foreground text-sm font-medium">{post.coach?.full_name || "Koç"}</span>
                  <Verified className="w-4 h-4 text-primary fill-primary" />
                </div>
                <span className="text-muted-foreground text-xs">Elit Koç</span>
              </div>
            </button>

            {post.type === "transformation" && post.before_image_url && post.after_image_url && (
              <div className="grid grid-cols-2 gap-1 px-4">
                <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                  <img src={post.before_image_url} alt="Önce" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded">ÖNCE</span>
                </div>
                <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden border-2 border-primary/50">
                  <img src={post.after_image_url} alt="Sonra" className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded">SONRA</span>
                </div>
              </div>
            )}

            {post.type === "video" && post.video_thumbnail_url && (
              <div className="relative aspect-video mx-4 bg-muted rounded-lg overflow-hidden">
                <img src={post.video_thumbnail_url} alt="Video" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[20px] border-l-white border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                  </div>
                </div>
              </div>
            )}

            {post.type === "image" && post.image_url && (
              <div className="aspect-square mx-4 bg-muted rounded-lg overflow-hidden">
                <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}

            {post.type !== "transformation" && post.type !== "video" && !post.image_url && post.before_image_url && (
              <div className="aspect-square mx-4 bg-muted rounded-lg overflow-hidden">
                <img src={post.before_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}

            <div className="p-4">
              <p className="text-foreground text-sm whitespace-pre-wrap">{post.content}</p>
            </div>

            <div className="px-4 pb-4 flex items-center gap-6">
              <button
                onClick={() => toggleLike({ postId: post.id, isCurrentlyLiked: post.user_has_liked })}
                className={`flex items-center gap-2 transition-colors ${post.user_has_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}
              >
                <Heart className={`w-5 h-5 ${post.user_has_liked ? "fill-destructive" : ""}`} />
                <span className="text-xs">{post.likes_count.toLocaleString()}</span>
              </button>
              <button
                onClick={() => setCommentsOpen(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => sharePost(post.id, post.content)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors ml-auto"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <PostCommentsDrawer
        postId={commentsOpen ? id ?? null : null}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
      />
    </div>
  );
}
