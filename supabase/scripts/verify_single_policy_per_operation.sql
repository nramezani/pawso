-- Run this in the Supabase SQL Editor (or `supabase db psql`) after applying
-- migrations, against any project, to confirm the household-role RLS fix
-- actually converged: exactly one permissive policy per (table, command).
--
-- Postgres OR's multiple permissive policies together, so if this query
-- returns any rows, the broader policy silently wins over the intended
-- restrictive one -- which was exactly the bug this migration fixes
-- (see 20260912_household_shared_care.sql for the full history).
--
-- Expected result: 0 rows.

select
  schemaname,
  tablename,
  cmd,
  count(*) as policy_count,
  array_agg(policyname order by policyname) as policy_names
from pg_policies
where schemaname in ('public', 'storage')
  and permissive = 'PERMISSIVE'
group by schemaname, tablename, cmd
having count(*) > 1
order by schemaname, tablename, cmd;
