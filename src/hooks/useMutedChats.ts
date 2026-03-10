import { useState, useCallback } from "react";

const STORAGE_KEY = "muted_chats";

function getStoredMuted(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useMutedChats() {
  const [mutedIds, setMutedIds] = useState<string[]>(getStoredMuted);

  const isMuted = useCallback(
    (userId: string) => mutedIds.includes(userId),
    [mutedIds]
  );

  const toggleMute = useCallback((userId: string) => {
    setMutedIds((prev) => {
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { mutedIds, isMuted, toggleMute };
}
