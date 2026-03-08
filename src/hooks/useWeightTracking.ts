import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface WeightEntry {
  id: string;
  weight_kg: number;
  logged_at: string;
}

export function useWeightTracking() {
  const { user, refreshProfile } = useAuth();
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('weight_logs')
      .select('id, weight_kg, logged_at')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: true })
      .limit(30);

    if (!error && data) {
      setWeightHistory(data as WeightEntry[]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const logWeight = useCallback(async (weightKg: number) => {
    if (!user) return { error: 'Not authenticated' };

    const { error: logError } = await supabase
      .from('weight_logs')
      .insert({ user_id: user.id, weight_kg: weightKg });

    if (logError) {
      console.error('Weight log insert error:', logError);
      return { error: logError.message };
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ current_weight: weightKg })
      .eq('id', user.id);

    if (profileError) return { error: profileError.message };

    await refreshProfile();
    await fetchHistory();
    return { error: null };
  }, [user, refreshProfile, fetchHistory]);

  const latestWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].weight_kg
    : null;

  return { weightHistory, latestWeight, logWeight, isLoading };
}
