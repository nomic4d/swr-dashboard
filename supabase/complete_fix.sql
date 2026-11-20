-- ============================================================
-- COMPLETE FIX SCRIPT - Run this in Supabase SQL Editor
-- Fixes: profiles schema, auto-approve, budget tables, seed data
-- ============================================================

-- 1. DROP budget tables if they exist (from budget_schema.sql)
DROP TABLE IF EXISTS public.budget_audit_logs CASCADE;
DROP TABLE IF EXISTS public.budget_notifications CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.budget_allocations CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.budget_categories CASCADE;

-- 2. FIX PROFILES TABLE
-- Drop existing profiles to recreate with correct schema
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  department TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  is_approved BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles insertable by anyone" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles updatable by anyone" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Profiles deletable by anyone" ON public.profiles FOR DELETE USING (true);

-- 3. AUTO-APPROVE TRIGGER - handles new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_approved)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'staff', true);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. BUDGET CATEGORIES
CREATE TABLE public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev budget_categories all" ON public.budget_categories FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.budget_categories (name, description) VALUES
  ('Trips', 'Travel and trip expenses'),
  ('Events', 'Event-related budgets'),
  ('Campaigns', 'Campaign budgets'),
  ('CSR Activities', 'CSR activity budgets'),
  ('Staff Welfare', 'Staff welfare expenses'),
  ('Office Events', 'Office event budgets'),
  ('Sports Week', 'Sports week budgets'),
  ('Training', 'Training budgets'),
  ('Workshops', 'Workshop budgets'),
  ('Conferences', 'Conference budgets'),
  ('Emergency Activities', 'Emergency activity funds'),
  ('Community Programs', 'Community program budgets'),
  ('Donations', 'Donation budgets'),
  ('Volunteer Activities', 'Volunteer activity budgets');

-- 5. BUDGETS
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.budget_categories(id),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  department TEXT,
  budget_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  allocated_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_cost NUMERIC(12,2) DEFAULT 0,
  spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'PKR',
  funding_source TEXT,
  budget_owner TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','frozen','closed','archived')),
  approval_required BOOLEAN DEFAULT true,
  description TEXT,
  remarks TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev budgets all" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

-- 6. BUDGET ALLOCATIONS
CREATE TABLE public.budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  allocated_by TEXT,
  allocated_date TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev allocations all" ON public.budget_allocations FOR ALL USING (true) WITH CHECK (true);

-- 7. VENDORS
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_number TEXT,
  bank_details TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev vendors all" ON public.vendors FOR ALL USING (true) WITH CHECK (true);

-- 8. EXPENSES
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  expense_date DATE DEFAULT now(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT,
  invoice_number TEXT,
  receipt_url TEXT,
  attachment_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','refunded','overdue')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev expenses all" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- 9. INVOICES
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  invoice_number TEXT,
  amount NUMERIC(12,2) NOT NULL,
  file_url TEXT,
  file_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','cancelled','overdue','refunded')),
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev invoices all" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

-- 10. BUDGET AUDIT LOGS
CREATE TABLE public.budget_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by TEXT,
  ip_address TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.budget_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev audit all" ON public.budget_audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 11. BUDGET NOTIFICATIONS
CREATE TABLE public.budget_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warning','info','success','error')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.budget_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev notifications all" ON public.budget_notifications FOR ALL USING (true) WITH CHECK (true);

-- 12. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 13. SEED EVENTS (if not exist)
INSERT INTO public.events (title, event_date, month, event_number, location, description)
SELECT * FROM (VALUES
  ('Orange Fest', '2026-02-02'::date, 'February', 1, 'Islamabad', 'Annual Orange Fest celebration'),
  ('Eid Milan Party (High Tea)', '2026-03-15'::date, 'March', 2, 'Islamabad', 'Eid Milan high tea event'),
  ('Mango Fest', '2026-06-05'::date, 'June-July', 3, 'Islamabad', 'Mango festival celebration'),
  ('One Night Retreat at Hill', '2026-06-15'::date, 'June', 4, 'Hill Station', 'Overnight retreat at hill station'),
  ('One Night Retreat at Hill', '2026-07-18'::date, 'July', 5, 'Hill Station', 'Overnight retreat at hill station'),
  ('Fun Fiesta Office Games Day', '2026-11-08'::date, 'November', 6, 'Islamabad', 'Office games and fun activities'),
  ('Music Night', '2026-11-22'::date, 'November', 7, 'Islamabad', 'Music night performance'),
  ('Sports Day', '2026-12-12'::date, 'December', 8, 'Islamabad', 'Sports day'),
  ('Gift Vouchers for Staff', '2026-12-20'::date, 'December', 9, 'Islamabad', 'Gift vouchers for staff')
) AS v(title, event_date, month, event_number, location, description)
WHERE NOT EXISTS (SELECT 1 FROM public.events LIMIT 1);

-- 14. SEED STAFF (if not exist)
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
WHERE NOT EXISTS (SELECT 1 FROM public.staff LIMIT 1);

-- 15. AUTO-APPROVE ALL EXISTING PROFILES
UPDATE public.profiles SET is_approved = true WHERE is_approved = false OR is_approved IS NULL;

-- 16. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('event-media', 'event-media', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('campaign-images', 'campaign-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('staff-avatars', 'staff-avatars', true) ON CONFLICT (id) DO NOTHING;
