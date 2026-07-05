-- 1. Roles enum + table
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

-- 2. Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default staff role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Event media
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

-- 4. Campaigns
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

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('event-media', 'event-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-images', 'campaign-images', true);

CREATE POLICY "Public read event-media" ON storage.objects FOR SELECT USING (bucket_id = 'event-media');
CREATE POLICY "Auth upload event-media" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update event-media" ON storage.objects FOR UPDATE
  USING (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete event-media" ON storage.objects FOR DELETE
  USING (bucket_id = 'event-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read campaign-images" ON storage.objects FOR SELECT USING (bucket_id = 'campaign-images');
CREATE POLICY "Auth upload campaign-images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'campaign-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner update campaign-images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'campaign-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete campaign-images" ON storage.objects FOR DELETE
  USING (bucket_id = 'campaign-images' AND auth.uid()::text = (storage.foldername(name))[1]);