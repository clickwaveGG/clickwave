ALTER TABLE public.client_services ADD COLUMN due_date timestamp with time zone DEFAULT NULL;
ALTER TABLE public.client_services ADD COLUMN capture_date timestamp with time zone DEFAULT NULL;