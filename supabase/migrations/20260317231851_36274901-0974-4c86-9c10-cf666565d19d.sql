
-- Table for custom weekly task templates per user
CREATE TABLE public.weekly_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" ON public.weekly_task_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.weekly_task_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.weekly_task_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.weekly_task_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table for daily check state
CREATE TABLE public.weekly_task_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.weekly_task_templates(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  day_index integer NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  checked boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(template_id, week_start, day_index)
);

ALTER TABLE public.weekly_task_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checks" ON public.weekly_task_checks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checks" ON public.weekly_task_checks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checks" ON public.weekly_task_checks
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checks" ON public.weekly_task_checks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed Pedro's default tasks
INSERT INTO public.weekly_task_templates (user_id, label, sort_order)
SELECT p.user_id, t.label, t.sort_order
FROM profiles p,
(VALUES
  ('Verificar desempenho das campanhas ativas (CPA, CTR, ROAS)', 0),
  ('Analisar criativos — pausar os de baixa performance', 1),
  ('Revisar orçamentos e redistribuir budget entre conjuntos', 2),
  ('Checar públicos e audiências — ajustar segmentação se necessário', 3),
  ('Responder leads e verificar qualidade dos formulários', 4),
  ('Atualizar relatório de métricas do cliente', 5),
  ('Testar novos criativos / copies para A/B testing', 6)
) AS t(label, sort_order)
WHERE p.position = 'Gestor de Tráfego';
