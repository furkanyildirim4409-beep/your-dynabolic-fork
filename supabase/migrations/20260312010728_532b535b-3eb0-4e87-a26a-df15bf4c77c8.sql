
-- Allow athletes to SELECT diet_template_foods for templates assigned to them via nutrition_targets
CREATE POLICY "Athletes can view assigned template foods"
ON public.diet_template_foods
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nutrition_targets nt
    WHERE nt.athlete_id = auth.uid()
      AND nt.active_diet_template_id = diet_template_foods.template_id
  )
);

-- Allow athletes to SELECT diet_templates assigned to them via nutrition_targets
CREATE POLICY "Athletes can view assigned diet templates"
ON public.diet_templates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.nutrition_targets nt
    WHERE nt.athlete_id = auth.uid()
      AND nt.active_diet_template_id = diet_templates.id
  )
);
