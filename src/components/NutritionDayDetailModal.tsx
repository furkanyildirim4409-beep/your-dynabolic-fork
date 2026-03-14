import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import type { DayNutritionStats } from "@/hooks/useNutritionCalendar";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: DayNutritionStats | null;
}

const MacroBadges = ({ cal, p, c, f }: { cal: number; p: number; c: number; f: number }) => (
  <div className="flex gap-1.5 flex-wrap mt-1">
    <Badge variant="outline" className="bg-secondary/50 text-xs">{cal} kcal</Badge>
    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs">{Math.round(p)}g P</Badge>
    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">{Math.round(c)}g K</Badge>
    <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-xs">{Math.round(f)}g Y</Badge>
  </div>
);

export default function NutritionDayDetailModal({ open, onOpenChange, stats }: Props) {
  if (!stats) return null;

  const { targetCalories, consumedCalories, delta, status, logs, date, plannedFoods, targetProtein, targetCarbs, targetFat } = stats;
  const percentage = targetCalories > 0 ? Math.min(Math.round((consumedCalories / targetCalories) * 100), 150) : 0;
  const formattedDate = format(parseISO(date), "dd MMMM yyyy, EEEE", { locale: tr });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-background border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{formattedDate}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {status === "under" && (
              <>
                <Badge variant="destructive">Tamamlanamadı</Badge>
                <Badge variant="outline" className="text-destructive border-destructive/30">{delta} kcal</Badge>
              </>
            )}
            {status === "over" && (
              <>
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30">Aşıldı</Badge>
                <Badge variant="outline" className="text-orange-400 border-orange-500/30">+{delta} kcal</Badge>
              </>
            )}
            {status === "completed" && (
              <>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">Tamamlandı</Badge>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Hedefte</Badge>
              </>
            )}
            {status === "empty" && (
              <>
                <Badge variant="secondary">Boş</Badge>
                <Badge variant="outline" className="text-muted-foreground">Veri Girilmedi</Badge>
              </>
            )}
            {status === "no-plan" && (
              <Badge variant="secondary">Plan Yok</Badge>
            )}
            {status === "scheduled" && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30">Planlandı</Badge>
            )}
          </div>

          {/* Progress */}
          {targetCalories > 0 && status !== "scheduled" && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tüketilen</span>
                <span className="font-semibold text-foreground">
                  {consumedCalories} / {targetCalories} kcal
                </span>
              </div>
              <Progress value={Math.min(percentage, 100)} className="h-2.5" />
              <p className="text-xs text-muted-foreground text-right">%{percentage}</p>
            </div>
          )}

          {/* Target macro summary */}
          {targetCalories > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hedef Makrolar</p>
              <MacroBadges cal={targetCalories} p={targetProtein} c={targetCarbs} f={targetFat} />
            </div>
          )}

          {/* Consumed macro breakdown */}
          {consumedCalories > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-sm font-bold text-blue-500">{Math.round(stats.consumedProtein)}g</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Karb</p>
                <p className="text-sm font-bold text-amber-500">{Math.round(stats.consumedCarbs)}g</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Yağ</p>
                <p className="text-sm font-bold text-rose-500">{Math.round(stats.consumedFat)}g</p>
              </div>
            </div>
          )}

          {/* Planned Foods */}
          {plannedFoods.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hedeflenen İçerik</p>
              {plannedFoods.map((food, i) => (
                <div key={i} className="p-2 rounded-lg bg-secondary/30 border border-border/50">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-foreground font-medium">{food.food_name}</span>
                    {food.serving_size && (
                      <span className="text-[10px] text-muted-foreground ml-2 shrink-0">{food.serving_size}</span>
                    )}
                  </div>
                  <MacroBadges cal={food.calories} p={food.protein} c={food.carbs} f={food.fat} />
                </div>
              ))}
            </div>
          )}

          {/* Logged meals */}
          {logs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tüketilen Öğünler</p>
              {logs.map((log, i) => (
                <div key={i} className="p-2 rounded-lg bg-secondary/30 border border-border/50">
                  <span className="text-sm text-foreground font-medium">{log.meal_name}</span>
                  <MacroBadges cal={log.total_calories} p={log.total_protein} c={log.total_carbs} f={log.total_fat} />
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
