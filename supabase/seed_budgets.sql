-- Seed budget data matching the 10 events and 14 categories

-- Get event IDs
WITH event_ids AS (
  SELECT id, event_number, title FROM public.events ORDER BY event_number
),
-- Map categories by name
cat_ids AS (
  SELECT id, name FROM public.budget_categories
)
INSERT INTO public.budgets (title, category_id, event_id, allocated_amount, spent_amount, status, priority, approval_required, description)
SELECT
  v.title,
  c.id AS category_id,
  e.id AS event_id,
  v.allocated_amount,
  v.spent_amount,
  'approved',
  v.priority,
  false,
  v.description
FROM (VALUES
  ('Orange Fest',              'Events',      1,  80000,   76500,  'high',   'Annual Orange Fest celebration'),
  ('Eid Milan Party (High Tea)', 'Events',    2, 120000,  118000,  'high',   'Eid Milan high tea event'),
  ('Fun Fiesta Office Games Day', 'Sports Week', 3, 60000, 45000, 'medium', 'Office games and fun activities'),
  ('Day Trip to Tarbela Lake', 'Trips',       4, 250000,  130500,  'high',   'Day trip to Tarbela Lake'),
  ('One Night Retreat at Hill Station', 'Trips', 5, 1387200, 0, 'high',   'Overnight retreat at hill station'),
  ('Mango Fest',               'Events',      6,  90000,       0,  'medium', 'Mango festival celebration'),
  ('Sports Week',              'Sports Week', 7, 150000,       0,  'high',   'Annual sports week'),
  ('Music Night',              'Events',      8, 180000,       0,  'medium', 'Music night performance'),
  ('Hike and Drink',           'Trips',       9, 200000,       0,  'medium', 'Hiking trip to Margalla Hills'),
  ('Soup Day / Movie Night',   'Events',     10,  70000,       0,  'low',    'Soup day and movie night')
) AS v(title, cat_name, event_num, allocated_amount, spent_amount, priority, description)
LEFT JOIN event_ids e ON e.event_number = v.event_num
LEFT JOIN cat_ids c ON c.name = v.cat_name;

-- Auto-approve all pending budgets (safety net)
UPDATE public.budgets SET status = 'approved', approval_required = false WHERE status = 'pending' OR status = 'draft';
