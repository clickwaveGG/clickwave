
-- Add size/tier to clients
ALTER TABLE public.clients ADD COLUMN size text NOT NULL DEFAULT 'small';
ALTER TABLE public.clients ADD COLUMN is_recurring boolean NOT NULL DEFAULT false;
ALTER TABLE public.clients ADD COLUMN notes text DEFAULT '';

-- Create client_services table for per-client contracted services
CREATE TABLE public.client_services (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  responsible_id uuid DEFAULT NULL,
  price numeric DEFAULT 0,
  quantity_per_month integer DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all client services"
  ON public.client_services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert client services"
  ON public.client_services FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update client services"
  ON public.client_services FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete client services"
  ON public.client_services FOR DELETE TO authenticated USING (true);
