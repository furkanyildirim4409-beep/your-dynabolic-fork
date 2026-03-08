import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Mic } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { assignedCoach } from "@/lib/mockData";

interface Message {
  id: string;
  sender: "user" | "coach";
  content: string;
  time: string;
}

interface CoachChatProps {
  isOpen: boolean;
  onClose: () => void;
  coachName?: string;
  coachAvatar?: string;
}

const CoachChat = ({ isOpen, onClose, coachName, coachAvatar }: CoachChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "coach",
      content: "Merhaba! Bugünkü antrenmanın nasıl geçti? 💪",
      time: "14:30"
    },
    {
      id: "2",
      sender: "user",
      content: "Göğüs antrenmanı çok iyi geçti, bench press PR kırdım!",
      time: "14:32"
    },
    {
      id: "3",
      sender: "coach",
      content: "Harika! Squat formun düzelmiş. Aynen devam! 🔥 Yarınki bacak antrenmanı için enerji seviyeni yüksek tut.",
      time: "14:33"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayName = coachName || assignedCoach.name;
  const displayAvatar = coachAvatar || assignedCoach.avatar;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: inputValue,
      time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");

    // Simulate coach response
    setTimeout(() => {
      const responses = [
        "Mesajını aldım! En kısa sürede dönüş yapacağım. 👍",
        "Harika ilerleme! Böyle devam et 💪",
        "Bu konuyu bir sonraki check-in'de konuşalım.",
        "Anladım, programı buna göre ayarlayacağım.",
        "Motivasyonun harika! Devam et 🔥"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "coach",
        content: randomResponse,
        time: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
      }]);
    }, 1000);
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
          <div className="absolute top-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-white/10 p-4 flex items-center gap-4 z-10">
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
                  <AvatarImage src={displayAvatar} className="object-cover" />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {displayName.charAt(4)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-stat-hrv border-2 border-background" />
              </div>
              <div>
                <h2 className="font-display text-foreground">{displayName}</h2>
                <p className="text-stat-hrv text-xs">Çevrimiçi</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="absolute top-[72px] bottom-[80px] left-0 right-0 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex items-end gap-2 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                  {message.sender === "coach" && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={displayAvatar} className="object-cover" />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {displayName.charAt(4)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    message.sender === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-md" 
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-[10px] mt-1 ${
                      message.sender === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                    }`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 bg-secondary rounded-full text-muted-foreground hover:text-foreground"
              >
                <Mic className="w-5 h-5" />
              </motion.button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Mesaj yaz..."
                className="flex-1 bg-secondary/50 border-white/10 rounded-full px-4"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-3 bg-primary rounded-full text-primary-foreground disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CoachChat;