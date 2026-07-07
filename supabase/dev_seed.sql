-- ============================================================
-- Dev seed: relax RLS + seed test data + Pexels sample images
-- Run in Supabase SQL Editor once after schema.sql
-- ============================================================

-- ========== 1. Relax RLS + constraints for dev ==========
ALTER TABLE public.event_media DROP CONSTRAINT IF EXISTS event_media_uploader_id_fkey;
ALTER TABLE public.event_media ALTER COLUMN uploader_id DROP NOT NULL;
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_creator_id_fkey;
ALTER TABLE public.campaigns ALTER COLUMN creator_id DROP NOT NULL;
DROP POLICY IF EXISTS "Staff can upload media" ON public.event_media;
DROP POLICY IF EXISTS "Owners update own media" ON public.event_media;
DROP POLICY IF EXISTS "Owners or admins delete media" ON public.event_media;
DROP POLICY IF EXISTS "Media viewable by everyone" ON public.event_media;
DROP POLICY IF EXISTS "Allow anon media insert for seed" ON public.event_media;
DROP POLICY IF EXISTS "Allow anon media select" ON public.event_media;
DROP POLICY IF EXISTS "Dev: anon insert" ON public.event_media;
DROP POLICY IF EXISTS "Dev: anon select" ON public.event_media;
DROP POLICY IF EXISTS "Dev: anon update" ON public.event_media;
DROP POLICY IF EXISTS "Dev: anon delete" ON public.event_media;

CREATE POLICY "Dev media all" ON public.event_media FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Campaigns viewable by everyone" ON public.campaigns;
DROP POLICY IF EXISTS "Staff can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Owners update own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Owners or admins delete campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Dev: anon all" ON public.campaigns;

CREATE POLICY "Dev campaigns all" ON public.campaigns FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Contributions viewable by everyone" ON public.contributions;
DROP POLICY IF EXISTS "Authenticated users can contribute" ON public.contributions;
DROP POLICY IF EXISTS "Owners or admins delete contributions" ON public.contributions;
DROP POLICY IF EXISTS "Dev: anon all" ON public.contributions;

CREATE POLICY "Dev contributions all" ON public.contributions FOR ALL USING (true) WITH CHECK (true);

-- ========== 2. Seed Events ==========
INSERT INTO public.events (title, description, event_date, month, event_number, location)
SELECT * FROM (VALUES
  ('Orange Fest', 'Annual Orange Fest celebration', '2026-02-02'::date, 'February', 1, 'Islamabad'),
  ('Eid Milan Party (High Tea)', 'Eid Milan high tea event', '2026-03-15'::date, 'March', 2, 'Islamabad'),
  ('Fun Fiesta Office Games Day', 'Office games and fun activities', '2026-04-28'::date, 'April', 3, 'Islamabad'),
  ('Day Trip to Tarbela Lake', 'Day trip to Tarbela Lake', '2026-05-28'::date, 'May', 4, 'Tarbela'),
  ('One Night Retreat at Hill Station & Dinner', 'Overnight retreat at hill station', '2026-06-15'::date, 'June', 5, 'Hill Station'),
  ('Mango Fest', 'Mango festival celebration', '2026-07-15'::date, 'July-August', 6, 'Islamabad'),
  ('Sports Week', 'Annual sports week', '2026-09-12'::date, 'September', 7, 'Islamabad'),
  ('Music Night', 'Music night performance', '2026-10-17'::date, 'October', 8, 'Islamabad'),
  ('Hike and Drink', 'Hiking trip to Margalla Hills', '2026-11-14'::date, 'November', 9, 'Margalla Hills'),
  ('Soup Day / Movie Night', 'Soup day and movie night', '2026-12-12'::date, 'December', 10, 'Islamabad')
) AS v(title, description, event_date, month, event_number, location)
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE event_number = v.event_number);

