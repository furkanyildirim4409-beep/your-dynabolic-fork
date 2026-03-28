import { useState, useEffect, useRef, useCallback } from "react";

interface UseStableTimerOptions {
  mode: "up" | "down";
  initialSeconds?: number;
  autoStart?: boolean;
  onComplete?: () => void;
  onBeforeComplete?: () => void;
  tickInterval?: number;
}

export function useStableTimer({
  mode,
  initialSeconds = 0,
  autoStart = true,
  onComplete,
  onBeforeComplete,
  tickInterval = 250,
}: UseStableTimerOptions) {
  const [seconds, setSeconds] = useState(mode === "up" ? 0 : initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  const startTimestampRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const onBeforeCompleteRef = useRef(onBeforeComplete);
  const initialRef = useRef(initialSeconds);
  const modeRef = useRef(mode);

  onCompleteRef.current = onComplete;
  onBeforeCompleteRef.current = onBeforeComplete;
  initialRef.current = initialSeconds;
  modeRef.current = mode;

  const computeSeconds = useCallback(() => {
    const delta = Math.floor((Date.now() - startTimestampRef.current) / 1000);
    const totalElapsed = accumulatedRef.current + delta;

    if (modeRef.current === "up") {
      return totalElapsed;
    } else {
      return Math.max(0, initialRef.current - totalElapsed);
    }
  }, []);

  const update = useCallback(() => {
    if (completedRef.current) return;
    const val = computeSeconds();
    setSeconds(val);

    if (modeRef.current === "down" && val <= 0 && !completedRef.current) {
      completedRef.current = true;
      setIsRunning(false);
      onCompleteRef.current?.();
    }
  }, [computeSeconds]);

  // Tick interval
  useEffect(() => {
    if (!isRunning) return;
    startTimestampRef.current = Date.now();
    completedRef.current = false;

    const id = setInterval(update, tickInterval);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        update();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibility);
      // Accumulate elapsed time when stopping the interval
      const delta = Math.floor((Date.now() - startTimestampRef.current) / 1000);
      accumulatedRef.current += delta;
    };
  }, [isRunning, update, tickInterval]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    setIsRunning(true);
  }, []);

  const toggle = useCallback(() => {
    setIsRunning((r) => !r);
  }, []);

  const reset = useCallback((newInitial?: number) => {
    const init = newInitial ?? initialRef.current;
    initialRef.current = init;
    accumulatedRef.current = 0;
    completedRef.current = false;
    startTimestampRef.current = Date.now();
    setSeconds(modeRef.current === "up" ? 0 : init);
    setIsRunning(true);
  }, []);

  const addTime = useCallback((s: number) => {
    initialRef.current = Math.max(10, initialRef.current + s);
    // Recompute current value with new initial
    const val = computeSeconds();
    // Adjust so adding time extends remaining
    setSeconds(Math.max(0, val + s));
    // We need to adjust accumulated to account for the shift
    // The simplest approach: don't touch accumulated, just change initial
  }, [computeSeconds]);

  const setInitial = useCallback((s: number) => {
    initialRef.current = s;
    accumulatedRef.current = 0;
    completedRef.current = false;
    startTimestampRef.current = Date.now();
    setSeconds(modeRef.current === "up" ? 0 : s);
    setIsRunning(true);
  }, []);

  return { seconds, isRunning, pause, resume, toggle, reset, addTime, setInitial };
}
