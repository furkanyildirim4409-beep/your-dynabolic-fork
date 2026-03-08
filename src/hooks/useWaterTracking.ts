import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useWaterTracking() {
  const { user } = useAuth();
  const [totalMl, setTotalMl] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const todayRange = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    return { start, end };
  }, []);

  const fetchToday = useCallback(async () => {
    if (!user) return;
    const { start, end } = todayRange();
    const { data, error } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', user.id)
      .gte('logged_at', start)
      .lt('logged_at', end);

    if (!error && data) {
      setTotalMl(data.reduce((sum, r) => sum + r.amount_ml, 0));
    }
    setIsLoading(false);
  }, [user, todayRange]);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const addWater = useCallback(async (amountMl: number = 250) => {
    if (!user) return;
    const { error } = await supabase
      .from('water_logs')
      .insert({ user_id: user.id, amount_ml: amountMl });

    if (!error) {
      setTotalMl(prev => prev + amountMl);
    }
    return error;
  }, [user]);

  const removeLatestWater = useCallback(async () => {
    if (!user) return;
    const { start, end } = todayRange();
    const { data } = await supabase
      .from('water_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('logged_at', start)
      .lt('logged_at', end)
      .order('logged_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const { error } = await supabase.from('water_logs').delete().eq('id', data.id);
      if (!error) {
        await fetchToday();
      }
      return error;
    }
  }, [user, todayRange, fetchToday]);

  return { totalMl, addWater, removeLatestWater, isLoading };
}
