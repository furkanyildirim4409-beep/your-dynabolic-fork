import { WeeklyRecapData } from "@/hooks/useWeeklyRecap";

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const PRIMARY = "#D1F526"; // neon-lime from design system
const BG_START = "#0a0a0a";
const BG_END = "#111111";
const WHITE = "#ffffff";
const MUTED = "#888888";
const EMERALD = "#34d399";
const RED = "#f87171";
const ORANGE = "#fb923c";
const YELLOW = "#facc15";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  fill?: string, stroke?: string
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function drawTrendBadge(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, pct: number
) {
  const color = pct > 0 ? EMERALD : pct < 0 ? RED : MUTED;
  const text = pct > 0 ? `+${pct}%` : `${pct}%`;
  ctx.font = "bold 28px sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "right";
  ctx.fillText(text, x, y);
}

export async function generateRecapImage(data: WeeklyRecapData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  bgGrad.addColorStop(0, BG_START);
  bgGrad.addColorStop(1, BG_END);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle grid pattern
  ctx.strokeStyle = "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let i = 0; i < CANVAS_W; i += 60) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_H); ctx.stroke();
  }
  for (let i = 0; i < CANVAS_H; i += 60) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_W, i); ctx.stroke();
  }

  // Corner brackets (brand element)
  const bracketLen = 80;
  const bracketInset = 40;
  ctx.strokeStyle = PRIMARY;
  ctx.lineWidth = 3;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(bracketInset, bracketInset + bracketLen);
  ctx.lineTo(bracketInset, bracketInset);
  ctx.lineTo(bracketInset + bracketLen, bracketInset);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(CANVAS_W - bracketInset - bracketLen, bracketInset);
  ctx.lineTo(CANVAS_W - bracketInset, bracketInset);
  ctx.lineTo(CANVAS_W - bracketInset, bracketInset + bracketLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(bracketInset, CANVAS_H - bracketInset - bracketLen);
  ctx.lineTo(bracketInset, CANVAS_H - bracketInset);
  ctx.lineTo(bracketInset + bracketLen, CANVAS_H - bracketInset);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(CANVAS_W - bracketInset - bracketLen, CANVAS_H - bracketInset);
  ctx.lineTo(CANVAS_W - bracketInset, CANVAS_H - bracketInset);
  ctx.lineTo(CANVAS_W - bracketInset, CANVAS_H - bracketInset - bracketLen);
  ctx.stroke();

  let y = 160;

  // Date range
  const start = new Date(data.weekStartDate);
  const end = new Date(data.weekEndDate);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const dateRange = `${start.toLocaleDateString("tr-TR", opts)} – ${end.toLocaleDateString("tr-TR", opts)}`;
  ctx.font = "400 32px sans-serif";
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.fillText(dateRange, CANVAS_W / 2, y);
  y += 70;

  // Title
  ctx.font = "800 64px sans-serif";
  ctx.fillStyle = WHITE;
  ctx.letterSpacing = "8px";
  ctx.fillText("HAFTALIK ÖZET", CANVAS_W / 2, y);
  y += 30;

  // Divider line
  const divW = 200;
  const grad = ctx.createLinearGradient(CANVAS_W / 2 - divW / 2, 0, CANVAS_W / 2 + divW / 2, 0);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.5, PRIMARY);
  grad.addColorStop(1, "transparent");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2 - divW / 2, y);
  ctx.lineTo(CANVAS_W / 2 + divW / 2, y);
  ctx.stroke();
  y += 60;

  // Performance Score Ring
  const ringCx = CANVAS_W / 2;
  const ringCy = y + 120;
  const ringR = 110;
  const score = Math.min(100, Math.round(
    (data.workoutsCompleted * 12) + (data.streakDays * 8) +
    (data.challengesWon * 15) + (data.personalRecords * 10)
  ));

  // Background ring
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 14;
  ctx.stroke();

  // Score ring
  const scoreAngle = (score / 100) * Math.PI * 2;
  const ringGrad = ctx.createLinearGradient(ringCx - ringR, ringCy, ringCx + ringR, ringCy);
  ringGrad.addColorStop(0, PRIMARY);
  ringGrad.addColorStop(1, EMERALD);
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringR, -Math.PI / 2, -Math.PI / 2 + scoreAngle);
  ctx.strokeStyle = ringGrad;
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.lineCap = "butt";

  // Score text
  ctx.font = "800 72px sans-serif";
  ctx.fillStyle = WHITE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(score), ringCx, ringCy - 10);
  ctx.font = "400 24px sans-serif";
  ctx.fillStyle = MUTED;
  ctx.fillText("PUAN", ringCx, ringCy + 30);
  ctx.textBaseline = "alphabetic";

  // Score label
  const label = score >= 80 ? "Mükemmel! 🔥" : score >= 60 ? "Harika! 💪" : score >= 40 ? "İyi Gidiyor! 👍" : "Devam Et! 🎯";
  const labelColor = score >= 80 ? EMERALD : score >= 60 ? PRIMARY : score >= 40 ? YELLOW : ORANGE;
  ctx.font = "700 36px sans-serif";
  ctx.fillStyle = labelColor;
  ctx.fillText(label, CANVAS_W / 2, ringCy + ringR + 60);

  y = ringCy + ringR + 120;

  // Stats Grid (2x2)
  const cardW = 460;
  const cardH = 180;
  const gap = 30;
  const gridX = (CANVAS_W - cardW * 2 - gap) / 2;

  const statsCards = [
    { emoji: "🏋️", value: String(data.workoutsCompleted), label: "Antrenman", pct: data.comparedToLastWeek.workouts },
    { emoji: "🔥", value: String(data.streakDays), label: "Gün Seri", pct: data.comparedToLastWeek.streak },
    { emoji: "⚔️", value: `${data.challengesWon}/${data.challengesWon + data.challengesLost}`, label: "Kazanılan", pct: data.comparedToLastWeek.challenges },
    { emoji: "🎯", value: `${(data.totalTonnage / 1000).toFixed(1)}t`, label: "Toplam Tonaj", pct: data.comparedToLastWeek.tonnage },
  ];

  statsCards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = gridX + col * (cardW + gap);
    const cy = y + row * (cardH + gap);

    roundRect(ctx, cx, cy, cardW, cardH, 20, "rgba(255,255,255,0.04)", "rgba(255,255,255,0.08)");

    // Emoji
    ctx.font = "44px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(card.emoji, cx + 24, cy + 52);

    // Trend badge
    drawTrendBadge(ctx, cx + cardW - 24, cy + 48, card.pct);

    // Value
    ctx.font = "800 52px sans-serif";
    ctx.fillStyle = WHITE;
    ctx.textAlign = "left";
    ctx.fillText(card.value, cx + 24, cy + 120);

    // Label
    ctx.font = "400 26px sans-serif";
    ctx.fillStyle = MUTED;
    ctx.fillText(card.label, cx + 24, cy + 156);
  });

  y += (cardH + gap) * 2 + 40;

  // Comparison bars section
  ctx.font = "700 28px sans-serif";
  ctx.fillStyle = MUTED;
  ctx.textAlign = "left";
  ctx.fillText("HAFTALIK KARŞILAŞTIRMA", gridX, y);
  y += 40;

  const barData = [
    { label: "Antrenman", current: data.workoutsCompleted, prev: data.previousWeek.workouts, pct: data.comparedToLastWeek.workouts },
    { label: "Tonaj", current: data.totalTonnage / 1000, prev: data.previousWeek.tonnage / 1000, pct: data.comparedToLastWeek.tonnage },
    { label: "Kazanılan", current: data.challengesWon, prev: data.previousWeek.challengesWon, pct: data.comparedToLastWeek.challenges },
  ];

  const barMaxW = CANVAS_W - gridX * 2 - 180;

  barData.forEach((item) => {
    const maxVal = Math.max(item.current, item.prev, 1);

    // Label
    ctx.font = "400 24px sans-serif";
    ctx.fillStyle = MUTED;
    ctx.textAlign = "left";
    ctx.fillText(item.label, gridX, y + 8);

    // Current bar
    const curW = Math.max(12, (item.current / maxVal) * barMaxW);
    const barX = gridX + 160;
    roundRect(ctx, barX, y - 12, curW, 22, 11);
    const barGrad = ctx.createLinearGradient(barX, 0, barX + curW, 0);
    barGrad.addColorStop(0, PRIMARY);
    barGrad.addColorStop(1, EMERALD);
    roundRect(ctx, barX, y - 12, curW, 22, 11, barGrad as any);

    // Current value
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = WHITE;
    ctx.textAlign = "left";
    ctx.fillText(typeof item.current === "number" && item.label === "Tonaj" ? item.current.toFixed(1) + "t" : String(item.current), barX + curW + 12, y + 6);

    y += 36;

    // Previous bar
    const prevW = Math.max(12, (item.prev / maxVal) * barMaxW);
    roundRect(ctx, barX, y - 12, prevW, 22, 11, "rgba(255,255,255,0.12)");

    ctx.font = "400 22px sans-serif";
    ctx.fillStyle = MUTED;
    ctx.fillText(typeof item.prev === "number" && item.label === "Tonaj" ? item.prev.toFixed(1) + "t" : String(item.prev), barX + prevW + 12, y + 6);

    // Trend
    drawTrendBadge(ctx, CANVAS_W - gridX, y + 6, item.pct);

    y += 50;
  });

  y += 20;

  // Top Exercise highlight
  if (data.topExercise && data.topExercise !== "—") {
    roundRect(ctx, gridX, y, CANVAS_W - gridX * 2, 100, 20, "rgba(209,245,38,0.06)", "rgba(209,245,38,0.15)");
    ctx.font = "400 24px sans-serif";
    ctx.fillStyle = MUTED;
    ctx.textAlign = "left";
    ctx.fillText("En Çok Yapılan", gridX + 24, y + 38);
    ctx.font = "700 30px sans-serif";
    ctx.fillStyle = PRIMARY;
    ctx.fillText(data.topExercise, gridX + 24, y + 76);
    y += 130;
  }

  // Bio-Coin earned
  const totalCoins = data.bioCoinsEarned + data.bonusCoinsEarned;
  if (totalCoins > 0) {
    roundRect(ctx, gridX, y, CANVAS_W - gridX * 2, 80, 20, "rgba(250,204,21,0.06)", "rgba(250,204,21,0.12)");
    ctx.font = "700 30px sans-serif";
    ctx.fillStyle = YELLOW;
    ctx.textAlign = "center";
    ctx.fillText(`🪙 +${totalCoins} Bio-Coin kazanıldı`, CANVAS_W / 2, y + 50);
    y += 110;
  }

  // Branding footer
  ctx.font = "600 28px sans-serif";
  ctx.fillStyle = PRIMARY;
  ctx.textAlign = "center";
  ctx.fillText("D Y N A B O L I C", CANVAS_W / 2, CANVAS_H - 80);
  ctx.font = "400 20px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText("Elit Sporcu Sistemi", CANVAS_W / 2, CANVAS_H - 50);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}

export async function shareRecapImage(data: WeeklyRecapData): Promise<void> {
  const blob = await generateRecapImage(data);
  const file = new File([blob], "dynabolic-haftalik-ozet.png", { type: "image/png" });

  // Try Web Share API first (works on iOS PWA & mobile browsers)
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "Haftalık Özetim — Dynabolic",
      text: "Bu haftaki performansıma göz at! 💪",
      files: [file],
    });
    return;
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dynabolic-haftalik-ozet.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
