import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, MessageCircleOff, Bell, BellOff } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useAuth } from "@/context/AuthContext";
import { useMutedChats } from "@/hooks/useMutedChats";

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatInterface = ({ isOpen, onClose }: ChatInterfaceProps) => {
  const { user } = useAuth();
  const { isMuted, toggleMute } = useMutedChats();
  const [coachMuted, setCoachMuted] = useState(false);
  const { messages, isLoading, sendMessage, coachInfo, resolvedCoachId } = useRealtimeChat({ isOpen, isMuted: coachMuted });
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);

  const coachName = coachInfo?.full_name || "Koç";
  const coachAvatar = coachInfo?.avatar_url || "";

  // Sync muted state when resolvedCoachId becomes available
  useEffect(() => {
    if (resolvedCoachId) setCoachMuted(isMuted(resolvedCoachId));
  }, [resolvedCoachId, isMuted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;
    setIsSending(true);
    const msg = inputValue;
    setInputValue("");
    await sendMessage(msg);
    setIsSending(false);
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 flex items-center gap-4 z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </motion.button>

            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <Avatar className="w-10 h-10 border-2 border-primary">
                  <AvatarImage src={coachAvatar} className="object-cover" />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {coachName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div>
                <h2 className="font-display text-foreground">{coachName}</h2>
                <p className="text-green-500 text-xs">Koç ile Mesajlaşma</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="absolute top-[72px] bottom-[80px] left-0 right-0 overflow-y-auto p-4 space-y-4">
            {!resolvedCoachId && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <MessageCircleOff className="w-12 h-12 text-muted-foreground/50" />
                <div>
                  <p className="text-foreground font-medium">Henüz bir koçunuz atanmamış</p>
                  <p className="text-muted-foreground text-sm mt-1">Koçunuz atandığında burada mesajlaşabilirsiniz.</p>
                </div>
              </div>
            )}

            {resolvedCoachId && isLoading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}

            {resolvedCoachId && !isLoading && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <p className="text-muted-foreground text-sm">Henüz mesaj yok. İlk mesajı siz gönderin! 💬</p>
              </div>
            )}

            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[80%] ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    {!isOwn && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={coachAvatar} className="object-cover" />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {coachName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border p-4 safe-area-inset">
            <div className="flex items-center gap-3">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={resolvedCoachId ? "Mesaj yaz..." : "Bağlantı Bekleniyor..."}
                disabled={!resolvedCoachId}
                className="flex-1 bg-secondary/50 border-border rounded-full px-4"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!inputValue.trim() || !resolvedCoachId || isSending}
                className="p-3 bg-primary rounded-full text-primary-foreground disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatInterface;
