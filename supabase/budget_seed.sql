-- ============================================================
-- Budget Seed Data for SWR PRM 2026
-- Run after budget_schema.sql in Supabase SQL Editor
-- ============================================================

-- Insert budgets referencing existing events and budget_categories
WITH cat AS (SELECT id, name FROM public.budget_categories),
     evt AS (SELECT id, title, event_number FROM public.events)
INSERT INTO public.budgets (title, category_id, event_id, department, budget_year, allocated_amount, expected_cost, spent_amount, currency, funding_source, budget_owner, priority, status, approval_required, description, remarks)
SELECT * FROM (VALUES
  ('Orange Fest',
    (SELECT id FROM cat WHERE name = 'Events'),
    (SELECT id FROM evt WHERE event_number = 1),
    'Events', 2026, 80000, 80000, 76500, 'PKR', 'Internal', 'Asif Khan', 'high', 'approved', true,
    'Annual orange festival celebration', 'Approved'),
  ('Eid Milan Party (High Tea)',
    (SELECT id FROM cat WHERE name = 'Events'),
    (SELECT id FROM evt WHERE event_number = 2),
    'Events', 2026, 120000, 120000, 118000, 'PKR', 'Internal', 'Sana Malik', 'high', 'approved', true,
    'Eid celebration with high tea', ''),
  ('Fun Fiesta Office Games Day',
    (SELECT id FROM cat WHERE name = 'Office Events'),
    (SELECT id FROM evt WHERE event_number = 3),
    'HR', 2026, 60000, 60000, 45000, 'PKR', 'Internal', 'Usman Ahmed', 'medium', 'approved', false,
    'Office games and team building', ''),
  ('Day Trip to Tarbela Lake',
    (SELECT id FROM cat WHERE name = 'Trips'),
    (SELECT id FROM evt WHERE event_number = 4),
    'Events', 2026, 250000, 250000, 130500, 'PKR', 'Sponsorship', 'Ali Raza', 'high', 'approved', true,
    'Day trip to Tarbela Lake', 'Partly sponsored'),
  ('One Night Retreat at Hill Station',
    (SELECT id FROM cat WHERE name = 'Trips'),
    (SELECT id FROM evt WHERE event_number = 5),
    'Events', 2026, 1387200, 1387200, 0, 'PKR', 'Internal', 'Asif Khan', 'critical', 'approved', true,
    'One night retreat at hill station for team', 'Awaiting approval'),
  ('Mango Fest',
    (SELECT id FROM cat WHERE name = 'Events'),
    (SELECT id FROM evt WHERE event_number = 6),
    'Events', 2026, 90000, 90000, 0, 'PKR', 'Donation', 'Sana Malik', 'medium', 'approved', false,
    'Annual mango festival', ''),
  ('Sports Week',
    (SELECT id FROM cat WHERE name = 'Sports Week'),
    (SELECT id FROM evt WHERE event_number = 7),
    'Sports', 2026, 150000, 150000, 0, 'PKR', 'Internal', 'Usman Ahmed', 'high', 'approved', true,
    'Annual sports week activities', ''),
  ('Music Night',
    (SELECT id FROM cat WHERE name = 'Events'),
    (SELECT id FROM evt WHERE event_number = 8),
    'Events', 2026, 180000, 180000, 0, 'PKR', 'Sponsorship', 'Ali Raza', 'medium', 'approved', true,
    'Evening music event', 'Sponsor pending'),
  ('Hike and Drink',
    (SELECT id FROM cat WHERE name = 'Trips'),
    (SELECT id FROM evt WHERE event_number = 9),
    'Events', 2026, 200000, 200000, 0, 'PKR', 'Internal', 'Asif Khan', 'medium', 'approved', false,
    'Hiking trip with refreshments', ''),
  ('Soup Day / Movie Night',
    (SELECT id FROM cat WHERE name = 'Events'),
    (SELECT id FROM evt WHERE event_number = 10),
    'Events', 2026, 70000, 70000, 0, 'PKR', 'Internal', 'Sana Malik', 'low', 'frozen', false,
    'Casual soup and movie evening', '')
) AS v(title, category_id, event_id, department, budget_year, allocated_amount, expected_cost, spent_amount, currency, funding_source, budget_owner, priority, status, approval_required, description, remarks)
WHERE NOT EXISTS (SELECT 1 FROM public.budgets WHERE title = v.title);

-- Insert expenses for budgets that have spent > 0
WITH b AS (SELECT id, title FROM public.budgets),
     v AS (SELECT id, company_name FROM public.vendors)
