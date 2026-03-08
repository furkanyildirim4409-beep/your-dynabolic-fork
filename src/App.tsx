import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { StoryProvider } from "./context/StoryContext";
import { CartProvider } from "./context/CartContext";
import { AchievementProvider } from "./hooks/useAchievements";
import { OfflineProvider } from "./context/OfflineContext";
import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider } from "./context/AuthContext";
import SplashScreen from "./components/SplashScreen";
import AppShell from "./components/AppShell";
import OfflineBanner from "./components/OfflineBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Kokpit from "./pages/Kokpit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppPage = ({ children }: { children: React.ReactNode }) => (
  <AppShell>{children}</AppShell>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={["athlete"]}>{children}</ProtectedRoute>
);

const App = () => {
  const [splashComplete, setSplashComplete] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SettingsProvider>
          <OfflineProvider>
            <CartProvider>
              <StoryProvider>
                <AchievementProvider>
                  <BrowserRouter>
                    <AuthProvider>
                      <Toaster />
                      <Sonner />
                      <OfflineBanner />
                      <div className="relative w-full h-full">
                        <div className="relative z-0">
                          <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/" element={<P><AppPage><Kokpit /></AppPage></P>} />
                            <Route path="/kokpit" element={<P><AppPage><Kokpit /></AppPage></P>} />
                            <Route path="/index" element={<Navigate to="/" replace />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                        {!splashComplete && (
                          <motion.div className="fixed inset-0 z-50" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ pointerEvents: splashComplete ? 'none' : 'auto' }}>
                            <SplashScreen onComplete={() => setSplashComplete(true)} />
                          </motion.div>
                        )}
                      </div>
                    </AuthProvider>
                  </BrowserRouter>
                </AchievementProvider>
              </StoryProvider>
            </CartProvider>
          </OfflineProvider>
        </SettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
