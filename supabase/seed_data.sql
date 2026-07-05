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
  ('Fun Fiesta Office Games Day', 'Office games and fun activities', '2026-04-28', 'April', 3, 'Islamabad'),
  ('Day Trip to Tarbela Lake', 'Day trip to Tarbela Lake', '2026-05-28', 'May', 4, 'Tarbela'),
  ('One Night Retreat at Hill Station & Dinner', 'Overnight retreat at hill station', '2026-06-15', 'June', 5, 'Hill Station'),
  ('Mango Fest', 'Mango festival celebration', '2026-07-15', 'July-August', 6, 'Islamabad'),
  ('Sports Week', 'Annual sports week', '2026-09-12', 'September', 7, 'Islamabad'),
  ('Music Night', 'Music night performance', '2026-10-17', 'October', 8, 'Islamabad'),
  ('Hike and Drink', 'Hiking trip to Margalla Hills', '2026-11-14', 'November', 9, 'Margalla Hills'),
  ('Soup Day / Movie Night', 'Soup day and movie night', '2026-12-12', 'December', 10, 'Islamabad')
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
  ('Flood Relief Campaign', 'Support for flood-affected families', 'Emergency Response', 500000, 150000, 'active'),
  ('Food Distribution Drive', 'Distributing food packages to communities in need', 'Community Service', 200000, 80000, 'active'),
  ('Medical Camp', 'Free medical checkup camp for underprivileged', 'Healthcare', 300000, 120000, 'active'),
  ('Tree Plantation Drive', 'Planting trees for a greener environment', 'Environment', 100000, 45000, 'active')
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
    'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg',
    'https://images.pexels.com/photos/1486975/pexels-photo-1486975.jpeg',
    'https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg',
    'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
    'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg',
    'https://images.pexels.com/photos/1110891/pexels-photo-1110891.jpeg',
    'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg',
    'https://images.pexels.com/photos/429121/pexels-photo-429121.jpeg',
    'https://images.pexels.com/photos/1366916/pexels-photo-1366916.jpeg',
    'https://images.pexels.com/photos/2726370/pexels-photo-2726370.jpeg'
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
