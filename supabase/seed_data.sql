-- ============================================================
-- Seed Data for SWR PRM Portal
-- Run this in Supabase SQL Editor after schema.sql
-- ============================================================

-- Temporarily allow anon inserts for media seeding
-- (safe for dev; revert or tighten later)
CREATE POLICY "Allow anon media insert for seed" ON public.event_media FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon media select" ON public.event_media FOR SELECT USING (true);

-- Insert events (handled by seed.mjs but idempotent)
INSERT INTO public.events (title, description, event_date, month, event_number, location)
SELECT * FROM (VALUES
  ('Orange Fest', 'Annual Orange Fest celebration', '2026-02-02', 'February', 1, 'Islamabad'),
  ('Eid Milan Party (High Tea)', 'Eid Milan high tea event', '2026-03-15', 'March', 2, 'Islamabad'),
  ('Mango Fest', 'Mango festival celebration', '2026-06-05', 'June-July', 3, 'Islamabad'),
  ('One Night Retreat at Hill', 'Overnight retreat at hill station', '2026-06-15', 'June', 4, 'Hill Station'),
  ('One Night Retreat at Hill', 'Overnight retreat at hill station', '2026-07-18', 'July', 5, 'Hill Station'),
  ('Fun Fiesta Office Games Day', 'Office games and fun activities', '2026-11-08', 'November', 6, 'Islamabad'),
  ('Music Night', 'Music night performance', '2026-11-22', 'November', 7, 'Islamabad'),
  ('Supports Day', 'Supports day', '2026-12-12', 'December', 8, 'Islamabad'),
  ('Gift Vouchers for Staff', 'Gift vouchers for staff', '2026-12-20', 'December', 9, 'Islamabad')
) AS v(title, description, event_date, month, event_number, location)
WHERE NOT EXISTS (SELECT 1 FROM public.events WHERE event_number = v.event_number);

-- Insert staff
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

-- Insert campaigns (using a placeholder creator_id for dev)
INSERT INTO public.campaigns (title, description, category, goal_amount, raised_amount, status)
SELECT * FROM (VALUES
  ('Flood Relief Campaign', 'Support for flood-affected families', 'Emergency Response', 500000, 0, 'active'),
  ('Food Distribution Drive', 'Distributing food packages to communities in need', 'Community Service', 200000, 0, 'active'),
  ('Medical Camp', 'Free medical checkup camp for underprivileged', 'Healthcare', 300000, 0, 'active'),
  ('Tree Plantation Drive', 'Planting trees for a greener environment', 'Environment', 100000, 0, 'active')
) AS v(title, description, category, goal_amount, raised_amount, status)
WHERE NOT EXISTS (SELECT 1 FROM public.campaigns WHERE title = v.title);

-- Ensure asif@adb.org profile exists and is approved
INSERT INTO public.profiles (email, full_name, role, is_approved)
VALUES ('asif@adb.org', 'Asif', 'manager', true)
ON CONFLICT DO NOTHING;

-- Sample gallery media using placeholder Pexels images
-- (uses a known profile id; adjust if profile id differs)
DO $$
DECLARE
  profile_id UUID;
  event_rec RECORD;
  pexels_images TEXT[] := ARRAY[
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
  i INT := 1;
BEGIN
  SELECT id INTO profile_id FROM public.profiles WHERE email = 'asif@adb.org' LIMIT 1;

  FOR event_rec IN SELECT id FROM public.events ORDER BY event_number LOOP
    -- Insert 2-3 images per event
    FOR j IN 1..3 LOOP
      INSERT INTO public.event_media (event_id, uploader_id, media_url, media_type, caption)
      VALUES (
        event_rec.id,
        profile_id,
        pexels_images[((i - 1) % array_length(pexels_images, 1)) + 1],
        'image',
        captions[((i - 1) % array_length(captions, 1)) + 1]
      );
      i := i + 1;
    END LOOP;
  END LOOP;
END $$;
