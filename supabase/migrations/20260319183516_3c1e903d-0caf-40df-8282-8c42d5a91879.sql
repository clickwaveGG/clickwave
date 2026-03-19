
CREATE TABLE public.service_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.client_services(id) ON DELETE CASCADE,
  month date NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_by uuid NOT NULL,
  UNIQUE (service_id, month)
);

ALTER TABLE public.service_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view service completions"
  ON public.service_completions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert service completions"
  ON public.service_completions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service completions"
  ON public.service_completions FOR DELETE TO authenticated USING (true);
