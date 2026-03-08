import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Activity, Moon, Footprints, TrendingUp, Calendar } from "lucide-react";
import { hapticLight } from "@/lib/haptics";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, LineChart, Line } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const weeklyRhrData = [
  { day: "Pzt", value: 62 }, { day: "Sal", value: 60 }, { day: "Çar", value: 59 },
  { day: "Per", value: 61 }, { day: "Cum", value: 58 }, { day: "Cmt", value: 57 }, { day: "Paz", value: 58 },
];
const weeklyHrvData = [
  { day: "Pzt", value: 35, baseline: 40 }, { day: "Sal", value: 38, baseline: 40 }, { day: "Çar", value: 40, baseline: 40 },
  { day: "Per", value: 37, baseline: 40 }, { day: "Cum", value: 42, baseline: 40 }, { day: "Cmt", value: 45, baseline: 40 }, { day: "Paz", value: 42, baseline: 40 },
];
const weeklySleepData = [
  { day: "Pzt", total: 6.5, deep: 1.5, rem: 1.2, light: 3.8 }, { day: "Sal", total: 7.2, deep: 1.8, rem: 1.4, light: 4.0 },
  { day: "Çar", total: 7.8, deep: 2.0, rem: 1.5, light: 4.3 }, { day: "Per", total: 6.8, deep: 1.6, rem: 1.3, light: 3.9 },
  { day: "Cum", total: 7.5, deep: 1.9, rem: 1.4, light: 4.2 }, { day: "Cmt", total: 8.2, deep: 2.2, rem: 1.6, light: 4.4 }, { day: "Paz", total: 7.2, deep: 1.7, rem: 1.3, light: 4.2 },
];
const weeklyStepsData = [
  { day: "Pzt", value: 8456, goal: 10000 }, { day: "Sal", value: 12340, goal: 10000 }, { day: "Çar", value: 9870, goal: 10000 },
  { day: "Per", value: 7650, goal: 10000 }, { day: "Cum", value: 11200, goal: 10000 }, { day: "Cmt", value: 15400, goal: 10000 }, { day: "Paz", value: 6200, goal: 10000 },
];

