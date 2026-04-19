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
import StoryViewer from "./components/StoryViewer";
import UniversalCartDrawer from "./components/UniversalCartDrawer";
import FloatingCartButton from "./components/FloatingCartButton";
import AchievementNotificationLayer from "./components/AchievementNotificationLayer";
import OfflineBanner from "./components/OfflineBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Kokpit from "./pages/Kokpit";
import Antrenman from "./pages/Antrenman";
import Beslenme from "./pages/Beslenme";
import Kesfet from "./pages/Kesfet";
import Profil from "./pages/Profil";
import CoachProfile from "./pages/CoachProfile";
import Akademi from "./pages/Akademi";
import Tarifler from "./pages/Tarifler";
import Payments from "./pages/Payments";
import Services from "./pages/Services";
import SaglikTrendleri from "./pages/SaglikTrendleri";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import BiometricLogin from "./pages/BiometricLogin";
import CoachAthletes from "./pages/CoachAthletes";
import Onboarding from "./pages/Onboarding";
import Destek from "./pages/Destek";
import Waitlist from "./pages/Waitlist";
import CoachWaitlist from "./pages/CoachWaitlist";
import AutoLogin from "./pages/AutoLogin";
import PostDetail from "./pages/PostDetail";

const queryClient = new QueryClient();

const AppPage = ({ children }: { children: React.ReactNode }) => (
  <AppShell>{children}</AppShell>
);

const P = ({ children, skipOnboardingCheck }: { children: React.ReactNode; skipOnboardingCheck?: boolean }) => (
  <ProtectedRoute skipOnboardingCheck={skipOnboardingCheck}>{children}</ProtectedRoute>
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
                <BrowserRouter>
                  <AuthProvider>
                    <AchievementProvider>
                      <Toaster />
                      <Sonner />
                      <OfflineBanner />

                      <div className="relative w-full h-full">
                        <div className="relative z-0">
                          <Routes>
                            {/* Public */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/biometric-login" element={<BiometricLogin />} />
                            <Route path="/waitlist" element={<Waitlist />} />
                            <Route path="/coach-waitlist" element={<CoachWaitlist />} />
                            <Route path="/auto-login" element={<AutoLogin />} />
                            <Route path="/onboarding" element={<P skipOnboardingCheck><Onboarding /></P>} />

                            {/* Protected athlete routes */}
                            <Route path="/" element={<P><AppPage><Kokpit /></AppPage></P>} />
                            <Route path="/kokpit" element={<P><AppPage><Kokpit /></AppPage></P>} />
                            <Route path="/antrenman" element={<P><AppPage><Antrenman /></AppPage></P>} />
                            <Route path="/beslenme" element={<P><AppPage><Beslenme /></AppPage></P>} />
                            <Route path="/kesfet" element={<P><AppPage><Kesfet /></AppPage></P>} />
                            <Route path="/profil" element={<P><AppPage><Profil /></AppPage></P>} />
                            <Route path="/coach/:coachId" element={<P><CoachProfile /></P>} />
                            <Route path="/akademi" element={<P><AppPage><Akademi /></AppPage></P>} />
                            <Route path="/tarifler" element={<P><AppPage><Tarifler /></AppPage></P>} />
                            <Route path="/odemeler" element={<P><AppPage><Payments /></AppPage></P>} />
                            <Route path="/hizmetler" element={<P><Services /></P>} />
                            <Route path="/saglik-trendleri" element={<P><SaglikTrendleri /></P>} />
                            <Route path="/achievements" element={<P><Achievements /></P>} />
                            <Route path="/leaderboard" element={<P><Leaderboard /></P>} />
                            <Route path="/sporcularim" element={<P><CoachAthletes /></P>} />
                            <Route path="/destek" element={<P><AppPage><Destek /></AppPage></P>} />
                            <Route path="/post/:id" element={<P><AppPage><PostDetail /></AppPage></P>} />

                            <Route path="/index" element={<Navigate to="/" replace />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>

                        {!splashComplete && (
                          <motion.div
                            className="fixed inset-0 z-50"
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{ pointerEvents: splashComplete ? 'none' : 'auto' }}
                          >
                            <SplashScreen onComplete={() => setSplashComplete(true)} />
                          </motion.div>
                        )}
                      </div>

                      <StoryViewer />
                      <UniversalCartDrawer />
                      <FloatingCartButton />
                      <AchievementNotificationLayer />
                    </AchievementProvider>
                  </AuthProvider>
                </BrowserRouter>
              </StoryProvider>
            </CartProvider>
          </OfflineProvider>
        </SettingsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
