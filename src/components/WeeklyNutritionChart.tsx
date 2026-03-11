import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DailyNutritionSummary } from "@/hooks/useWeeklyNutrition";

interface Props {
  data: DailyNutritionSummary[];
  calorieTarget: number;
  isLoading: boolean;
}

const WeeklyNutritionChart = ({ data, calorieTarget, isLoading }: Props) => {
  const safeTarget = calorieTarget > 0 ? calorieTarget : 2000;

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        protein: Math.round(d.protein),
        carbs: Math.round(d.carbs),
        fat: Math.round(d.fat),
        calories: Math.round(d.calories),
        adherence: safeTarget > 0 ? Math.round((d.calories / safeTarget) * 100) : 0,
      })),
    [data, safeTarget],
  );

  const avgAdherence = useMemo(() => {
    const daysWithData = chartData.filter((d) => d.calories > 0);
    if (daysWithData.length === 0) return 0;
    return Math.round(daysWithData.reduce((s, d) => s + d.adherence, 0) / daysWithData.length);
  }, [chartData]);

  if (isLoading) {
    return (
      <div className="bg-card border border-white/5 rounded-2xl p-4 mb-6">
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-card border border-white/5 rounded-2xl p-4 mb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            HAFTALIK UYUM
          </h3>
          <p className="text-muted-foreground text-[11px] mt-0.5">
            Son 7 gün • Hedef: {safeTarget} kcal
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-xl font-display font-bold ${
              avgAdherence >= 80
                ? "text-green-500"
                : avgAdherence >= 50
                  ? "text-yellow-500"
                  : "text-red-500"
            }`}
          >
            %{avgAdherence}
          </span>
          <span className="text-muted-foreground text-xs">ort.</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="dayLabel"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 700 }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  calories: "Kalori",
                  protein: "Protein",
                  carbs: "Karbonhidrat",
                  fat: "Yağ",
                };
                const units: Record<string, string> = {
                  calories: " kcal",
                  protein: "g",
                  carbs: "g",
                  fat: "g",
                };
                return [`${value}${units[name] || ""}`, labels[name] || name];
              }}
            />
            <ReferenceLine
              y={safeTarget}
              stroke="hsl(var(--primary))"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: "Hedef",
                fill: "hsl(var(--primary))",
                fontSize: 10,
                position: "right",
              }}
            />
            <Bar dataKey="calories" radius={[6, 6, 0, 0]} maxBarSize={32}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.calories === 0
                      ? "hsl(var(--muted))"
                      : entry.adherence >= 85 && entry.adherence <= 115
                        ? "hsl(142, 71%, 45%)"
                        : entry.adherence >= 70
                          ? "hsl(48, 96%, 53%)"
                          : "hsl(0, 84%, 60%)"
                  }
                  opacity={entry.calories === 0 ? 0.3 : 0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Macro mini summary */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { label: "Protein", key: "protein" as const, color: "text-yellow-500" },
          { label: "Karb", key: "carbs" as const, color: "text-blue-500" },
          { label: "Yağ", key: "fat" as const, color: "text-orange-500" },
        ].map((macro) => {
          const avg =
            chartData.filter((d) => d.calories > 0).length > 0
              ? Math.round(
                  chartData.filter((d) => d.calories > 0).reduce((s, d) => s + d[macro.key], 0) /
                    chartData.filter((d) => d.calories > 0).length,
                )
              : 0;
          return (
            <div key={macro.key} className="bg-secondary/40 rounded-xl p-2 text-center">
              <p className={`text-sm font-bold font-display ${macro.color}`}>{avg}g</p>
              <p className="text-[10px] text-muted-foreground uppercase">{macro.label} ort.</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default WeeklyNutritionChart;
