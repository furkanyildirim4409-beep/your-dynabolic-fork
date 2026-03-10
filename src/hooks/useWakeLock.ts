import { useEffect, useRef, useState } from "react";

export function useWakeLock() {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const request = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        setIsLocked(true);
        wakeLockRef.current.addEventListener("release", () => {
          setIsLocked(false);
        });
      }
    } catch (err) {
      console.warn("Wake Lock request failed:", err);
    }
  };

  const release = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
      setIsLocked(false);
    }
  };

  useEffect(() => {
    request();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        request();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      release();
    };
  }, []);

  return { isLocked };
}
