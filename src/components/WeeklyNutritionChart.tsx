import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { useWeeklyNutrition } from "@/hooks/useWeeklyNutrition";
import { Button } from "@/components/ui/button";

interface Props {
  calorieTarget: number;
}

const WeeklyNutritionChart = ({ calorieTarget }: Props) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data, isLoading, dateRange } = useWeeklyNutrition(weekOffset);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset((o) => o + 1)}
          className="h-8 w-8 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">
            {dateRange.start} – {dateRange.end}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Hedef: {safeTarget} kcal
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWeekOffset((o) => Math.max(0, o - 1))}
          disabled={weekOffset === 0}
          className="h-8 w-8 rounded-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Avg adherence badge */}
      <div className="flex justify-center">
        <span
          className={`text-lg font-display font-bold ${
            avgAdherence >= 80
              ? "text-green-500"
              : avgAdherence >= 50
                ? "text-yellow-500"
                : "text-red-500"
          }`}
        >
          %{avgAdherence}
        </span>
        <span className="text-muted-foreground text-xs ml-1 self-end mb-0.5">ort. uyum</span>
      </div>

      {/* Chart */}
      <div className="h-52">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
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
        )}
      </div>

      {/* Macro mini summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Protein", key: "protein" as const, color: "text-yellow-500" },
          { label: "Karb", key: "carbs" as const, color: "text-blue-500" },
          { label: "Yağ", key: "fat" as const, color: "text-orange-500" },
        ].map((macro) => {
          const daysWithData = chartData.filter((d) => d.calories > 0);
          const avg =
            daysWithData.length > 0
              ? Math.round(daysWithData.reduce((s, d) => s + d[macro.key], 0) / daysWithData.length)
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
