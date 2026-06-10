
DROP POLICY "Anyone can register" ON public.fishermen;
CREATE POLICY "Anyone can register with valid data" ON public.fishermen
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(first_name) BETWEEN 1 AND 100
    AND length(last_name) BETWEEN 1 AND 100
    AND iin ~ '^[0-9]{12}$'
  );
