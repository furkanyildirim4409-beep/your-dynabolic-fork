import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Brain, Moon, Footprints, Activity, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";

const rhrData = [
  { day: "Pzt", value: 62 }, { day: "Sal", value: 60 }, { day: "Çar", value: 58 },
  { day: "Per", value: 59 }, { day: "Cum", value: 57 }, { day: "Cmt", value: 56 }, { day: "Paz", value: 58 },
];

const hrvData = [
  { day: "Pzt", value: 38 }, { day: "Sal", value: 40 }, { day: "Çar", value: 42 },
  { day: "Per", value: 39 }, { day: "Cum", value: 44 }, { day: "Cmt", value: 45 }, { day: "Paz", value: 42 },
];

const sleepStages = [
  { stage: "Derin", hours: 1.7, percent: 23, color: "bg-indigo-500" },
  { stage: "REM", hours: 1.3, percent: 18, color: "bg-purple-500" },
  { stage: "Hafif", hours: 4.2, percent: 59, color: "bg-blue-400" },
];

const stepsData = [
  { day: "Pzt", value: 8200 }, { day: "Sal", value: 10500 }, { day: "Çar", value: 7800 },
  { day: "Per", value: 9200 }, { day: "Cum", value: 11000 }, { day: "Cmt", value: 6500 }, { day: "Paz", value: 8456 },
];

interface BioMetricsDashboardProps {
  onMetricClick?: (metric: string) => void;
}

const BioMetricsDashboard = ({ onMetricClick }: BioMetricsDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "rhr" | "hrv" | "sleep" | "steps">("overview");

  const metrics = [
    { id: "rhr", label: "Dinlenme Nabzı", value: "58", unit: "bpm", change: -2, icon: Heart, color: "text-red-400", data: rhrData },
    { id: "hrv", label: "HRV", value: "42", unit: "ms", change: 5, icon: Brain, color: "text-purple-400", data: hrvData },
    { id: "sleep", label: "Uyku", value: "7.2", unit: "saat", change: 0.3, icon: Moon, color: "text-indigo-400", data: null },
    { id: "steps", label: "Adım", value: "8,456", unit: "", change: 12, icon: Footprints, color: "text-green-400", data: stepsData },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Biyometrik Panel</h3>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1">
        {[
          { key: "overview", label: "Özet" },
          { key: "rhr", label: "Nabız" },
          { key: "hrv", label: "HRV" },
          { key: "sleep", label: "Uyku" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Grid */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            const isPositive = metric.id === "rhr" ? metric.change < 0 : metric.change > 0;
            return (
              <motion.button
                key={metric.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab(metric.id as any); onMetricClick?.(metric.id); }}
                className="backdrop-blur-xl bg-card border border-border rounded-xl p-4 text-left relative overflow-hidden group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-xs text-muted-foreground">{metric.label}</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`font-display text-2xl ${metric.color}`}>{metric.value}</span>
                  <span className="text-xs text-muted-foreground">{metric.unit}</span>
                </div>
                <div className={`flex items-center gap-1 mt-1 text-xs ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{Math.abs(metric.change)}{metric.id === "steps" ? "%" : ""}</span>
                </div>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              </motion.button>
            );
          })}
        </div>
      )}

      {/* RHR Detail */}
      {activeTab === "rhr" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="backdrop-blur-xl bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-foreground font-medium text-sm">Dinlenme Kalp Atış Hızı</p>
              <p className="text-muted-foreground text-xs">Son 7 gün</p>
            </div>
            <div className="text-right">
              <p className="text-red-400 text-xl font-bold">58 bpm</p>
              <p className="text-green-400 text-xs flex items-center gap-1 justify-end"><TrendingDown className="w-3 h-3" /> -2 bpm</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={rhrData}>
              <defs>
                <linearGradient id="rhrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(0 0% 60%)", fontSize: 10 }} />
              <YAxis domain={[50, 70]} hide />
              <Tooltip contentStyle={{ background: "hsl(240 6% 4%)", border: "1px solid hsl(240 4% 15%)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#f87171" fill="url(#rhrGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* HRV Detail */}
      {activeTab === "hrv" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="backdrop-blur-xl bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-foreground font-medium text-sm">Kalp Atış Değişkenliği</p>
              <p className="text-muted-foreground text-xs">Son 7 gün</p>
            </div>
            <div className="text-right">
              <p className="text-purple-400 text-xl font-bold">42 ms</p>
              <p className="text-green-400 text-xs flex items-center gap-1 justify-end"><TrendingUp className="w-3 h-3" /> +5 ms</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={hrvData}>
              <defs>
                <linearGradient id="hrvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "hsl(0 0% 60%)", fontSize: 10 }} />
              <YAxis domain={[30, 50]} hide />
              <Tooltip contentStyle={{ background: "hsl(240 6% 4%)", border: "1px solid hsl(240 4% 15%)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#a855f7" fill="url(#hrvGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Sleep Detail */}
      {activeTab === "sleep" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="backdrop-blur-xl bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-foreground font-medium text-sm">Uyku Analizi</p>
              <p className="text-muted-foreground text-xs">Dün gece</p>
            </div>
            <p className="text-indigo-400 text-xl font-bold">7.2 saat</p>
          </div>
          <div className="space-y-3">
            {sleepStages.map((stage) => (
              <div key={stage.stage}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{stage.stage}</span>
                  <span className="text-foreground">{stage.hours}s (%{stage.percent})</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.percent}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${stage.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">
              💡 Derin uyku oranı ideal seviyede. REM süresi biraz düşük — yatmadan önce ekran süresini azaltmayı dene.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BioMetricsDashboard;
