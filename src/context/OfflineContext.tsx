import { createContext, useContext, useState, ReactNode } from "react";

interface OfflineContextType {
  isOffline: boolean;
  setOfflineMode: (offline: boolean) => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider = ({ children }: { children: ReactNode }) => {
  const [isOffline, setIsOffline] = useState(() => {
    const saved = localStorage.getItem("dynabolic-offline-mode");
    return saved === "true";
  });

  const setOfflineMode = (offline: boolean) => {
    setIsOffline(offline);
    localStorage.setItem("dynabolic-offline-mode", String(offline));
  };

  return (
    <OfflineContext.Provider value={{ isOffline, setOfflineMode }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOfflineMode = () => {
  const context = useContext(OfflineContext);
  if (!context) throw new Error("useOfflineMode must be used within OfflineProvider");
  return context;
};