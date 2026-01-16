-- Fix security issues

-- 1. Replace the security definer view with a regular view
DROP VIEW IF EXISTS public.platform_stats;

-- Recreate as regular view (without security definer)
CREATE VIEW public.platform_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.teams) as total_teams,
  (SELECT COUNT(*) FROM public.tournaments) as total_tournaments,
  (SELECT COUNT(*) FROM public.matches) as total_matches,
  (SELECT COUNT(*) FROM public.organizations) as total_organizations,
  (SELECT COUNT(DISTINCT code) FROM public.countries WHERE is_active = true) as active_countries,
  (SELECT COALESCE(SUM(balance), 0) FROM public.wallets) as total_efa_coins,
  (SELECT COUNT(*) FROM public.transactions) as total_transactions;

-- 2. Fix the permissive RLS policy on audit_logs
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Create a more restrictive insert policy for audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);