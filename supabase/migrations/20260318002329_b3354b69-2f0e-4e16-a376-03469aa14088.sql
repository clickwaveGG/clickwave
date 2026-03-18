DROP POLICY "Creator can delete own clients" ON public.clients;
CREATE POLICY "Authenticated users can delete clients"
  ON public.clients FOR DELETE TO authenticated USING (true);