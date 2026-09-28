-- Pawso pre-beta polish: richer profiles, granular reminders and shared-care ownership.

alter table public.pets
  add column if not exists preferred_weight_unit text not null default 'kg',
  add column if not exists adoption_date date,
  add column if not exists insurance_company text,
  add column if not exists insurance_policy_number text,
  add column if not exists insurance_deductible numeric(10, 2),
  add column if not exists insurance_coverage_percent numeric(5, 2),
  add column if not exists insurance_claims_contact text,
  add column if not exists insurance_renewal_date date;

alter table public.pets
  drop constraint if exists pets_preferred_weight_unit_check,
  add constraint pets_preferred_weight_unit_check
    check (preferred_weight_unit in ('kg', 'lb')),
  drop constraint if exists pets_insurance_coverage_percent_check,
  add constraint pets_insurance_coverage_percent_check
    check (insurance_coverage_percent is null or insurance_coverage_percent between 0 and 100),
  drop constraint if exists pets_insurance_deductible_check,
  add constraint pets_insurance_deductible_check
    check (insurance_deductible is null or insurance_deductible >= 0);

alter table public.care_tasks
  add column if not exists assigned_member_id uuid references public.household_members(id) on delete set null;

alter table public.medication_schedules
  add column if not exists assigned_member_id uuid references public.household_members(id) on delete set null;

create index if not exists care_tasks_assigned_member_id_idx
  on public.care_tasks(assigned_member_id);
create index if not exists medication_schedules_assigned_member_id_idx
  on public.medication_schedules(assigned_member_id);

create table if not exists public.pet_notification_preferences (
  pet_id uuid primary key references public.pets(id) on delete cascade,
  birthday_enabled boolean not null default true,
  adoption_day_enabled boolean not null default true,
  medication_enabled boolean not null default true,
  care_enabled boolean not null default true,
  vaccine_enabled boolean not null default true,
  lead_days integer[] not null default array[0],
  updated_at timestamptz not null default now(),
  constraint pet_notification_preferences_lead_days_check
    check (lead_days <@ array[0, 1, 7] and cardinality(lead_days) > 0)
);

grant select, insert, update, delete on public.pet_notification_preferences to authenticated;
alter table public.pet_notification_preferences enable row level security;

drop policy if exists "household members can view pet reminder preferences" on public.pet_notification_preferences;
create policy "household members can view pet reminder preferences"
on public.pet_notification_preferences for select
using (public.is_household_member(public.pet_household(pet_id)));

drop policy if exists "household owners can add pet reminder preferences" on public.pet_notification_preferences;
create policy "household owners can add pet reminder preferences"
on public.pet_notification_preferences for insert
with check (public.can_manage_household_medical(public.pet_household(pet_id)));

drop policy if exists "household owners can update pet reminder preferences" on public.pet_notification_preferences;
create policy "household owners can update pet reminder preferences"
on public.pet_notification_preferences for update
using (public.can_manage_household_medical(public.pet_household(pet_id)))
with check (public.can_manage_household_medical(public.pet_household(pet_id)));

drop policy if exists "household owners can delete pet reminder preferences" on public.pet_notification_preferences;
create policy "household owners can delete pet reminder preferences"
on public.pet_notification_preferences for delete
using (public.can_manage_household_medical(public.pet_household(pet_id)));

create table if not exists public.emergency_share_links (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists emergency_share_links_pet_id_idx
  on public.emergency_share_links(pet_id);
grant select, insert, update, delete on public.emergency_share_links to authenticated;
alter table public.emergency_share_links enable row level security;

drop policy if exists "household owners manage emergency links" on public.emergency_share_links;
create policy "household owners manage emergency links"
on public.emergency_share_links for all
using (public.can_manage_household_medical(public.pet_household(pet_id)))
with check (public.can_manage_household_medical(public.pet_household(pet_id)) and created_by = auth.uid());

create or replace function public.create_care_task_with_recurrence_v2(
  target_pet uuid,
  target_title text,
  target_notes text,
  target_due_at timestamptz,
  target_frequency text default 'none',
  target_interval integer default 1,
  target_ends_on date default null,
  target_task_type text default 'general',
  target_assigned_member uuid default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  created_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.can_manage_household_care(public.pet_household(target_pet)) then
    raise exception 'You do not have permission to manage care for this pet.';
  end if;
  if nullif(trim(target_title), '') is null or target_due_at is null then
    raise exception 'Task title and due time are required';
  end if;
  if target_frequency not in ('none', 'daily', 'weekly', 'monthly') or target_interval < 1 or target_interval > 52 then
    raise exception 'Invalid recurrence settings';
  end if;
  if target_assigned_member is not null and not exists (
    select 1
    from public.household_members hm
    join public.pets p on p.household_id = hm.household_id
    where p.id = target_pet and hm.id = target_assigned_member
  ) then
    raise exception 'Assigned caregiver must belong to this household.';
  end if;

  insert into public.care_tasks(
    pet_id, user_id, title, notes, due_at, task_type, is_active,
    scheduled_due_at, recurrence_frequency, recurrence_interval, recurrence_ends_on,
    assigned_member_id
  ) values (
    target_pet, auth.uid(), trim(target_title), nullif(trim(target_notes), ''),
    target_due_at, target_task_type, true, target_due_at, target_frequency, target_interval,
    target_ends_on, target_assigned_member
  ) returning id into created_id;
  return created_id;
end;
$$;

revoke all on function public.create_care_task_with_recurrence_v2(uuid, text, text, timestamptz, text, integer, date, text, uuid) from public;
grant execute on function public.create_care_task_with_recurrence_v2(uuid, text, text, timestamptz, text, integer, date, text, uuid) to authenticated;

create or replace function public.inherit_care_assignment()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.assigned_member_id is null and new.series_id is not null then
    select assigned_member_id into new.assigned_member_id
    from public.care_tasks
    where series_id = new.series_id and assigned_member_id is not null
    order by occurrence_number desc
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists care_tasks_inherit_assignment on public.care_tasks;
create trigger care_tasks_inherit_assignment
before insert on public.care_tasks
for each row execute function public.inherit_care_assignment();
