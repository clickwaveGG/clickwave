
CREATE POLICY "Users can delete own objectives"
ON public.objectives FOR DELETE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own tasks"
ON public.tasks FOR DELETE TO authenticated
USING (created_by = auth.uid());
