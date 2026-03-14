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

export default function NutritionDayDetailModal({ open, onOpenChange, stats }: Props) {
  if (!stats) return null;

  const { targetCalories, consumedCalories, delta, status, logs, date } = stats;
  const percentage = targetCalories > 0 ? Math.min(Math.round((consumedCalories / targetCalories) * 100), 150) : 0;
  const formattedDate = format(parseISO(date), "dd MMMM yyyy, EEEE", { locale: tr });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-base">{formattedDate}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Badges */}
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
          </div>

          {/* Progress */}
          {targetCalories > 0 && (
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

          {/* Macro breakdown */}
          {consumedCalories > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Protein</p>
                <p className="text-sm font-bold text-yellow-500">{Math.round(stats.consumedProtein)}g</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Karb</p>
                <p className="text-sm font-bold text-blue-500">{Math.round(stats.consumedCarbs)}g</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Yağ</p>
                <p className="text-sm font-bold text-orange-500">{Math.round(stats.consumedFat)}g</p>
              </div>
            </div>
          )}

          {/* Logged meals */}
          {logs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Öğünler</p>
              {logs.map((log, i) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30 border border-white/5">
                  <span className="text-sm text-foreground">{log.meal_name}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{log.total_calories} kcal</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