-- ========== 3. Seed Staff ==========
INSERT INTO public.staff (name, phone_number, email, department, is_active)
SELECT * FROM (VALUES
  ('Ahmad Khan', '0300-1234567', 'ahmad@swr.com', 'Management', true),
  ('Sara Ali', '0300-2345678', 'sara@swr.com', 'HR', true),
  ('Usman Tariq', '0300-3456789', 'usman@swr.com', 'Finance', true),
  ('Fatima Noor', '0300-4567890', 'fatima@swr.com', 'Operations', true),
  ('Bilal Ahmed', '0300-5678901', 'bilal@swr.com', 'IT', true),
  ('Zainab Hussain', '0300-6789012', 'zainab@swr.com', 'Marketing', true),
  ('Omar Farooq', '0300-7890123', 'omar@swr.com', 'Management', true),
  ('Hira Batool', '0300-8901234', 'hira@swr.com', 'HR', false)
) AS v(name, phone_number, email, department, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.staff WHERE email = v.email);

-- ========== 4. Ensure asif profile ==========
INSERT INTO public.profiles (email, full_name, role, is_approved)
VALUES ('asif@adb.org', 'Asif', 'manager', true)
ON CONFLICT DO NOTHING;

-- ========== 5. Seed Campaigns ==========
INSERT INTO public.campaigns (id, title, description, category, goal_amount, raised_amount, status)
SELECT * FROM (VALUES
  (gen_random_uuid(), 'Flood Relief Campaign', 'Support for flood-affected families', 'Emergency Response', 500000, 150000, 'active'),
  (gen_random_uuid(), 'Food Distribution Drive', 'Distributing food packages to communities in need', 'Community Service', 200000, 80000, 'active'),
  (gen_random_uuid(), 'Medical Camp', 'Free medical checkup camp for underprivileged', 'Healthcare', 300000, 120000, 'active'),
  (gen_random_uuid(), 'Tree Plantation Drive', 'Planting trees for a greener environment', 'Environment', 100000, 45000, 'active')
) AS v(id, title, description, category, goal_amount, raised_amount, status)
WHERE NOT EXISTS (SELECT 1 FROM public.campaigns WHERE title = v.title);

-- ========== 6. Seed Event Media (Pexels Images) ==========
DO $$
DECLARE
  profile_id UUID;
  event_rec RECORD;
  pexels_urls TEXT[] := ARRAY[
    'https://picsum.photos/seed/event1/800/600',
    'https://picsum.photos/seed/event2/800/600',
    'https://picsum.photos/seed/event3/800/600',
    'https://picsum.photos/seed/event4/800/600',
    'https://picsum.photos/seed/event5/800/600',
    'https://picsum.photos/seed/event6/800/600',
    'https://picsum.photos/seed/event7/800/600',
    'https://picsum.photos/seed/event8/800/600',
    'https://picsum.photos/seed/event9/800/600',
    'https://picsum.photos/seed/event10/800/600'
  ];
  captions TEXT[] := ARRAY[
    'Team enjoying the event',
    'Group photo with colleagues',
    'Beautiful venue decoration',
    'Fun activities in full swing',
    'Delicious food served',
    'Team building exercise',
    'Candid moments captured',
    'Award ceremony highlights',
    'Outdoor adventure',
    'Celebration time'
  ];
  idx INT := 1;
  num_images INT;
BEGIN
  SELECT id INTO profile_id FROM public.profiles WHERE email = 'asif@adb.org' LIMIT 1;

  FOR event_rec IN SELECT id FROM public.events ORDER BY event_number LOOP
    IF event_rec.id = (SELECT id FROM public.events ORDER BY event_number LIMIT 1) THEN
      num_images := 4;
    ELSE
      num_images := 2;
    END IF;

    FOR j IN 1..num_images LOOP
      INSERT INTO public.event_media (event_id, uploader_id, media_url, media_type, caption)
      VALUES (
        event_rec.id,
        profile_id,
        pexels_urls[1 + ((idx - 1) % array_length(pexels_urls, 1))],
        'image',
        captions[1 + ((idx - 1) % array_length(captions, 1))]
      );
      idx := idx + 1;
    END LOOP;
  END LOOP;
END $$;
