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

    if (error) {
      console.error('Weight history fetch error:', error.message, error);
    } else if (data) {
      setWeightHistory(data as WeightEntry[]);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const logWeight = useCallback(async (weightKg: number) => {
    if (!user) {
      console.error('Weight log blocked: no authenticated user from context.');
      return { error: 'Not authenticated' };
    }

    const safeWeight = Number(weightKg);
    if (isNaN(safeWeight) || safeWeight <= 0) {
      console.error('Weight log blocked: invalid weight value', weightKg);
      return { error: 'Invalid weight value' };
    }

    console.log('logWeight: inserting weight_logs', { user_id: user.id, weight_kg: safeWeight });

    const { error: logError } = await supabase
      .from('weight_logs')
      .insert({ user_id: user.id, weight_kg: safeWeight });

    if (logError) {
      console.error('Weight log INSERT failed:', JSON.stringify(logError, null, 2));
      return { error: logError.message };
    }

    console.log('logWeight: updating profiles.current_weight', { id: user.id, current_weight: safeWeight });

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ current_weight: safeWeight })
      .eq('id', user.id);

    if (profileError) {
      console.error('Profile UPDATE failed:', JSON.stringify(profileError, null, 2));
      return { error: profileError.message };
    }

    await refreshProfile();
    await fetchHistory();
    return { error: null };
  }, [user, refreshProfile, fetchHistory]);

  const latestWeight = weightHistory.length > 0
    ? weightHistory[weightHistory.length - 1].weight_kg
    : null;

  return { weightHistory, latestWeight, logWeight, isLoading };
}

