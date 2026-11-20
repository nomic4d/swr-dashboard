-- Reset seeded raised totals and let managers/admins edit campaign amounts.
UPDATE public.campaigns SET raised_amount = 0, updated_at = now();

DROP POLICY IF EXISTS "Owners update own campaigns" ON public.campaigns;
CREATE POLICY "Owners update own campaigns" ON public.campaigns FOR UPDATE
  USING (
    auth.uid() = creator_id
    OR public.has_role(auth.uid(), 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('nom.studios@gmail.com', 'manager@organization.org', 'asif@adb.org')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND p.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    auth.uid() = creator_id
    OR public.has_role(auth.uid(), 'admin')
    OR lower(coalesce(auth.jwt() ->> 'email', '')) IN ('nom.studios@gmail.com', 'manager@organization.org', 'asif@adb.org')
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE lower(p.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        AND p.role IN ('admin', 'manager')
    )
  );
