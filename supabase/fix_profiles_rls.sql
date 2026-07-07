-- Fix RLS on profiles table so admin can see all team members
-- Run this in Supabase SQL Editor

DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Profiles insertable by anyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles updatable by anyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles deletable by anyone" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles insertable by anyone" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles updatable by anyone" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Profiles deletable by anyone" ON public.profiles FOR DELETE USING (true);

-- Verify profiles exist
SELECT id, email, full_name, role FROM public.profiles ORDER BY full_name;
