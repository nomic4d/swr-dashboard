-- ============================================================
-- Run this entire script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- Drop existing tables to start fresh (safe to run first time too)
DROP TABLE IF EXISTS public.contributions CASCADE;
DROP TABLE IF EXISTS public.gallery_moderation CASCADE;
DROP TABLE IF EXISTS public.event_media CASCADE;
DROP TABLE IF EXISTS public.staff_event_attendance CASCADE;
DROP TABLE IF EXISTS public.reminders CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ============================================================
-- 1. EVENTS
-- ============================================================
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  month TEXT NOT NULL,
  event_number INTEGER,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Events insertable by anyone" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Events updatable by anyone" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Events deletable by anyone" ON public.events FOR DELETE USING (true);

-- ============================================================
-- 2. STAFF
-- ============================================================
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  department TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff viewable by everyone" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Staff insertable by anyone" ON public.staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff updatable by anyone" ON public.staff FOR UPDATE USING (true);
CREATE POLICY "Staff deletable by anyone" ON public.staff FOR DELETE USING (true);

-- ============================================================
-- 3. REMINDERS
-- ============================================================
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reminders viewable by everyone" ON public.reminders FOR SELECT USING (true);
CREATE POLICY "Reminders insertable by anyone" ON public.reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Reminders updatable by anyone" ON public.reminders FOR UPDATE USING (true);
CREATE POLICY "Reminders deletable by anyone" ON public.reminders FOR DELETE USING (true);

-- ============================================================
-- 4. STAFF EVENT ATTENDANCE
-- ============================================================
CREATE TABLE public.staff_event_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('attending', 'declined', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, event_id)
);

ALTER TABLE public.staff_event_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendance viewable by everyone" ON public.staff_event_attendance FOR SELECT USING (true);
CREATE POLICY "Attendance insertable by anyone" ON public.staff_event_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Attendance updatable by anyone" ON public.staff_event_attendance FOR UPDATE USING (true);
CREATE POLICY "Attendance deletable by anyone" ON public.staff_event_attendance FOR DELETE USING (true);

-- ============================================================
-- 5. PROFILES (matches what the app code queries)
--    Columns: id, email, full_name, department, role, is_approved, avatar_url
-- ============================================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles insertable by anyone" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles updatable by anyone" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Profiles deletable by anyone" ON public.profiles FOR DELETE USING (true);

-- ============================================================
-- 6. USER ROLES (for Supabase auth integration)
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Roles viewable by everyone" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default staff role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (email, full_name, role)
  VALUES (NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'staff');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 7. EVENT MEDIA
-- ============================================================
CREATE TABLE public.event_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media viewable by everyone" ON public.event_media FOR SELECT USING (true);
CREATE POLICY "Staff can upload media" ON public.event_media FOR INSERT
  WITH CHECK (auth.uid() = uploader_id AND (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Owners update own media" ON public.event_media FOR UPDATE USING (auth.uid() = uploader_id);
CREATE POLICY "Owners or admins delete media" ON public.event_media FOR DELETE
  USING (auth.uid() = uploader_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 8. CAMPAIGNS
-- ============================================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  goal_amount NUMERIC(12,2) DEFAULT 0,
  raised_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaigns viewable by everyone" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Staff can create campaigns" ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = creator_id AND (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Owners update own campaigns" ON public.campaigns FOR UPDATE USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners or admins delete campaigns" ON public.campaigns FOR DELETE
  USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 9. CONTRIBUTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contributor_id UUID,
  contributor_name TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributions viewable by everyone"
  ON public.contributions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can contribute"
  ON public.contributions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND (contributor_id IS NULL OR contributor_id = auth.uid()));
CREATE POLICY "Owners or admins delete contributions"
  ON public.contributions FOR DELETE
  USING (auth.uid() = contributor_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_contributions_campaign ON public.contributions(campaign_id);

-- Auto-update raised_amount on campaigns
CREATE OR REPLACE FUNCTION public.update_campaign_raised()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.campaigns SET raised_amount = COALESCE(raised_amount,0) + NEW.amount, updated_at = now() WHERE id = NEW.campaign_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.campaigns SET raised_amount = GREATEST(0, COALESCE(raised_amount,0) - OLD.amount), updated_at = now() WHERE id = OLD.campaign_id;
  END IF;
  RETURN NULL;
END; $$;

DROP TRIGGER IF EXISTS trg_contrib_update_campaign ON public.contributions;
CREATE TRIGGER trg_contrib_update_campaign
  AFTER INSERT OR DELETE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_raised();

-- ============================================================
-- 10. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 11. STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('event-media', 'event-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-images', 'campaign-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('staff-avatars', 'staff-avatars', true) ON CONFLICT (id) DO NOTHING;
