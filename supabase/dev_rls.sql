-- ============================================================
-- Relax RLS for development (revert before production)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Open event_media to anon inserts for dev
DROP POLICY IF EXISTS "Allow anon media insert for seed" ON public.event_media;
DROP POLICY IF EXISTS "Allow anon media select" ON public.event_media;
CREATE POLICY "Dev: anon insert" ON public.event_media FOR INSERT WITH CHECK (true);
CREATE POLICY "Dev: anon select" ON public.event_media FOR SELECT USING (true);
CREATE POLICY "Dev: anon update" ON public.event_media FOR UPDATE USING (true);
CREATE POLICY "Dev: anon delete" ON public.event_media FOR DELETE USING (true);

-- Open campaigns to anon inserts for dev
DROP POLICY IF EXISTS "Campaigns viewable by everyone" ON public.campaigns;
DROP POLICY IF EXISTS "Staff can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Owners update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Owners or admins delete campaigns" ON public.campaigns;
CREATE POLICY "Dev: anon all" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);

-- Open contributions to anon for dev
DROP POLICY IF EXISTS "Contributions viewable by everyone" ON public.contributions;
DROP POLICY IF EXISTS "Authenticated users can contribute" ON public.contributions;
DROP POLICY IF EXISTS "Owners or admins delete contributions" ON public.contributions;
CREATE POLICY "Dev: anon all" ON public.contributions FOR ALL USING (true) WITH CHECK (true);
