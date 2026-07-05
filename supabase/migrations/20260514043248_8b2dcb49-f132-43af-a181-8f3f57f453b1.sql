-- Avatars for staff
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Contributions/donations table
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

-- Auto-update raised_amount on campaigns when a contribution is added/removed
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

-- Storage bucket for staff avatars
INSERT INTO storage.buckets (id, name, public)
  VALUES ('staff-avatars', 'staff-avatars', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Staff avatars viewable by everyone"
  ON storage.objects FOR SELECT USING (bucket_id = 'staff-avatars');

CREATE POLICY "Anyone can upload staff avatars"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'staff-avatars');

CREATE POLICY "Anyone can update staff avatars"
  ON storage.objects FOR UPDATE USING (bucket_id = 'staff-avatars');

CREATE POLICY "Anyone can delete staff avatars"
  ON storage.objects FOR DELETE USING (bucket_id = 'staff-avatars');
