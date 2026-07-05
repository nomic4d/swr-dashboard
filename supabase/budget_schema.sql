-- ============================================================
-- Budget Management Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop existing
DROP TABLE IF EXISTS public.budget_audit_logs CASCADE;
DROP TABLE IF EXISTS public.budget_notifications CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.budget_allocations CASCADE;
DROP TABLE IF EXISTS public.budgets CASCADE;
DROP TABLE IF EXISTS public.budget_categories CASCADE;

-- ========== Budget Categories ==========
CREATE TABLE public.budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

-- ========== Budgets ==========
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

-- ========== Budget Allocations ==========
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

-- ========== Vendors ==========
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

-- ========== Expenses ==========
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

-- ========== Invoices ==========
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

-- ========== Budget Audit Logs ==========
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

-- ========== Budget Notifications ==========
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

-- ========== Updated At Trigger ==========
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
