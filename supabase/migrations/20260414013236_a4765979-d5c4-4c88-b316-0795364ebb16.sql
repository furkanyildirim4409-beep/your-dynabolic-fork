CREATE TABLE public.story_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id uuid REFERENCES public.coach_stories(id) ON DELETE CASCADE NOT NULL,
    viewer_id uuid NOT NULL,
    viewed_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own views"
ON public.story_views FOR INSERT TO authenticated
WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can read own views"
ON public.story_views FOR SELECT TO authenticated
USING (auth.uid() = viewer_id);

CREATE POLICY "Coaches can read views on their stories"
ON public.story_views FOR SELECT TO authenticated
USING (story_id IN (SELECT id FROM public.coach_stories WHERE coach_id = auth.uid()));