-- Run in Supabase SQL Editor

-- 1. Create albums table
CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  template TEXT NOT NULL DEFAULT 'grid' CHECK (template IN ('scroll', 'grid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Albums viewable by everyone" ON public.albums FOR SELECT USING (true);
CREATE POLICY "Users can create albums" ON public.albums FOR INSERT WITH CHECK (auth.uid() = uploader_id);
CREATE POLICY "Owners update albums" ON public.albums FOR UPDATE USING (auth.uid() = uploader_id);
CREATE POLICY "Owners delete albums" ON public.albums FOR DELETE USING (auth.uid() = uploader_id);

-- 2. Add cover_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 3. Add album_id to event_media
ALTER TABLE public.event_media ADD COLUMN IF NOT EXISTS album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL;
ALTER TABLE public.event_media ADD COLUMN IF NOT EXISTS media_date TEXT;
ALTER TABLE public.event_media ADD COLUMN IF NOT EXISTS media_time TEXT;
ALTER TABLE public.event_media ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
