import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, TicketCheck, Plus, AlertTriangle, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTickets } from "@/hooks/useTickets";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  "Açık": { label: "Açık", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: Clock },
  "Cevaplandı": { label: "Cevaplandı", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
  "Kapalı": { label: "Kapalı", color: "bg-muted text-muted-foreground border-border", icon: TicketCheck },
};

const Destek = () => {
  const navigate = useNavigate();
  const { tickets, isLoading, createTicket } = useTickets();
  const [activeTab, setActiveTab] = useState("tickets");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!subject || !message.trim()) {
      toast({ title: "Eksik Alan", description: "Konu ve mesaj alanlarını doldurun.", variant: "destructive" });
      return;
    }
    try {
      await createTicket.mutateAsync({ subject, priority, message: message.trim() });
      toast({ title: "Bilet Oluşturuldu ✅", description: "Destek ekibimiz en kısa sürede yanıtlayacak." });
      setSubject("");
      setPriority("Normal");
      setMessage("");
      setActiveTab("tickets");
    } catch {
      toast({ title: "Hata", description: "Bilet oluşturulamadı.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-secondary/80 hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Destek & Talepler</h1>
            <p className="text-xs text-muted-foreground">Uygulama destek ekibine ulaşın</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-secondary/60 border border-border/30">
            <TabsTrigger value="tickets" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TicketCheck className="w-4 h-4 mr-1.5" /> Biletlerim
            </TabsTrigger>
            <TabsTrigger value="create" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Plus className="w-4 h-4 mr-1.5" /> Yeni Bilet
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Ticket List */}
          <TabsContent value="tickets" className="mt-4 space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-secondary/40 animate-pulse" />
              ))
            ) : tickets.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary/60 flex items-center justify-center">
                  <TicketCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-semibold">Henüz bilet yok</p>
                <p className="text-muted-foreground text-sm mt-1">Koçunuza soru veya talep göndermek için yeni bilet oluşturun.</p>
              </motion.div>
            ) : (
              tickets.map((ticket, i) => {
                const sc = statusConfig[ticket.status] || statusConfig["Açık"];
                const StatusIcon = sc.icon;
                return (
                  <motion.div key={ticket.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="p-4 bg-card/60 backdrop-blur-md border-border/30 hover:border-border/60 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-semibold text-sm text-foreground">{ticket.subject}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {ticket.priority === "Yüksek" && (
                            <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 text-[10px] px-1.5 py-0">
                              <AlertTriangle className="w-3 h-3 mr-0.5" /> Acil
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sc.color}`}>
                            {sc.label}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-2 mb-2">{ticket.message}</p>

                      {ticket.coach_reply && (
                        <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                          <div className="flex items-center gap-1.5 mb-1">
                            <MessageSquare className="w-3.5 h-3.5 text-primary" />
                            <span className="text-primary text-xs font-semibold">Koç Yanıtı</span>
                          </div>
                          <p className="text-foreground text-xs">{ticket.coach_reply}</p>
                        </div>
                      )}

                      <p className="text-muted-foreground text-[10px] mt-2">
                        {format(new Date(ticket.created_at), "d MMM yyyy, HH:mm", { locale: tr })}
                      </p>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Tab 2: Create Ticket */}
          <TabsContent value="create" className="mt-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5 bg-card/60 backdrop-blur-md border-border/30 space-y-5">
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Konu</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger className="bg-secondary/60 border-border/40">
                      <SelectValue placeholder="Konu seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beslenme">🥗 Beslenme</SelectItem>
                      <SelectItem value="Antrenman">💪 Antrenman</SelectItem>
                      <SelectItem value="Sakatlık">🩹 Sakatlık Raporu</SelectItem>
                      <SelectItem value="Diğer">📝 Diğer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Öncelik</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="bg-secondary/60 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Yüksek">🔴 Yüksek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Mesajınız</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Detaylı açıklama yazın..."
                    className="min-h-[140px] bg-secondary/60 border-border/40 resize-none"
                    maxLength={2000}
                  />
                  <p className="text-muted-foreground text-[10px] text-right">{message.length}/2000</p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={createTicket.isPending || !subject || !message.trim()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                >
                  {createTicket.isPending ? (
                    <span className="animate-pulse">Gönderiliyor...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Bileti Gönder
                    </>
                  )}
                </Button>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Destek;
