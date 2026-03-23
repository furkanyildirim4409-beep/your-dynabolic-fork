-- Part 1: Gamification Schema

-- 1. Alter profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_volume_kg numeric DEFAULT 0;

-- 2. Create badges table
CREATE TABLE public.badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    icon_name text,
    category text,
    tier text,
    condition_type text,
    condition_value integer,
    xp_reward integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to badges" ON public.badges FOR SELECT TO authenticated USING (true);

-- 3. Create athlete_badges table
CREATE TABLE public.athlete_badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    earned_at timestamptz DEFAULT now(),
    UNIQUE(athlete_id, badge_id)
);
ALTER TABLE public.athlete_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can view own badges" ON public.athlete_badges FOR SELECT TO authenticated USING (auth.uid() = athlete_id);
CREATE POLICY "Athletes can insert own badges" ON public.athlete_badges FOR INSERT TO authenticated WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "Coaches can view athlete badges" ON public.athlete_badges FOR SELECT TO authenticated USING (is_coach_of(athlete_id));

-- 4. Create challenges table
CREATE TABLE public.challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opponent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_type text NOT NULL,
    exercise_name text,
    wager_coins integer DEFAULT 0,
    status text DEFAULT 'pending',
    start_date timestamptz,
    end_date timestamptz,
    winner_id uuid REFERENCES public.profiles(id),
    challenger_value numeric DEFAULT 0,
    opponent_value numeric DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their challenges" ON public.challenges FOR SELECT TO authenticated USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT TO authenticated WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Users can update their challenges" ON public.challenges FOR UPDATE TO authenticated USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- 5. Seed badges from gamificationData.ts
INSERT INTO public.badges (name, description, icon_name, category, tier, condition_type, condition_value, xp_reward) VALUES
('Erken Kuş', 'Sabahın köründe ter dök', 'Sunrise', 'consistency', 'gold', 'early_workouts', 10, 150),
('Haftalık Savaşçı', 'Bir hafta boyunca hiç ara verme', 'Flame', 'consistency', 'silver', 'streak_days', 7, 100),
('Demir İrade', 'Bir ay boyunca disiplini koru', 'Flame', 'consistency', 'platinum', 'streak_days', 30, 500),
('Tutarlılık Kralı', 'Antrenman programına sadık kal', 'Crown', 'consistency', 'gold', 'monthly_completion_rate', 90, 200),
('Ağır Kaldırıcı', 'Ciddi ağırlıklar taşı', 'Dumbbell', 'strength', 'gold', 'max_weight_kg', 100, 150),
('Rekor Kırıcı', 'Kendi sınırlarını aş', 'Trophy', 'strength', 'silver', 'personal_records', 5, 120),
('Tonaj Ustası', 'Toplam kaldırılan ağırlıkta zirveye ulaş', 'Zap', 'strength', 'platinum', 'session_tonnage_kg', 10000, 300),
('İlk Adım', 'Yolculuğun burada başlıyor', 'Target', 'milestone', 'bronze', 'workouts_completed', 1, 50),
('Yüzüncü Antrenman', 'Üç haneli rakamlar kulübüne hoş geldin', 'Award', 'milestone', 'platinum', 'workouts_completed', 100, 400),
('Yıl Savaşçısı', 'Bir yıl boyunca aktif kal', 'Calendar', 'milestone', 'platinum', 'active_days', 200, 1000),
('Vision AI Öncüsü', 'Geleceğin teknolojisini benimse', 'Sparkles', 'special', 'gold', 'vision_ai_workouts', 10, 200),
('Beşli Seri', 'Meydan okumalarda seriye gir', 'Swords', 'special', 'gold', 'challenge_wins_streak', 5, 250),
('Efsane Savaşçı', 'Meydan okumalarda yenilmez ol', 'Crown', 'special', 'platinum', 'challenge_wins_streak', 10, 500);