
CREATE TABLE public.fishermen (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  iin TEXT NOT NULL UNIQUE CHECK (iin ~ '^[0-9]{12}$'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.fishermen TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fishermen TO authenticated;
GRANT ALL ON public.fishermen TO service_role;

ALTER TABLE public.fishermen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register" ON public.fishermen FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can view registry" ON public.fishermen FOR SELECT TO anon, authenticated USING (true);
