-- The backend uses the service_role JWT for vetted server-side operations.
-- Fresh projects that ran the baseline migrations may lack these table grants.
-- Do not grant these privileges to anon or authenticated.

grant select, delete on table public.pets to service_role;
grant select on table public.household_members to service_role;
grant select, insert, update, delete on table public.documents to service_role;
grant select on table public.emergency_share_links to service_role;
