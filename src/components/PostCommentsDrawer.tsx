import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Send, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePostComments, useAddComment } from "@/hooks/usePostComments";
import { toast } from "sonner";

interface PostCommentsDrawerProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CommentSkeletonRow() {
  return (
    <div className="flex gap-3">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  );
}

export default function PostCommentsDrawer({ postId, open, onOpenChange }: PostCommentsDrawerProps) {
  const [text, setText] = useState("");
  const { data: comments = [], isLoading } = usePostComments(open ? postId : null);
  const addComment = useAddComment();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments.length]);

  // Auto-focus input on desktop only
  useEffect(() => {
    if (!open) return;
    const isCoarse = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
    if (isCoarse) return;
    const t = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || !postId) return;
    setText("");
    try {
      await addComment.mutateAsync({ postId, content: trimmed });
    } catch (err: any) {
      toast.error("Yorum gönderilemedi", { description: err?.message });
      setText(trimmed);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-zinc-950 border-zinc-800 max-h-[85vh]">
        <DrawerHeader className="border-b border-zinc-800">
          <DrawerTitle className="text-foreground font-display text-base">YORUMLAR</DrawerTitle>
        </DrawerHeader>

        <ScrollArea className="flex-1 overflow-y-auto" ref={scrollRef as any}>
          <div className="p-4 space-y-4 min-h-[200px]">
            {isLoading ? (
              <>
                <CommentSkeletonRow />
                <CommentSkeletonRow />
                <CommentSkeletonRow />
              </>
            ) : comments.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">İlk yorumu sen yap</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={c.author.avatar_url || ""} alt={c.author.full_name} />
                    <AvatarFallback className="bg-zinc-800 text-foreground text-xs">
                      {c.author.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-foreground text-sm font-medium">{c.author.full_name}</span>
                      <span className="text-muted-foreground text-[10px]">
                        {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: tr })}
                      </span>
                    </div>
                    <p className="text-foreground/90 text-sm whitespace-pre-wrap break-words">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-zinc-800 p-3 flex items-center gap-2 bg-zinc-950">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Yorum ekle..."
            className="bg-zinc-900 border-zinc-800 text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={handleSubmit}
            disabled={!text.trim() || addComment.isPending}
            size="icon"
            className="flex-shrink-0"
          >
            {addComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