const metrics = [
  { id: "rhr", label: "Dinlenme Nabzı", shortLabel: "RHR", icon: Heart, color: "#f87171", bgClass: "bg-red-500/10", borderClass: "border-red-500/30", unit: "bpm", currentValue: 58, weeklyChange: -4 },
  { id: "hrv", label: "Kalp Atış Değişkenliği", shortLabel: "HRV", icon: Activity, color: "#60a5fa", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/30", unit: "ms", currentValue: 42, weeklyChange: 7 },
  { id: "sleep", label: "Uyku Süresi", shortLabel: "Uyku", icon: Moon, color: "#a78bfa", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/30", unit: "saat", currentValue: 7.2, weeklyChange: 0.4 },
  { id: "steps", label: "Günlük Adım", shortLabel: "Adım", icon: Footprints, color: "#4ade80", bgClass: "bg-green-500/10", borderClass: "border-green-500/30", unit: "", currentValue: 8456, weeklyChange: 1200 },
];

const SaglikTrendleri = () => {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState("rhr");
  const currentMetric = metrics.find(m => m.id === selectedMetric)!;

  const getChartData = () => {
    switch (selectedMetric) {
      case "rhr": return weeklyRhrData;
      case "hrv": return weeklyHrvData;
      case "sleep": return weeklySleepData;
      case "steps": return weeklyStepsData;
      default: return [];
    }
  };

  const renderChart = () => {
    const data = getChartData();
    if (selectedMetric === "rhr") {
      return (<ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="rhrGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.4}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 20%)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(240 5% 50%)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(240 5% 50%)', fontSize: 11 }} domain={['auto', 'auto']} /><Tooltip contentStyle={{ backgroundColor: 'hsl(240 6% 10%)', border: '1px solid hsl(240 5% 20%)', borderRadius: '12px', fontSize: '12px' }} /><Area type="monotone" dataKey="value" stroke="#f87171" strokeWidth={2} fill="url(#rhrGradient)" dot={{ fill: '#f87171', strokeWidth: 0, r: 4 }} /></AreaChart></ResponsiveContainer>);
    }
    if (selectedMetric === "hrv") {
      return (<ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 20%)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(240 5% 50%)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(240 5% 50%)', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: 'hsl(240 6% 10%)', border: '1px solid hsl(240 5% 20%)', borderRadius: '12px', fontSize: '12px' }} /><Line type="monotone" dataKey="baseline" stroke="hsl(240 5% 40%)" strokeWidth={1} strokeDasharray="5 5" dot={false} /><Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', strokeWidth: 0, r: 4 }} /></LineChart></ResponsiveContainer>);
    }
    if (selectedMetric === "sleep") {
      return (<ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 20%)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(240 5% 50%)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(240 5% 50%)', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: 'hsl(240 6% 10%)', border: '1px solid hsl(240 5% 20%)', borderRadius: '12px', fontSize: '12px' }} /><Bar dataKey="deep" stackId="sleep" fill="#7c3aed" name="Derin" /><Bar dataKey="rem" stackId="sleep" fill="#a78bfa" name="REM" /><Bar dataKey="light" stackId="sleep" fill="#c4b5fd" radius={[4, 4, 0, 0]} name="Hafif" /></BarChart></ResponsiveContainer>);
    }
    return (<ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5% 20%)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(240 5% 50%)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(240 5% 50%)', fontSize: 11 }} /><Tooltip contentStyle={{ backgroundColor: 'hsl(240 6% 10%)', border: '1px solid hsl(240 5% 20%)', borderRadius: '12px', fontSize: '12px' }} /><Bar dataKey="goal" fill="hsl(240 5% 25%)" radius={[4, 4, 4, 4]} name="Hedef" /><Bar dataKey="value" fill="#4ade80" radius={[4, 4, 4, 4]} name="Adım" /></BarChart></ResponsiveContainer>);
  };

  return (
    <div className="min-h-screen bg-background">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="flex items-center gap-3 relative z-50">
          <button onClick={() => { hapticLight(); navigate(-1); }} className="relative z-50 flex items-center justify-center w-10 h-10 rounded-full bg-secondary/80 hover:bg-secondary active:scale-95 transition-all"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
          <div className="flex-1"><h1 className="font-display text-lg text-foreground">SAĞLIK TRENDLERİ</h1><p className="text-xs text-muted-foreground">Detaylı bio-metrik analiz</p></div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="w-3 h-3" /><span>Mart 2026</span></div>
        </div>
      </motion.div>
      <div className="p-4 pb-24 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
          {metrics.map((metric) => (
            <button key={metric.id} onClick={() => setSelectedMetric(metric.id)} className={`p-3 rounded-xl border transition-all ${selectedMetric === metric.id ? `${metric.bgClass} ${metric.borderClass}` : "bg-secondary/30 border-transparent hover:bg-secondary/50"}`}>
              <metric.icon className={`w-5 h-5 mx-auto mb-1 ${selectedMetric === metric.id ? "" : "text-muted-foreground"}`} style={{ color: selectedMetric === metric.id ? metric.color : undefined }} />
              <p className={`text-[10px] text-center ${selectedMetric === metric.id ? "text-foreground" : "text-muted-foreground"}`}>{metric.shortLabel}</p>
            </button>
          ))}
        </motion.div>
        <motion.div key={selectedMetric} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className={`p-6 rounded-2xl ${currentMetric.bgClass} border ${currentMetric.borderClass}`}>
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground mb-1">{currentMetric.label}</p><div className="flex items-baseline gap-2"><span className="font-display text-4xl" style={{ color: currentMetric.color }}>{currentMetric.currentValue.toLocaleString()}</span><span className="text-muted-foreground">{currentMetric.unit}</span></div></div>
            <div className="text-right"><div className={`text-sm ${currentMetric.weeklyChange > 0 ? "text-green-400" : "text-red-400"}`}>{currentMetric.weeklyChange > 0 ? "↑" : "↓"} {Math.abs(currentMetric.weeklyChange)} {currentMetric.unit}</div><p className="text-xs text-muted-foreground">bu hafta</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-primary" /><h3 className="text-sm font-medium text-foreground">7 Günlük Trend</h3></div>
          <div className="h-56">{renderChart()}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 border border-primary/30">
          <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><Activity className="w-4 h-4 text-primary" /></div><h3 className="text-sm font-medium text-foreground">AI Öngörüsü</h3></div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {selectedMetric === "rhr" && "Dinlenme nabzınız son 4 haftada %11 düştü. Kardiyovasküler kondisyonunuz iyileşiyor."}
            {selectedMetric === "hrv" && "HRV değerleriniz bazal çizginin üzerinde. Toparlanmanız mükemmel seviyede."}
            {selectedMetric === "sleep" && "Uyku kaliteniz hafta sonlarında artış gösteriyor. Hafta içi yatış saatinizi 30 dk erkene alın."}
            {selectedMetric === "steps" && "Günlük adım hedefinize haftanın %57'sinde ulaştınız. Öğle yürüyüşleri ekleyin."}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SaglikTrendleri;
