-- Run this in Supabase SQL Editor to fix gallery storage + RLS

-- 1. Ensure event-media bucket exists (public = true means anyone can read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-media', 'event-media', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS: anyone can read, only authenticated users can upload/update/delete
DROP POLICY IF EXISTS "Public read event-media" ON storage.objects;
CREATE POLICY "Public read event-media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-media');

DROP POLICY IF EXISTS "Auth upload event-media" ON storage.objects;
CREATE POLICY "Auth upload event-media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owner update event-media" ON storage.objects;
CREATE POLICY "Owner update event-media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owner delete event-media" ON storage.objects;
CREATE POLICY "Owner delete event-media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Remove dev policies that might conflict
DROP POLICY IF EXISTS "Dev: anon insert" ON public.event_media;
DROP POLICY IF EXISTS "Dev: anon select" ON public.event_media;
DROP POLICY IF EXISTS "Dev: anon update" ON public.event_media;
DROP POLICY IF EXISTS "Dev: anon delete" ON public.event_media;
DROP POLICY IF EXISTS "Dev media all" ON public.event_media;
DROP POLICY IF EXISTS "Allow anon media insert for seed" ON public.event_media;
DROP POLICY IF EXISTS "Allow anon media select" ON public.event_media;

-- 3. event_media table RLS: public SELECT, auth-only INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Media viewable by everyone" ON public.event_media;
CREATE POLICY "Media viewable by everyone"
  ON public.event_media FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff can upload media" ON public.event_media;
CREATE POLICY "Staff can upload media"
  ON public.event_media FOR INSERT
  WITH CHECK (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "Owners update own media" ON public.event_media;
CREATE POLICY "Owners update own media"
  ON public.event_media FOR UPDATE
  USING (auth.uid() = uploader_id);

DROP POLICY IF EXISTS "Owners or admins delete media" ON public.event_media;
CREATE POLICY "Owners or admins delete media"
  ON public.event_media FOR DELETE
  USING (auth.uid() = uploader_id);

-- 4. Ensure RLS is enabled
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
