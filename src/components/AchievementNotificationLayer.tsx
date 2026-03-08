import { useAchievements } from "@/hooks/useAchievements";
import AchievementUnlockNotification from "./AchievementUnlockNotification";

const AchievementNotificationLayer = () => {
  const { pendingAchievement, dismissAchievement } = useAchievements();
  return <AchievementUnlockNotification achievement={pendingAchievement} onClose={dismissAchievement} />;
};

export default AchievementNotificationLayer;
