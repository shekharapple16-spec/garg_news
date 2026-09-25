-- Run this in the Supabase SQL editor for the Garg News project.
-- It fixes the live update/delete flow by allowing authenticated admin users
-- to manage rows while keeping published stories readable publicly.

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published news" ON public.news;
CREATE POLICY "Public can read published news"
ON public.news
FOR SELECT
USING (status = 'published');

DROP POLICY IF EXISTS "Authenticated users can manage news" ON public.news;
CREATE POLICY "Authenticated users can manage news"
ON public.news
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Optional stricter policy if you want to restrict editing to a specific email only:
-- DROP POLICY IF EXISTS "Admin can manage news" ON public.news;
-- CREATE POLICY "Admin can manage news"
-- ON public.news
-- FOR ALL
-- TO authenticated
-- USING (auth.email() = 'admin@yourdomain.com')
-- WITH CHECK (auth.email() = 'admin@yourdomain.com');
