import { useState, useCallback } from "react";
export const usePaymentReminders = () => {
  const [reminders] = useState([]);
  return { reminders, checkPaymentReminders: useCallback(() => {}, []), showReminderNotifications: useCallback(() => {}, []) };
};