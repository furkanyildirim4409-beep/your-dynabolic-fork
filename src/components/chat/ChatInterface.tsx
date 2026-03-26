import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, MessageCircleOff, Bell, BellOff, Paperclip, Image as ImageIcon, Video, Mic } from "lucide-react";
import { CustomAudioPlayer } from "@/components/ui/CustomAudioPlayer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
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
  const [chatFile, setChatFile] = useState<File | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const { isRecording, recordingDuration, startRecording, stopRecording } = useAudioRecorder();

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
    if ((!inputValue.trim() && !chatFile) || isSending) return;
    setIsSending(true);
    const msg = inputValue;
    const file = chatFile;
    setInputValue("");
    setChatFile(null);
    await sendMessage({ content: msg, file: file || undefined });
    setIsSending(false);
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
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
                <p className="text-emerald-500 text-xs">Koç ile Mesajlaşma</p>
              </div>
            </div>

            {resolvedCoachId && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  toggleMute(resolvedCoachId);
                  setCoachMuted(!coachMuted);
                }}
                className="p-2 text-muted-foreground hover:text-foreground"
                title={coachMuted ? "Bildirimleri Aç" : "Bildirimleri Sustur"}
              >
                {coachMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </motion.button>
            )}
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
                      {message.media_type === "image" && message.media_url && (
                        <img
                          src={message.media_url}
                          alt="Paylaşılan görsel"
                          className="rounded-lg max-w-[200px] sm:max-w-[250px] max-h-60 object-cover mb-1.5"
                          loading="lazy"
                        />
                      )}
                      {message.media_type === "video" && message.media_url && (
                        <video
                          controls
                          src={message.media_url}
                          className="rounded-lg max-w-[200px] sm:max-w-[250px] max-h-60 mb-1.5"
                        />
                      )}
                      {message.media_type === "audio" && message.media_url && (
                        <audio
                          controls
                          src={message.media_url}
                          className="max-w-full mb-1.5"
                          preload="metadata"
                        />
                      )}
                      {message.content && <p className="text-sm">{message.content}</p>}
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
            {chatFile && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-2 bg-secondary/80 rounded-lg px-3 py-1.5 text-xs text-foreground">
                  {chatFile.type.startsWith("video") ? <Video className="w-3.5 h-3.5 text-primary" /> : <ImageIcon className="w-3.5 h-3.5 text-primary" />}
                  <span className="truncate max-w-[200px]">{chatFile.name}</span>
                  <button onClick={() => setChatFile(null)} className="ml-1 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            <input
              ref={chatFileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setChatFile(f);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => chatFileInputRef.current?.click()}
                disabled={!resolvedCoachId}
                className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <Paperclip className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  if (isRecording) {
                    const file = await stopRecording();
                    if (file.size > 0) {
                      setIsSending(true);
                      setChatFile(null);
                      setInputValue("");
                      await sendMessage({ content: "🎵 Sesli Mesaj", file });
                      setIsSending(false);
                    }
                  } else {
                    startRecording();
                  }
                }}
                disabled={!resolvedCoachId}
                className={`p-2 hover:text-foreground disabled:opacity-50 ${isRecording ? "animate-pulse text-destructive" : "text-muted-foreground"}`}
              >
                <Mic className="w-5 h-5" />
              </motion.button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isRecording ? `Kaydediliyor... (${recordingDuration}s)` : resolvedCoachId ? "Mesaj yaz..." : "Bağlantı Bekleniyor..."}
                disabled={!resolvedCoachId || isRecording}
                className="flex-1 bg-secondary/50 border-border rounded-full px-4"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={(!inputValue.trim() && !chatFile) || !resolvedCoachId || isSending}
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
    </AnimatePresence>,
    document.body
  );
};

export default ChatInterface;
