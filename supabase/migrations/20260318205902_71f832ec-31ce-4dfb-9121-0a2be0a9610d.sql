
CREATE TABLE public.recurring_task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  completion_date date NOT NULL,
  completed_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(task_id, completion_date)
);

ALTER TABLE public.recurring_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view completions"
  ON public.recurring_task_completions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert completions"
  ON public.recurring_task_completions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = completed_by);

CREATE POLICY "Admins can manage completions"
  ON public.recurring_task_completions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own completions"
  ON public.recurring_task_completions FOR DELETE TO authenticated
  USING (auth.uid() = completed_by);
