
-- Create events table
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
CREATE POLICY "Events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Events can be created by anyone" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Events can be updated by anyone" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Events can be deleted by anyone" ON public.events FOR DELETE USING (true);

-- Create staff table
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff viewable by everyone" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Staff can be created by anyone" ON public.staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can be updated by anyone" ON public.staff FOR UPDATE USING (true);
CREATE POLICY "Staff can be deleted by anyone" ON public.staff FOR DELETE USING (true);

-- Create reminders table
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
CREATE POLICY "Reminders can be created by anyone" ON public.reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Reminders can be updated by anyone" ON public.reminders FOR UPDATE USING (true);
CREATE POLICY "Reminders can be deleted by anyone" ON public.reminders FOR DELETE USING (true);

-- Create staff_event_attendance table
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
CREATE POLICY "Attendance can be created by anyone" ON public.staff_event_attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Attendance can be updated by anyone" ON public.staff_event_attendance FOR UPDATE USING (true);
CREATE POLICY "Attendance can be deleted by anyone" ON public.staff_event_attendance FOR DELETE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