INSERT INTO public.expenses (budget_id, title, category, expense_date, vendor_id, amount, payment_method, invoice_number, notes, status, created_by)
SELECT * FROM (VALUES
  -- Orange Fest expenses (76,500 total)
  ((SELECT id FROM b WHERE title = 'Orange Fest'), 'Venue Decoration', 'Decoration', '2026-01-15', (SELECT id FROM v WHERE company_name = 'Grand Marquee Events'), 25000, 'Bank Transfer', 'INV-001', 'Orange themed decoration', 'paid', 'Asif Khan'),
  ((SELECT id FROM b WHERE title = 'Orange Fest'), 'Food & Refreshments', 'Food', '2026-01-20', (SELECT id FROM v WHERE company_name = 'Islamabad Caterers'), 35000, 'Cash', 'INV-002', 'Refreshments for 100 people', 'paid', 'Asif Khan'),
  ((SELECT id FROM b WHERE title = 'Orange Fest'), 'Photography Coverage', 'Photography', '2026-01-22', (SELECT id FROM v WHERE company_name = 'Capture Moments Photography'), 8500, 'Bank Transfer', 'INV-003', 'Event photography', 'paid', 'Asif Khan'),
  ((SELECT id FROM b WHERE title = 'Orange Fest'), 'Printing Materials', 'Printing', '2026-01-10', (SELECT id FROM v WHERE company_name = 'PrintMaster Solutions'), 8000, 'Cheque', 'INV-004', 'Banners and flyers', 'paid', 'Asif Khan'),
  -- Eid Milan Party expenses (118,000 total)
  ((SELECT id FROM b WHERE title = 'Eid Milan Party (High Tea)'), 'High Tea Catering', 'Food', '2026-03-10', (SELECT id FROM v WHERE company_name = 'Islamabad Caterers'), 65000, 'Bank Transfer', 'INV-005', 'High tea setup', 'paid', 'Sana Malik'),
  ((SELECT id FROM b WHERE title = 'Eid Milan Party (High Tea)'), 'Venue Decoration', 'Decoration', '2026-03-12', (SELECT id FROM v WHERE company_name = 'Grand Marquee Events'), 35000, 'Bank Transfer', 'INV-006', 'Eid themed decoration', 'paid', 'Sana Malik'),
  ((SELECT id FROM b WHERE title = 'Eid Milan Party (High Tea)'), 'Entertainment Setup', 'Entertainment', '2026-03-13', (SELECT id FROM v WHERE company_name = 'Grand Marquee Events'), 18000, 'Cash', 'INV-007', 'Sound system', 'pending', 'Sana Malik'),
  -- Fun Fiesta expenses (45,000 total)
  ((SELECT id FROM b WHERE title = 'Fun Fiesta Office Games Day'), 'Office Games Equipment', 'Equipment', '2026-04-20', NULL, 25000, 'Bank Transfer', 'INV-008', 'Board games and sports equipment', 'paid', 'Usman Ahmed'),
  ((SELECT id FROM b WHERE title = 'Fun Fiesta Office Games Day'), 'Refreshments', 'Refreshments', '2026-04-22', (SELECT id FROM v WHERE company_name = 'Islamabad Caterers'), 15000, 'Cash', 'INV-009', 'Snacks and drinks', 'paid', 'Usman Ahmed'),
  ((SELECT id FROM b WHERE title = 'Fun Fiesta Office Games Day'), 'Prizes for Winners', 'Miscellaneous', '2026-04-18', NULL, 5000, 'Cash', 'INV-010', 'Gift certificates for game winners', 'paid', 'Usman Ahmed'),
  -- Tarbela Lake Trip expenses (130,500 total)
  ((SELECT id FROM b WHERE title = 'Day Trip to Tarbela Lake'), 'Bus Rental', 'Transportation', '2026-05-20', (SELECT id FROM v WHERE company_name = 'Rawalpindi Transport'), 55000, 'Bank Transfer', 'INV-011', 'Bus for 50 people', 'paid', 'Ali Raza'),
  ((SELECT id FROM b WHERE title = 'Day Trip to Tarbela Lake'), 'Food Supplies', 'Food', '2026-05-22', (SELECT id FROM v WHERE company_name = 'Islamabad Caterers'), 45000, 'Cash', 'INV-012', 'Packed lunch for trip', 'paid', 'Ali Raza'),
  ((SELECT id FROM b WHERE title = 'Day Trip to Tarbela Lake'), 'Fuel', 'Fuel', '2026-05-22', NULL, 15000, 'Cash', 'INV-013', 'Bus fuel', 'pending', 'Ali Raza'),
  ((SELECT id FROM b WHERE title = 'Day Trip to Tarbela Lake'), 'First Aid Kit', 'Medical', '2026-05-18', NULL, 5000, 'Cash', 'INV-014', 'Emergency medical supplies', 'paid', 'Ali Raza'),
  ((SELECT id FROM b WHERE title = 'Day Trip to Tarbela Lake'), 'Entry Tickets', 'Miscellaneous', '2026-05-22', NULL, 10500, 'Cash', 'INV-015', 'Lake entry fees', 'paid', 'Ali Raza')
) AS v(budget_id, title, category, expense_date, vendor_id, amount, payment_method, invoice_number, notes, status, created_by);
