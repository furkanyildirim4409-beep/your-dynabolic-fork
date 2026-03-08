import { useMemo } from "react";
import { motion } from "framer-motion";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useWeightTracking } from "@/hooks/useWeightTracking";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

const WeightHistoryChart = () => {
  const { weightHistory, latestWeight, isLoading } = useWeightTracking();

  const chartData = useMemo(() => {
    return weightHistory.map((entry) => ({
      date: format(parseISO(entry.logged_at), "d MMM", { locale: tr }),
      fullDate: format(parseISO(entry.logged_at), "d MMMM yyyy", { locale: tr }),
      kg: Number(entry.weight_kg),
    }));
  }, [weightHistory]);

  const trend = useMemo(() => {
    if (weightHistory.length < 2) return { direction: "neutral" as const, diff: 0 };
    const first = Number(weightHistory[0].weight_kg);
    const last = Number(weightHistory[weightHistory.length - 1].weight_kg);
    const diff = +(last - first).toFixed(1);
    return {
      direction: diff < 0 ? ("down" as const) : diff > 0 ? ("up" as const) : ("neutral" as const),
      diff: Math.abs(diff),
    };
  }, [weightHistory]);

  const TrendIcon = trend.direction === "down" ? TrendingDown : trend.direction === "up" ? TrendingUp : Minus;
  const trendColor = trend.direction === "down" ? "text-green-400" : trend.direction === "up" ? "text-orange-400" : "text-muted-foreground";

  if (isLoading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
        <div className="h-[180px] bg-muted/50 rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg text-foreground tracking-wide">KİLO GEÇMİŞİ</h2>
        </div>
        {latestWeight && (
          <div className="flex items-center gap-2">
            <TrendIcon className={`w-4 h-4 ${trendColor}`} />
            <span className={`text-xs font-medium ${trendColor}`}>
              {trend.diff > 0 ? `${trend.diff} kg` : "—"}
            </span>
          </div>
        )}
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Scale className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">Henüz kilo kaydı yok</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Dock'taki + butonundan ağırlık girebilirsin</p>
        </div>
      ) : (
        <>
          {/* Current weight highlight */}
          <div className="flex items-baseline gap-1 mb-3">
            <span className="font-display text-3xl text-primary">{latestWeight}</span>
            <span className="text-muted-foreground text-sm">kg</span>
          </div>

          {/* Chart */}
          <div className="h-[180px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={["dataMin - 1", "dataMax + 1"]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                  labelFormatter={(_, payload) => {
                    if (payload?.[0]?.payload?.fullDate) return payload[0].payload.fullDate;
                    return "";
                  }}
                  formatter={(value: number) => [`${value} kg`, "Ağırlık"]}
                />
                <Area
                  type="monotone"
                  dataKey="kg"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#weightGradient)"
                  dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="text-muted-foreground/60 text-[10px] text-center mt-2">
            Son {chartData.length} kayıt
          </p>
        </>
      )}
    </motion.div>
  );
};

export default WeightHistoryChart;
