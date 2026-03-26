import React, { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface CustomAudioPlayerProps {
  src: string;
}

const formatTime = (time: number) => {
  if (isNaN(time) || !isFinite(time)) return "0:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const BAR_COUNT = 32;
const BAR_WIDTH = 2;
const BAR_GAP = 1.5;
const CANVAS_HEIGHT = 28;

export const CustomAudioPlayer = ({ src }: CustomAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const waveformRef = useRef<number[]>(Array(BAR_COUNT).fill(0.15));

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");

  const initAudioContext = useCallback(() => {
    if (contextRef.current || !audioRef.current) return;
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      contextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch {
      // Web Audio API not supported or already connected
    }
  }, []);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const bars = waveformRef.current;
    const totalBarWidth = BAR_WIDTH + BAR_GAP;
    const startX = (w - BAR_COUNT * totalBarWidth + BAR_GAP) / 2;

    // Get computed styles for theming
    const computedStyle = getComputedStyle(canvas);
    const primaryColor = computedStyle.getPropertyValue("--primary").trim();
    const mutedColor = computedStyle.getPropertyValue("--muted-foreground").trim();

    const progressFraction = progress / 100;
    const progressBarIndex = Math.floor(progressFraction * BAR_COUNT);

    for (let i = 0; i < BAR_COUNT; i++) {
      const amplitude = bars[i];
      const barH = Math.max(2, amplitude * (h - 4));
      const x = startX + i * totalBarWidth;
      const y = (h - barH) / 2;

      const isPast = i <= progressBarIndex;
      if (isPast) {
        ctx.fillStyle = `hsl(${primaryColor})`;
      } else {
        ctx.fillStyle = `hsl(${mutedColor} / 0.35)`;
      }

      // Rounded bars
      const radius = BAR_WIDTH / 2;
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + BAR_WIDTH - radius, y);
      ctx.quadraticCurveTo(x + BAR_WIDTH, y, x + BAR_WIDTH, y + radius);
      ctx.lineTo(x + BAR_WIDTH, y + barH - radius);
      ctx.quadraticCurveTo(x + BAR_WIDTH, y + barH, x + BAR_WIDTH - radius, y + barH);
      ctx.lineTo(x + radius, y + barH);
      ctx.quadraticCurveTo(x, y + barH, x, y + barH - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.fill();
    }
  }, [progress]);

  const animateWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const bars = waveformRef.current;
      for (let i = 0; i < BAR_COUNT; i++) {
        const dataIndex = Math.floor((i / BAR_COUNT) * data.length);
        const target = Math.max(0.08, data[dataIndex] / 255);
        bars[i] = bars[i] * 0.6 + target * 0.4; // smooth
      }
    }
    drawWaveform();
    animFrameRef.current = requestAnimationFrame(animateWaveform);
  }, [drawWaveform]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(animateWaveform);
    } else {
      cancelAnimationFrame(animFrameRef.current);
      drawWaveform(); // final static draw
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, animateWaveform, drawWaveform]);

  // Draw initial static waveform
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    initAudioContext();
    if (contextRef.current?.state === "suspended") {
      contextRef.current.resume();
    }
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, initAudioContext]);

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    setProgress(isNaN(pct) ? 0 : pct);
    setCurrentTime(formatTime(audio.currentTime));
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(formatTime(audioRef.current.duration));
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("0:00");
    // Reset bars to idle
    waveformRef.current = Array(BAR_COUNT).fill(0.15);
    drawWaveform();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  };

  return (
    <div className="flex items-center gap-2.5 bg-background/50 backdrop-blur-sm border border-border/50 rounded-full px-3 py-2 w-full max-w-[260px]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={onEnded}
        className="hidden"
      />
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex-shrink-0 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <div
          className="w-full cursor-pointer"
          onClick={handleSeek}
          style={{ height: CANVAS_HEIGHT }}
        >
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: CANVAS_HEIGHT }}
          />
        </div>
        <div className="flex justify-between w-full text-[9px] font-medium text-muted-foreground px-0.5">
          <span>{currentTime}</span>
          <span>{duration}</span>
        </div>
      </div>
    </div>
  );
};
