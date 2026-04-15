-- Allow all authenticated users to read coach profiles (public-facing data)
CREATE POLICY "Authenticated users can view coach profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (role = 'coach');