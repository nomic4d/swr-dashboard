-- Run this in Supabase SQL Editor
-- Adds likes and comments system for gallery media

-- 1. Media likes
CREATE TABLE IF NOT EXISTS public.media_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.event_media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(media_id, user_id)
);
ALTER TABLE public.media_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.media_likes;
DROP POLICY IF EXISTS "Auth users can like" ON public.media_likes;
DROP POLICY IF EXISTS "Users can unlike" ON public.media_likes;

CREATE POLICY "Likes viewable by everyone" ON public.media_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like" ON public.media_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.media_likes FOR DELETE USING (auth.uid() = user_id);

-- 2. Media comments
CREATE TABLE IF NOT EXISTS public.media_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id UUID NOT NULL REFERENCES public.event_media(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.media_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.media_comments;
DROP POLICY IF EXISTS "Auth users can comment" ON public.media_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.media_comments;

CREATE POLICY "Comments viewable by everyone" ON public.media_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can comment" ON public.media_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.media_comments FOR DELETE USING (auth.uid() = user_id);

-- Add user_email column if it doesn't exist (for existing tables)
ALTER TABLE public.media_comments ADD COLUMN IF NOT EXISTS user_email TEXT;
