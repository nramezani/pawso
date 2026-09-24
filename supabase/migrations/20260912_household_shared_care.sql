-- Pawso household/shared-care foundation, with role-tiered permissions.
--
-- This file used to be split into two same-day migrations
-- (20260912_household_shared_care.sql + 20260912_household_role_permissions.sql).
-- Filename lexicographic ordering ("household_role_permissions" sorts before
-- "household_shared_care") meant the role-tightening migration ran BEFORE
-- the migration that creates the tables/functions it depends on, so on any
-- fresh/reproducible database it failed outright with
-- `relation "public.households" does not exist`. Where it *did* apply out
-- of order against an existing project, the two files created
-- differently-named permissive policies for the same table+operation
-- (Postgres OR's multiple permissive RLS policies together), silently
-- leaving the broader "any household member" policy active alongside the
-- intended "owner/caregiver only" one -- e.g. a `sitter` could insert/update
-- medications, medical events, and vet-record files even though the app UI
-- hides those actions for that role.
--
-- Merged into a single, correctly-ordered file so there is no possible
-- ordering ambiguity going forward, and so the final policy set per table
-- is defined exactly once. Every `drop policy if exists` below includes
-- every name either of the two original files could have created, so this
-- migration converges to the same correct end state whether it's applied
-- to a brand-new database or one that already ran the old files (in either
-- order).
--
-- Run once in Supabase SQL Editor, or via `supabase db push` /
-- `supabase migration up`.

create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Pawso Household',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Household member',
  role text not null default 'caregiver'
    check (role in ('owner','caregiver','sitter')),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  invited_email text,
  role text not null default 'caregiver'
    check (role in ('caregiver','sitter')),
  invite_code uuid not null default gen_random_uuid() unique,
  status text not null default 'pending'
    check (status in ('pending','accepted','revoked','expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.pets
  add column if not exists household_id uuid references public.households(id) on delete cascade;

alter table public.medication_logs
  add column if not exists actor_name text;

alter table public.task_completions
  add column if not exists actor_name text;

create index if not exists pets_household_id_idx on public.pets(household_id);
create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists household_members_household_id_idx on public.household_members(household_id);
create index if not exists household_invitations_code_idx on public.household_invitations(invite_code);

-- Helper functions used by RLS. Membership check plus a per-table-role
-- lookup used to gate write access below.
create or replace function public.is_household_member(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.is_household_owner(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  );
$$;

create or replace function public.pet_household(target_pet uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from public.pets where id = target_pet;
$$;

create or replace function public.household_role(target_household uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select hm.role
  from public.household_members hm
  where hm.household_id = target_household
    and hm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_view_household_medical(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.household_role(target_household) in ('owner','caregiver'), false);
$$;

create or replace function public.can_manage_household_medical(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.household_role(target_household) = 'owner', false);
$$;

create or replace function public.can_manage_household_care(target_household uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.household_role(target_household) in ('owner','caregiver'), false);
$$;

grant execute on function public.household_role(uuid) to authenticated;
grant execute on function public.can_view_household_medical(uuid) to authenticated;
grant execute on function public.can_manage_household_medical(uuid) to authenticated;
grant execute on function public.can_manage_household_care(uuid) to authenticated;

-- Ensure every current Pawso user has at least one household and migrate existing pets.
do $$
declare
  u record;
  h uuid;
begin
  for u in
    select distinct au.id, coalesce(au.email, '') as email
    from auth.users au
    where exists (select 1 from public.pets p where p.user_id = au.id)
       or exists (select 1 from public.household_members hm where hm.user_id = au.id)
  loop
    select hm.household_id into h
    from public.household_members hm
    where hm.user_id = u.id
    order by case when hm.role = 'owner' then 0 else 1 end, hm.created_at
    limit 1;

    if h is null then
      insert into public.households(name, created_by)
      values ('My Pawso Household', u.id)
      returning id into h;

      insert into public.household_members(household_id, user_id, display_name, role)
      values (
        h,
        u.id,
        case
          when u.email <> '' then split_part(u.email, '@', 1)
          else 'Owner'
        end,
        'owner'
      );
    end if;

    update public.pets
    set household_id = h
    where user_id = u.id
      and household_id is null;
  end loop;
end $$;

-- RPC: get or create the current user's household.
create or replace function public.ensure_household_for_current_user(
  preferred_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  h uuid;
  display_value text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select hm.household_id into h
  from public.household_members hm
  where hm.user_id = auth.uid()
  order by case when hm.role = 'owner' then 0 else 1 end, hm.created_at
  limit 1;

  if h is not null then
    return h;
  end if;

  display_value := coalesce(
    nullif(trim(preferred_display_name), ''),
    split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1),
    'Owner'
  );

  insert into public.households(name, created_by)
  values ('My Pawso Household', auth.uid())
  returning id into h;

  insert into public.household_members(household_id, user_id, display_name, role)
  values (h, auth.uid(), display_value, 'owner');

  return h;
end;
$$;

-- RPC: owner creates a shareable invitation code.
create or replace function public.create_household_invitation(
  target_household uuid,
  target_email text default null,
  target_role text default 'caregiver'
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code uuid;
begin
  if not public.is_household_owner(target_household) then
    raise exception 'Only a household owner can create invitations';
  end if;

  if target_role not in ('caregiver','sitter') then
    raise exception 'Invalid role';
  end if;

  insert into public.household_invitations(
    household_id, created_by, invited_email, role
  )
  values (
    target_household,
    auth.uid(),
    nullif(lower(trim(target_email)), ''),
    target_role
  )
  returning invite_code into code;

  return code::text;
end;
$$;

-- RPC: accept invitation code. Returns the joined household id.
create or replace function public.accept_household_invitation(
  code_text text,
  preferred_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.household_invitations%rowtype;
  display_value text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into invitation
  from public.household_invitations
  where invite_code = code_text::uuid
    and status = 'pending'
    and expires_at > now()
  for update;

  if invitation.id is null then
    raise exception 'Invitation is invalid, expired, or already used';
  end if;

  if invitation.invited_email is not null
    and lower(coalesce(auth.jwt() ->> 'email', '')) <> lower(invitation.invited_email)
  then
    raise exception 'Sign in with the email address that received this invitation';
  end if;

  display_value := coalesce(
    nullif(trim(preferred_display_name), ''),
    split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1),
    'Household member'
  );

  insert into public.household_members(
    household_id, user_id, display_name, role
  )
  values (
    invitation.household_id,
    auth.uid(),
    display_value,
    invitation.role
  )
  on conflict (household_id, user_id)
  do update set
    display_name = excluded.display_name,
    role = case
      when public.household_members.role = 'owner' then 'owner'
      else excluded.role
    end;

  update public.household_invitations
  set
    status = 'accepted',
    accepted_by = auth.uid(),
    accepted_at = now()
  where id = invitation.id;

  return invitation.household_id;
end;
$$;

grant execute on function public.ensure_household_for_current_user(text) to authenticated;
grant execute on function public.create_household_invitation(uuid,text,text) to authenticated;
grant execute on function public.accept_household_invitation(text,text) to authenticated;

grant select, update on table public.households to authenticated;
grant select, update, delete on table public.household_members to authenticated;
grant select on table public.household_invitations to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_invitations enable row level security;

drop policy if exists "household members can view household" on public.households;
create policy "household members can view household"
on public.households for select
to authenticated
using (public.is_household_member(id));

drop policy if exists "owners can update household" on public.households;
create policy "owners can update household"
on public.households for update
to authenticated
using (public.is_household_owner(id))
with check (public.is_household_owner(id));

drop policy if exists "members can view household members" on public.household_members;
create policy "members can view household members"
on public.household_members for select
to authenticated
using (public.is_household_member(household_id));

drop policy if exists "owners can update household members" on public.household_members;
create policy "owners can update household members"
on public.household_members for update
to authenticated
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

drop policy if exists "owners can remove household members" on public.household_members;
create policy "owners can remove household members"
on public.household_members for delete
to authenticated
using (public.is_household_owner(household_id) and user_id <> auth.uid());

drop policy if exists "owners can view household invitations" on public.household_invitations;
create policy "owners can view household invitations"
on public.household_invitations for select
to authenticated
using (public.is_household_owner(household_id));

-- ============================================================================
-- Final, role-tiered policies for pet-linked tables.
--
-- Each block drops every policy name either original migration could have
-- created for that table+operation (so this converges correctly regardless
-- of migration history), then creates exactly one final policy per
-- operation. Role tiers used below:
--   - is_household_member        -> any role (owner, caregiver, sitter)
--   - can_view_household_medical -> owner or caregiver (not sitter)
--   - can_manage_household_medical -> owner only
--   - can_manage_household_care    -> owner or caregiver (not sitter)
-- ============================================================================

-- pets
drop policy if exists "household members can view pets" on public.pets;
drop policy if exists "household members can add pets" on public.pets;
drop policy if exists "household members can update pets" on public.pets;
drop policy if exists "household owners can add pets" on public.pets;
drop policy if exists "household owners can update pets" on public.pets;

create policy "household members can view pets"
on public.pets for select to authenticated
using (household_id is not null and public.is_household_member(household_id));

create policy "household owners can add pets"
on public.pets for insert to authenticated
with check (user_id = auth.uid() and public.household_role(household_id) = 'owner');

create policy "household owners can update pets"
on public.pets for update to authenticated
using (public.household_role(household_id) = 'owner')
with check (public.household_role(household_id) = 'owner');

-- documents
drop policy if exists "household members can view documents" on public.documents;
drop policy if exists "household members can add documents" on public.documents;
drop policy if exists "household members can update documents" on public.documents;
drop policy if exists "household medical members can view documents" on public.documents;
drop policy if exists "household owners can add documents" on public.documents;
drop policy if exists "household owners can update documents" on public.documents;

create policy "household medical members can view documents"
on public.documents for select to authenticated
using (public.can_view_household_medical(public.pet_household(pet_id)));

create policy "household owners can add documents"
on public.documents for insert to authenticated
with check (
  user_id = auth.uid()
  and public.can_manage_household_medical(public.pet_household(pet_id))
);

create policy "household owners can update documents"
on public.documents for update to authenticated
using (public.can_manage_household_medical(public.pet_household(pet_id)))
with check (public.can_manage_household_medical(public.pet_household(pet_id)));

-- medical_events
drop policy if exists "household members can view medical events" on public.medical_events;
drop policy if exists "household members can add medical events" on public.medical_events;
drop policy if exists "household owners can update medical events" on public.medical_events;
drop policy if exists "household medical members can view medical events" on public.medical_events;
drop policy if exists "household owners can add medical events" on public.medical_events;

create policy "household medical members can view medical events"
on public.medical_events for select to authenticated
using (public.can_view_household_medical(public.pet_household(pet_id)));

create policy "household owners can add medical events"
on public.medical_events for insert to authenticated
with check (
  user_id = auth.uid()
  and public.can_manage_household_medical(public.pet_household(pet_id))
);

create policy "household owners can update medical events"
on public.medical_events for update to authenticated
using (public.can_manage_household_medical(public.pet_household(pet_id)))
with check (public.can_manage_household_medical(public.pet_household(pet_id)));

-- medications
drop policy if exists "household members can view medications" on public.medications;
drop policy if exists "household members can add medications" on public.medications;
drop policy if exists "household members can update medications" on public.medications;
drop policy if exists "household owners can add medications" on public.medications;
drop policy if exists "household owners can update medications" on public.medications;

create policy "household members can view medications"
on public.medications for select to authenticated
using (public.is_household_member(public.pet_household(pet_id)));

create policy "household owners can add medications"
on public.medications for insert to authenticated
with check (
  user_id = auth.uid()
  and public.can_manage_household_medical(public.pet_household(pet_id))
);

create policy "household owners can update medications"
on public.medications for update to authenticated
using (public.can_manage_household_medical(public.pet_household(pet_id)))
with check (public.can_manage_household_medical(public.pet_household(pet_id)));

-- medication_schedules
drop policy if exists "household members can view medication schedules" on public.medication_schedules;
drop policy if exists "household members can add medication schedules" on public.medication_schedules;
drop policy if exists "household owners can update medication schedules" on public.medication_schedules;
drop policy if exists "household owners can add medication schedules" on public.medication_schedules;

create policy "household members can view medication schedules"
on public.medication_schedules for select to authenticated
using (public.is_household_member(public.pet_household(pet_id)));

create policy "household owners can add medication schedules"
on public.medication_schedules for insert to authenticated
with check (
  user_id = auth.uid()
  and public.can_manage_household_medical(public.pet_household(pet_id))
);

create policy "household owners can update medication schedules"
on public.medication_schedules for update to authenticated
using (public.can_manage_household_medical(public.pet_household(pet_id)))
with check (public.can_manage_household_medical(public.pet_household(pet_id)));

-- medication_logs (any member may log a dose given/skipped; only the
-- member who logged it -- not any household member -- may edit it)
drop policy if exists "household members can view medication logs" on public.medication_logs;
drop policy if exists "household members can add medication logs" on public.medication_logs;
drop policy if exists "household members can update medication logs" on public.medication_logs;
drop policy if exists "household members can update own medication logs" on public.medication_logs;

create policy "household members can view medication logs"
on public.medication_logs for select to authenticated
using (public.is_household_member(public.pet_household(pet_id)));

create policy "household members can add medication logs"
on public.medication_logs for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_household_member(public.pet_household(pet_id))
);

create policy "household members can update own medication logs"
on public.medication_logs for update to authenticated
using (
  user_id = auth.uid()
  and public.is_household_member(public.pet_household(pet_id))
)
with check (
  user_id = auth.uid()
  and public.is_household_member(public.pet_household(pet_id))
);

-- care_tasks (owner/caregiver may create and update; sitter may only view
-- and complete via task_completions below)
drop policy if exists "household members can view care tasks" on public.care_tasks;
drop policy if exists "household members can add care tasks" on public.care_tasks;
drop policy if exists "household members can update care tasks" on public.care_tasks;
drop policy if exists "household care managers can add care tasks" on public.care_tasks;
drop policy if exists "household care managers can update care tasks" on public.care_tasks;

create policy "household members can view care tasks"
on public.care_tasks for select to authenticated
using (public.is_household_member(public.pet_household(pet_id)));

create policy "household care managers can add care tasks"
on public.care_tasks for insert to authenticated
with check (
  user_id = auth.uid()
  and public.can_manage_household_care(public.pet_household(pet_id))
);

create policy "household care managers can update care tasks"
on public.care_tasks for update to authenticated
using (public.can_manage_household_care(public.pet_household(pet_id)))
with check (public.can_manage_household_care(public.pet_household(pet_id)));

-- task_completions (any member may mark a task complete)
drop policy if exists "household members can view task completions" on public.task_completions;
drop policy if exists "household members can add task completions" on public.task_completions;

create policy "household members can view task completions"
on public.task_completions for select to authenticated
using (public.is_household_member(public.pet_household(pet_id)));

create policy "household members can add task completions"
on public.task_completions for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_household_member(public.pet_household(pet_id))
);

-- ai_extractions (inherits access through the linked document)
drop policy if exists "household members can view ai extractions" on public.ai_extractions;
drop policy if exists "household members can add ai extractions" on public.ai_extractions;
drop policy if exists "household members can update ai extractions" on public.ai_extractions;
drop policy if exists "household medical members can view ai extractions" on public.ai_extractions;
drop policy if exists "household owners can add ai extractions" on public.ai_extractions;
drop policy if exists "household owners can update ai extractions" on public.ai_extractions;

create policy "household medical members can view ai extractions"
on public.ai_extractions for select to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = ai_extractions.document_id
      and public.can_view_household_medical(public.pet_household(d.pet_id))
  )
);

create policy "household owners can add ai extractions"
on public.ai_extractions for insert to authenticated
with check (
  exists (
    select 1 from public.documents d
    where d.id = ai_extractions.document_id
      and public.can_manage_household_medical(public.pet_household(d.pet_id))
  )
);

create policy "household owners can update ai extractions"
on public.ai_extractions for update to authenticated
using (
  exists (
    select 1 from public.documents d
    where d.id = ai_extractions.document_id
      and public.can_manage_household_medical(public.pet_household(d.pet_id))
  )
)
with check (
  exists (
    select 1 from public.documents d
    where d.id = ai_extractions.document_id
      and public.can_manage_household_medical(public.pet_household(d.pet_id))
  )
);

-- extracted_fields (inherits access through ai_extractions -> documents)
drop policy if exists "household members can view extracted fields" on public.extracted_fields;
drop policy if exists "household members can add extracted fields" on public.extracted_fields;
drop policy if exists "household members can update extracted fields" on public.extracted_fields;
drop policy if exists "household medical members can view extracted fields" on public.extracted_fields;
drop policy if exists "household owners can add extracted fields" on public.extracted_fields;
drop policy if exists "household owners can update extracted fields" on public.extracted_fields;

create policy "household medical members can view extracted fields"
on public.extracted_fields for select to authenticated
using (
  exists (
    select 1
    from public.ai_extractions ae
    join public.documents d on d.id = ae.document_id
    where ae.id = extracted_fields.extraction_id
      and public.can_view_household_medical(public.pet_household(d.pet_id))
  )
);

create policy "household owners can add extracted fields"
on public.extracted_fields for insert to authenticated
with check (
  exists (
    select 1
    from public.ai_extractions ae
    join public.documents d on d.id = ae.document_id
    where ae.id = extracted_fields.extraction_id
      and public.can_manage_household_medical(public.pet_household(d.pet_id))
  )
);

create policy "household owners can update extracted fields"
on public.extracted_fields for update to authenticated
using (
  exists (
    select 1
    from public.ai_extractions ae
    join public.documents d on d.id = ae.document_id
    where ae.id = extracted_fields.extraction_id
      and public.can_manage_household_medical(public.pet_household(d.pet_id))
  )
)
with check (
  exists (
    select 1
    from public.ai_extractions ae
    join public.documents d on d.id = ae.document_id
    where ae.id = extracted_fields.extraction_id
      and public.can_manage_household_medical(public.pet_household(d.pet_id))
  )
);

-- Shared access to private vet-record files.
-- Current path shape is user_id/pet_id/document_id/original.ext.
drop policy if exists "household members can read vet records" on storage.objects;
drop policy if exists "household members can upload vet records" on storage.objects;
drop policy if exists "household medical members can read vet records" on storage.objects;
drop policy if exists "household owners can upload vet records" on storage.objects;

create policy "household medical members can read vet records"
on storage.objects for select
to authenticated
using (
  bucket_id = 'vet-records'
  and array_length(storage.foldername(name), 1) >= 2
  and public.can_view_household_medical(
    public.pet_household(((storage.foldername(name))[2])::uuid)
  )
);

create policy "household owners can upload vet records"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vet-records'
  and array_length(storage.foldername(name), 1) >= 2
  and public.can_manage_household_medical(
    public.pet_household(((storage.foldername(name))[2])::uuid)
  )
);
