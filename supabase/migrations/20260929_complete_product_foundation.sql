-- Pawso product-completion foundation.
--
-- Adds the structured fields required for medication courses/refills,
-- recurring care, pet photos, emergency handoff, symptoms, lab results,
-- explicit household time zones, audited dose corrections, and owner-managed
-- household roles.  Destructive pet/document deletion remains behind the
-- authenticated backend so Storage objects and database rows are removed
-- together.

begin;

alter table public.households
  add column if not exists time_zone text not null default 'UTC';

alter table public.pets
  add column if not exists date_of_birth date,
  add column if not exists photo_path text,
  add column if not exists archived_at timestamptz,
  add column if not exists emergency_notes text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text;

alter table public.documents
  add column if not exists archived_at timestamptz;

-- Match the form and API bounds at the database boundary. NOT VALID keeps the
-- forward migration deployable when an older project contains an oversized
-- historical value while protecting all future inserts and updates.
alter table public.households
  drop constraint if exists households_name_length_check,
  add constraint households_name_length_check
    check (length(trim(name)) between 1 and 120) not valid;

alter table public.household_members
  drop constraint if exists household_members_display_name_length_check,
  add constraint household_members_display_name_length_check
    check (display_name is null or length(display_name) <= 120) not valid;

alter table public.household_invitations
  drop constraint if exists household_invitations_email_length_check,
  add constraint household_invitations_email_length_check
    check (invited_email is null or length(invited_email) <= 320) not valid,
  drop constraint if exists household_invitations_accepted_by_fkey,
  add constraint household_invitations_accepted_by_fkey
    foreign key (accepted_by) references auth.users(id) on delete set null;

alter table public.pets
  drop constraint if exists pets_profile_length_check,
  add constraint pets_profile_length_check check (
    length(trim(name)) between 1 and 120
    and length(coalesce(breed, '')) <= 120
    and length(coalesce(approximate_age, '')) <= 80
    and length(coalesce(microchip_number, '')) <= 80
    and length(coalesce(conditions, '')) <= 2000
    and length(coalesce(allergies, '')) <= 2000
    and length(coalesce(medications, '')) <= 2000
    and length(coalesce(vet_clinic, '')) <= 200
    and length(coalesce(emergency_notes, '')) <= 2000
    and length(coalesce(emergency_contact_name, '')) <= 120
    and length(coalesce(emergency_contact_phone, '')) <= 80
  ) not valid;

alter table public.documents
  drop constraint if exists documents_metadata_length_check,
  add constraint documents_metadata_length_check check (
    length(filename) between 1 and 255
    and length(content_type) between 1 and 100
  ) not valid;

alter table public.medications
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists refills_remaining integer,
  add column if not exists refill_due_date date,
  add column if not exists paused_at timestamptz;

alter table public.medications
  drop constraint if exists medications_course_dates_check,
  add constraint medications_course_dates_check
    check (end_date is null or start_date is null or end_date >= start_date),
  drop constraint if exists medications_refills_remaining_check,
  add constraint medications_refills_remaining_check
    check (refills_remaining is null or refills_remaining >= 0);

alter table public.medication_logs
  add column if not exists corrected_at timestamptz,
  add column if not exists correction_reason text;

alter table public.medication_schedules
  add column if not exists snoozed_until timestamptz;

alter table public.care_tasks
  add column if not exists series_id uuid,
  add column if not exists scheduled_due_at timestamptz,
  add column if not exists recurrence_frequency text not null default 'none',
  add column if not exists recurrence_interval integer not null default 1,
  add column if not exists recurrence_ends_on date,
  add column if not exists occurrence_number integer not null default 1,
  add column if not exists paused_at timestamptz,
  add column if not exists snoozed_until timestamptz;

update public.care_tasks
set series_id = coalesce(series_id, gen_random_uuid()),
    scheduled_due_at = coalesce(scheduled_due_at, due_at)
where series_id is null or scheduled_due_at is null;

alter table public.care_tasks
  alter column series_id set default gen_random_uuid(),
  alter column series_id set not null,
  drop constraint if exists care_tasks_recurrence_frequency_check,
  add constraint care_tasks_recurrence_frequency_check
    check (recurrence_frequency in ('none', 'daily', 'weekly', 'monthly')),
  drop constraint if exists care_tasks_recurrence_interval_check,
  add constraint care_tasks_recurrence_interval_check
    check (recurrence_interval between 1 and 52),
  drop constraint if exists care_tasks_occurrence_number_check,
  add constraint care_tasks_occurrence_number_check
    check (occurrence_number > 0);

alter table public.task_completions
  add column if not exists outcome text not null default 'completed';

alter table public.task_completions
  drop constraint if exists task_completions_outcome_check,
  add constraint task_completions_outcome_check
    check (outcome in ('completed', 'skipped'));

-- Preserve shared household history if a caregiver or sitter deletes their
-- own Auth account. Owner-created pet data still cascades during owner account
-- deletion, while actor identity falls back to the stored display name.
alter table public.care_tasks
  alter column user_id drop not null,
  drop constraint if exists care_tasks_user_id_fkey,
  add constraint care_tasks_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

alter table public.task_completions
  alter column user_id drop not null,
  drop constraint if exists task_completions_user_id_fkey,
  add constraint task_completions_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

alter table public.medication_logs
  alter column user_id drop not null,
  drop constraint if exists medication_logs_user_id_fkey,
  add constraint medication_logs_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete set null;

create table if not exists public.medication_log_revisions (
  id uuid primary key default gen_random_uuid(),
  medication_log_id uuid not null references public.medication_logs(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  previous_status text not null check (previous_status in ('given', 'skipped')),
  new_status text not null check (new_status in ('given', 'skipped')),
  previous_note text,
  new_note text,
  reason text not null check (length(trim(reason)) between 2 and 500),
  changed_by uuid references auth.users(id) on delete set null,
  actor_name text,
  changed_at timestamptz not null default now()
);

alter table public.medication_log_revisions
  alter column changed_by drop not null,
  drop constraint if exists medication_log_revisions_changed_by_fkey,
  add constraint medication_log_revisions_changed_by_fkey
    foreign key (changed_by) references auth.users(id) on delete set null;

create or replace function public.validate_household_time_zone()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  perform now() at time zone new.time_zone;
  return new;
exception
  when invalid_parameter_value then
    raise exception 'Use a valid IANA time zone, such as America/Vancouver';
end;
$$;

drop trigger if exists validate_household_time_zone_trigger on public.households;
create trigger validate_household_time_zone_trigger
before insert or update of time_zone on public.households
for each row execute function public.validate_household_time_zone();

revoke execute on function public.validate_household_time_zone() from public, anon, authenticated;

create table if not exists public.symptom_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  observed_on date not null,
  category text not null check (length(trim(category)) between 1 and 80),
  severity smallint not null check (severity between 1 and 5),
  frequency text not null default 'single'
    check (frequency in ('single', 'intermittent', 'frequent', 'constant')),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  collected_on date not null,
  test_name text not null check (length(trim(test_name)) between 1 and 120),
  numeric_value numeric,
  text_value text,
  unit text,
  reference_low numeric,
  reference_high numeric,
  reference_text text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lab_results_value_check
    check (numeric_value is not null or nullif(trim(text_value), '') is not null),
  constraint lab_results_reference_check
    check (
      reference_low is null
      or reference_high is null
      or reference_high >= reference_low
    )
);

alter table public.symptom_entries
  drop constraint if exists symptom_entries_duration_upper_check,
  add constraint symptom_entries_duration_upper_check
    check (duration_minutes is null or duration_minutes <= 525600) not valid;

alter table public.lab_results
  drop constraint if exists lab_results_supported_numeric_range_check,
  add constraint lab_results_supported_numeric_range_check check (
    abs(coalesce(numeric_value, 0)) <= 1000000000000
    and abs(coalesce(reference_low, 0)) <= 1000000000000
    and abs(coalesce(reference_high, 0)) <= 1000000000000
  ) not valid;

alter table public.medical_events
  add column if not exists symptom_entry_id uuid references public.symptom_entries(id) on delete set null,
  add column if not exists lab_result_id uuid references public.lab_results(id) on delete set null;

-- Shared counters keep abuse limits correct when the API scales beyond one
-- process. Clients cannot read or mutate this table directly.
create table if not exists public.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket text not null,
  window_kind text not null check (window_kind in ('minute', 'day')),
  window_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket, window_kind, window_start)
);

create index if not exists pets_household_active_idx
  on public.pets(household_id, archived_at);
create index if not exists documents_pet_active_idx
  on public.documents(pet_id, archived_at, created_at desc);
create index if not exists medications_pet_course_idx
  on public.medications(pet_id, is_active, paused_at, end_date);
create index if not exists care_tasks_series_idx
  on public.care_tasks(series_id, occurrence_number);
create index if not exists medication_log_revisions_log_idx
  on public.medication_log_revisions(medication_log_id, changed_at desc);
create index if not exists symptom_entries_pet_date_idx
  on public.symptom_entries(pet_id, observed_on desc);
create index if not exists lab_results_pet_test_date_idx
  on public.lab_results(pet_id, test_name, collected_on desc);

alter table public.medication_log_revisions enable row level security;
alter table public.symptom_entries enable row level security;
alter table public.lab_results enable row level security;
alter table public.api_rate_limits enable row level security;

grant select on public.medication_log_revisions to authenticated;
grant select on public.symptom_entries to authenticated;
grant select on public.lab_results to authenticated;
revoke insert, update, delete on public.symptom_entries from authenticated;
revoke insert, update, delete on public.lab_results from authenticated;
revoke all on public.api_rate_limits from public, anon, authenticated;

create policy "household members can view dose revisions"
on public.medication_log_revisions for select to authenticated
using (public.is_household_member(public.pet_household(pet_id)));

create policy "household medical members can view symptoms"
on public.symptom_entries for select to authenticated
using (public.can_view_household_medical(public.pet_household(pet_id)));

create policy "household owners can add symptoms"
on public.symptom_entries for insert to authenticated
with check (
  user_id = auth.uid()
  and public.can_manage_household_medical(public.pet_household(pet_id))
);

create policy "household owners can update symptoms"
on public.symptom_entries for update to authenticated
using (public.can_manage_household_medical(public.pet_household(pet_id)))
with check (public.can_manage_household_medical(public.pet_household(pet_id)));

create policy "household owners can delete symptoms"
on public.symptom_entries for delete to authenticated
using (public.can_manage_household_medical(public.pet_household(pet_id)));

create policy "household medical members can view labs"
on public.lab_results for select to authenticated
using (public.can_view_household_medical(public.pet_household(pet_id)));

create policy "household owners can add labs"
on public.lab_results for insert to authenticated
with check (
  user_id = auth.uid()
  and public.can_manage_household_medical(public.pet_household(pet_id))
);

create policy "household owners can update labs"
on public.lab_results for update to authenticated
using (public.can_manage_household_medical(public.pet_household(pet_id)))
with check (public.can_manage_household_medical(public.pet_household(pet_id)));

create policy "household owners can delete labs"
on public.lab_results for delete to authenticated
using (public.can_manage_household_medical(public.pet_household(pet_id)));

-- Editing a dose outcome must preserve the prior value and a reason. Remove
-- the bypassing direct-update policy; clients use correct_medication_log().
drop policy if exists "household members can update own medication logs"
  on public.medication_logs;

create or replace function public.correct_medication_log(
  target_log uuid,
  target_status text,
  target_note text,
  correction_explanation text,
  actor_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  log_row public.medication_logs%rowtype;
  revision_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if target_status not in ('given', 'skipped') then
    raise exception 'Invalid dose status';
  end if;
  if length(trim(coalesce(correction_explanation, ''))) < 2 then
    raise exception 'Add a short reason for the correction';
  end if;
  if length(trim(coalesce(correction_explanation, ''))) > 500
    or length(coalesce(target_note, '')) > 1000
    or length(coalesce(actor_display_name, '')) > 120
  then
    raise exception 'Correction details are too long';
  end if;

  select * into log_row
  from public.medication_logs
  where id = target_log
  for update;

  if log_row.id is null then
    raise exception 'Medication log was not found';
  end if;
  if not public.is_household_member(public.pet_household(log_row.pet_id)) then
    raise exception 'You do not have access to this dose';
  end if;
  if log_row.user_id is distinct from auth.uid()
    and not public.can_manage_household_medical(public.pet_household(log_row.pet_id))
  then
    raise exception 'Only the person who logged the dose or the owner can correct it';
  end if;

  insert into public.medication_log_revisions(
    medication_log_id, pet_id, previous_status, new_status,
    previous_note, new_note, reason, changed_by, actor_name
  ) values (
    log_row.id, log_row.pet_id, log_row.status, target_status,
    log_row.note, nullif(trim(target_note), ''), trim(correction_explanation),
    auth.uid(), left(coalesce(nullif(trim(actor_display_name), ''), 'Household member'), 120)
  ) returning id into revision_id;

  update public.medication_logs
  set status = target_status,
      note = nullif(trim(target_note), ''),
      corrected_at = now(),
      correction_reason = trim(correction_explanation)
  where id = log_row.id;

  return revision_id;
end;
$$;

create or replace function public.record_structured_symptom(
  target_pet uuid,
  target_date date,
  target_category text,
  target_severity integer,
  target_frequency text,
  target_duration_minutes integer default null,
  target_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  symptom_id uuid;
  household_time_zone text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.can_manage_household_medical(public.pet_household(target_pet)) then
    raise exception 'Only the household owner can record symptoms';
  end if;
  if target_date is null or nullif(trim(target_category), '') is null then
    raise exception 'Symptom date and category are required';
  end if;
  if target_severity < 1 or target_severity > 5 then
    raise exception 'Severity must be between 1 and 5';
  end if;
  if target_frequency not in ('single', 'intermittent', 'frequent', 'constant') then
    raise exception 'Invalid symptom frequency';
  end if;
  if length(target_category) > 80
    or length(coalesce(target_notes, '')) > 2000
    or (target_duration_minutes is not null and target_duration_minutes > 525600)
  then
    raise exception 'Symptom details are too long';
  end if;
  select coalesce(h.time_zone, 'UTC') into household_time_zone
  from public.pets p
  join public.households h on h.id = p.household_id
  where p.id = target_pet;
  if target_date > (now() at time zone household_time_zone)::date then
    raise exception 'Symptom date cannot be in the future';
  end if;

  insert into public.symptom_entries(
    pet_id, user_id, observed_on, category, severity, frequency,
    duration_minutes, notes
  ) values (
    target_pet, auth.uid(), target_date, trim(target_category),
    target_severity, target_frequency, target_duration_minutes,
    nullif(trim(target_notes), '')
  ) returning id into symptom_id;

  insert into public.medical_events(
    pet_id, user_id, event_type, event_date, title, description,
    source_type, symptom_entry_id
  ) values (
    target_pet, auth.uid(), 'owner_symptom', target_date,
    format('Symptom: %s', trim(target_category)),
    concat_ws(
      ' · ',
      format('Severity %s/5', target_severity),
      initcap(target_frequency),
      case when target_duration_minutes is not null
        then format('%s minutes', target_duration_minutes) end,
      nullif(trim(target_notes), '')
    ),
    'owner_note', symptom_id
  );

  return symptom_id;
end;
$$;

create or replace function public.record_lab_result_entry(
  target_pet uuid,
  target_date date,
  target_test_name text,
  target_numeric_value numeric default null,
  target_text_value text default null,
  target_unit text default null,
  target_reference_low numeric default null,
  target_reference_high numeric default null,
  target_reference_text text default null,
  target_notes text default null,
  target_document uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  result_id uuid;
  display_value text;
  household_time_zone text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.can_manage_household_medical(public.pet_household(target_pet)) then
    raise exception 'Only the household owner can record lab results';
  end if;
  if target_date is null or nullif(trim(target_test_name), '') is null then
    raise exception 'Lab date and test name are required';
  end if;
  if target_numeric_value is null and nullif(trim(target_text_value), '') is null then
    raise exception 'A numeric or text result is required';
  end if;
  if target_reference_low is not null and target_reference_high is not null
    and target_reference_high < target_reference_low
  then
    raise exception 'Reference high cannot be below reference low';
  end if;
  if abs(coalesce(target_numeric_value, 0)) > 1000000000000
    or abs(coalesce(target_reference_low, 0)) > 1000000000000
    or abs(coalesce(target_reference_high, 0)) > 1000000000000
  then
    raise exception 'Laboratory value is outside Pawso''s supported range';
  end if;
  if length(target_test_name) > 120
    or length(coalesce(target_text_value, '')) > 500
    or length(coalesce(target_unit, '')) > 40
    or length(coalesce(target_reference_text, '')) > 500
    or length(coalesce(target_notes, '')) > 2000
  then
    raise exception 'Lab result details are too long';
  end if;
  select coalesce(h.time_zone, 'UTC') into household_time_zone
  from public.pets p
  join public.households h on h.id = p.household_id
  where p.id = target_pet;
  if target_date > (now() at time zone household_time_zone)::date then
    raise exception 'Lab date cannot be in the future';
  end if;
  if target_document is not null and not exists (
    select 1 from public.documents
    where id = target_document and pet_id = target_pet
  ) then
    raise exception 'Linked document was not found for this pet';
  end if;

  insert into public.lab_results(
    pet_id, document_id, user_id, collected_on, test_name, numeric_value,
    text_value, unit, reference_low, reference_high, reference_text, notes
  ) values (
    target_pet, target_document, auth.uid(), target_date, trim(target_test_name),
    target_numeric_value, nullif(trim(target_text_value), ''),
    nullif(trim(target_unit), ''), target_reference_low, target_reference_high,
    nullif(trim(target_reference_text), ''), nullif(trim(target_notes), '')
  ) returning id into result_id;

  display_value := coalesce(target_numeric_value::text, nullif(trim(target_text_value), ''));
  insert into public.medical_events(
    pet_id, document_id, user_id, event_type, event_date, title,
    description, source_type, lab_result_id
  ) values (
    target_pet, target_document, auth.uid(), 'lab_result', target_date,
    format('Lab: %s', trim(target_test_name)),
    concat_ws(
      ' · ',
      concat(display_value, case when nullif(trim(target_unit), '') is not null
        then concat(' ', trim(target_unit)) else '' end),
      case when target_reference_low is not null or target_reference_high is not null
        then format('Reference %s–%s', coalesce(target_reference_low::text, '?'), coalesce(target_reference_high::text, '?')) end,
      nullif(trim(target_reference_text), ''),
      nullif(trim(target_notes), '')
    ),
    case when target_document is null then 'owner_note' else 'veterinary_record' end,
    result_id
  );

  return result_id;
end;
$$;

create or replace function public.record_weight_check_in(
  target_pet uuid,
  target_date date,
  target_weight numeric,
  target_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
  household_time_zone text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.can_manage_household_medical(public.pet_household(target_pet)) then
    raise exception 'Only the household owner can record weight';
  end if;
  if target_date is null or target_weight is null or target_weight <= 0 then
    raise exception 'A valid date and positive weight are required';
  end if;
  if target_weight > 999999.99 then
    raise exception 'Weight is outside Pawso''s supported range';
  end if;
  if length(coalesce(target_notes, '')) > 2000 then
    raise exception 'Weight notes are too long';
  end if;
  select coalesce(h.time_zone, 'UTC') into household_time_zone
  from public.pets p
  join public.households h on h.id = p.household_id
  where p.id = target_pet;
  if target_date > (now() at time zone household_time_zone)::date then
    raise exception 'Weight date cannot be in the future';
  end if;

  insert into public.medical_events(
    pet_id, user_id, event_type, event_date, title, description, source_type
  ) values (
    target_pet, auth.uid(), 'weight', target_date,
    format('Weight recorded: %s kg', target_weight),
    coalesce(nullif(trim(target_notes), ''), 'Owner-recorded weight.'),
    'owner_note'
  ) returning id into event_id;

  update public.pets
  set weight_kg = target_weight, updated_at = now()
  where id = target_pet;

  return event_id;
end;
$$;

create or replace function public.save_medication_with_schedules(
  target_pet uuid,
  target_name text,
  target_dose text,
  target_unit text,
  target_instructions text,
  target_times text[],
  target_medication uuid default null,
  target_start_date date default null,
  target_end_date date default null,
  target_refills_remaining integer default null,
  target_refill_due_date date default null,
  target_paused boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  medication_id uuid;
  existing_pet uuid;
  existing_active boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.can_manage_household_medical(public.pet_household(target_pet)) then
    raise exception 'Only the household owner can manage medications';
  end if;
  if nullif(trim(target_name), '') is null then
    raise exception 'Medication name is required';
  end if;
  if target_end_date is not null and target_start_date is not null
    and target_end_date < target_start_date
  then
    raise exception 'End date cannot be before start date';
  end if;
  if target_refills_remaining is not null and target_refills_remaining < 0 then
    raise exception 'Refills remaining cannot be negative';
  end if;
  if target_refill_due_date is not null and target_start_date is not null
    and target_refill_due_date < target_start_date
  then
    raise exception 'Refill date cannot be before the course starts';
  end if;
  if length(target_name) > 120
    or length(coalesce(target_dose, '')) > 80
    or length(coalesce(target_unit, '')) > 40
    or length(coalesce(target_instructions, '')) > 2000
  then
    raise exception 'Medication details are too long';
  end if;
  if coalesce(array_length(target_times, 1), 0) < 1
    or array_length(target_times, 1) > 6
  then
    raise exception 'Add between one and six medication times';
  end if;
  if exists (
    select 1 from unnest(target_times) as item(value)
    where item.value is null
       or trim(item.value) !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ) then
    raise exception 'Medication times must use 24-hour HH:MM format';
  end if;

  if target_medication is null then
    insert into public.medications(
      pet_id, user_id, name, dose, unit, instructions, is_active,
      start_date, end_date, refills_remaining, refill_due_date, paused_at
    ) values (
      target_pet, auth.uid(), trim(target_name), nullif(trim(target_dose), ''),
      nullif(trim(target_unit), ''), nullif(trim(target_instructions), ''), true,
      target_start_date, target_end_date, target_refills_remaining,
      target_refill_due_date, case when target_paused then now() else null end
    ) returning id into medication_id;
  else
    select pet_id, is_active into existing_pet, existing_active
    from public.medications
    where id = target_medication
    for update;

    if existing_pet is null or existing_pet <> target_pet then
      raise exception 'Medication was not found for this pet';
    end if;
    if not existing_active then
      raise exception 'Archived medications cannot be edited';
    end if;

    update public.medications
    set name = trim(target_name),
        dose = nullif(trim(target_dose), ''),
        unit = nullif(trim(target_unit), ''),
        instructions = nullif(trim(target_instructions), ''),
        start_date = target_start_date,
        end_date = target_end_date,
        refills_remaining = target_refills_remaining,
        refill_due_date = target_refill_due_date,
        paused_at = case
          when target_paused and paused_at is null then now()
          when not target_paused then null
          else paused_at
        end,
        is_active = true,
        updated_at = now()
    where id = target_medication;

    delete from public.medication_schedules
    where medication_id = target_medication;
    medication_id := target_medication;
  end if;

  insert into public.medication_schedules(medication_id, pet_id, user_id, time_of_day)
  select medication_id, target_pet, auth.uid(), trim(item.value)::time
  from (
    select distinct trim(times.value) as value
    from unnest(target_times) as times(value)
  ) as item;

  return medication_id;
end;
$$;

create or replace function public.record_medication_dose(
  target_schedule uuid,
  target_scheduled_for timestamptz,
  target_status text,
  actor_display_name text default null,
  target_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  medication_id uuid;
  pet_id uuid;
  medication_active boolean;
  medication_paused_at timestamptz;
  medication_start_date date;
  medication_end_date date;
  household_time_zone text;
  schedule_time time;
  schedule_snoozed_until timestamptz;
  log_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if target_status not in ('given', 'skipped') then
    raise exception 'Invalid dose status';
  end if;
  if target_scheduled_for is null then
    raise exception 'Scheduled dose time is required';
  end if;

  select
    schedule.medication_id,
    schedule.pet_id,
    medication.is_active,
    medication.paused_at,
    medication.start_date,
    medication.end_date,
    coalesce(household.time_zone, 'UTC'),
    schedule.time_of_day,
    schedule.snoozed_until
  into
    medication_id,
    pet_id,
    medication_active,
    medication_paused_at,
    medication_start_date,
    medication_end_date,
    household_time_zone,
    schedule_time,
    schedule_snoozed_until
  from public.medication_schedules schedule
  join public.medications medication
    on medication.id = schedule.medication_id
   and medication.pet_id = schedule.pet_id
  join public.pets pet on pet.id = schedule.pet_id
  join public.households household on household.id = pet.household_id
  where schedule.id = target_schedule
  for update of schedule;

  if medication_id is null then
    raise exception 'Medication schedule was not found';
  end if;
  if not public.is_household_member(public.pet_household(pet_id)) then
    raise exception 'You do not have access to this dose';
  end if;
  if not medication_active or medication_paused_at is not null then
    raise exception 'This medication is not currently active';
  end if;
  if (target_scheduled_for at time zone household_time_zone)::date
    <> (now() at time zone household_time_zone)::date
  then
    raise exception 'A dose can only be logged for the current household day';
  end if;
  if (target_scheduled_for at time zone household_time_zone)::time(0)
      <> schedule_time::time(0)
    and (
      schedule_snoozed_until is null
      or date_trunc('minute', target_scheduled_for)
        <> date_trunc('minute', schedule_snoozed_until)
    )
  then
    raise exception 'Dose time does not match the medication schedule';
  end if;
  if medication_start_date is not null
    and (target_scheduled_for at time zone household_time_zone)::date < medication_start_date
  then
    raise exception 'This dose is before the medication course starts';
  end if;
  if medication_end_date is not null
    and (target_scheduled_for at time zone household_time_zone)::date > medication_end_date
  then
    raise exception 'This dose is after the medication course ends';
  end if;
  if exists (
    select 1
    from public.medication_logs existing_log
    where existing_log.schedule_id = target_schedule
      and (existing_log.scheduled_for at time zone household_time_zone)::date
        = (target_scheduled_for at time zone household_time_zone)::date
  ) then
    raise exception 'This dose was already logged. Refresh Pawso to see the latest entry';
  end if;

  insert into public.medication_logs(
    medication_id, schedule_id, pet_id, user_id, actor_name,
    scheduled_for, status, logged_at, note
  ) values (
    medication_id, target_schedule, pet_id, auth.uid(),
    left(coalesce(nullif(trim(actor_display_name), ''), 'Household member'), 120),
    target_scheduled_for, target_status, now(),
    nullif(left(trim(target_note), 1000), '')
  )
  returning id into log_id;

  update public.medication_schedules
  set snoozed_until = null
  where id = target_schedule;

  return log_id;
exception
  when unique_violation then
    raise exception 'This dose was already logged. Refresh Pawso to see the latest entry';
end;
$$;

create or replace function public.set_medication_state(
  target_medication uuid,
  target_action text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  medication_row public.medications%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  select * into medication_row
  from public.medications
  where id = target_medication
  for update;

  if medication_row.id is null then
    raise exception 'Medication was not found';
  end if;
  if not public.can_manage_household_medical(public.pet_household(medication_row.pet_id)) then
    raise exception 'Only the household owner can change medication status';
  end if;
  if target_action not in ('pause', 'resume', 'archive') then
    raise exception 'Invalid medication action';
  end if;
  if not medication_row.is_active and target_action <> 'archive' then
    raise exception 'Archived medications cannot be changed';
  end if;

  update public.medications
  set paused_at = case
        when target_action = 'pause' then coalesce(paused_at, now())
        when target_action = 'resume' then null
        else paused_at
      end,
      is_active = case when target_action = 'archive' then false else true end,
      updated_at = now()
  where id = target_medication;
end;
$$;

create or replace function public.set_medication_schedule_snooze(
  target_schedule uuid,
  target_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  schedule_row public.medication_schedules%rowtype;
  household_time_zone text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  select * into schedule_row
  from public.medication_schedules
  where id = target_schedule
  for update;
  if schedule_row.id is null then
    raise exception 'Medication schedule was not found';
  end if;
  if not public.is_household_member(public.pet_household(schedule_row.pet_id)) then
    raise exception 'You do not have access to this schedule';
  end if;
  select coalesce(h.time_zone, 'UTC') into household_time_zone
  from public.pets p
  join public.households h on h.id = p.household_id
  where p.id = schedule_row.pet_id;
  if target_until is not null
    and (target_until <= now() or target_until > now() + interval '24 hours')
  then
    raise exception 'Snooze must be within the next 24 hours';
  end if;
  if target_until is not null
    and (target_until at time zone household_time_zone)::date
      <> (now() at time zone household_time_zone)::date
  then
    raise exception 'A medication reminder cannot be snoozed past the household day';
  end if;
  update public.medication_schedules
  set snoozed_until = target_until
  where id = target_schedule;
end;
$$;

create or replace function public.create_care_task_with_recurrence(
  target_pet uuid,
  target_title text,
  target_notes text,
  target_due_at timestamptz,
  target_frequency text default 'none',
  target_interval integer default 1,
  target_ends_on date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  task_id uuid;
  household_time_zone text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.can_manage_household_care(public.pet_household(target_pet)) then
    raise exception 'Only an owner or caregiver can add care tasks';
  end if;
  if nullif(trim(target_title), '') is null or target_due_at is null then
    raise exception 'Task title and due time are required';
  end if;
  if target_frequency not in ('none', 'daily', 'weekly', 'monthly') then
    raise exception 'Invalid recurrence frequency';
  end if;
  if target_interval < 1 or target_interval > 52 then
    raise exception 'Recurrence interval must be between 1 and 52';
  end if;
  if length(target_title) > 160 or length(coalesce(target_notes, '')) > 2000 then
    raise exception 'Care task details are too long';
  end if;
  select coalesce(h.time_zone, 'UTC') into household_time_zone
  from public.pets p
  join public.households h on h.id = p.household_id
  where p.id = target_pet;
  if target_ends_on is not null
    and target_ends_on < (target_due_at at time zone household_time_zone)::date
  then
    raise exception 'Recurrence end date cannot be before the first task';
  end if;

  insert into public.care_tasks(
    pet_id, user_id, title, notes, due_at, task_type, is_active,
    scheduled_due_at, recurrence_frequency, recurrence_interval,
    recurrence_ends_on
  ) values (
    target_pet, auth.uid(), trim(target_title), nullif(trim(target_notes), ''),
    target_due_at, 'general', true, target_due_at, target_frequency,
    target_interval, case when target_frequency = 'none' then null else target_ends_on end
  ) returning id into task_id;

  return task_id;
end;
$$;

create or replace function public.resolve_care_task(
  target_task uuid,
  actor_display_name text default null,
  target_outcome text default 'completed'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.care_tasks%rowtype;
  completion_id uuid;
  next_due timestamptz;
  household_time_zone text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if target_outcome not in ('completed', 'skipped') then
    raise exception 'Invalid task outcome';
  end if;

  select * into task_row
  from public.care_tasks
  where id = target_task
  for update;

  if task_row.id is null then
    raise exception 'Care task was not found';
  end if;
  if not public.is_household_member(public.pet_household(task_row.pet_id)) then
    raise exception 'You do not have access to this care task';
  end if;
  if target_outcome = 'skipped'
    and not public.can_manage_household_care(public.pet_household(task_row.pet_id))
  then
    raise exception 'Only an owner or caregiver can skip a care task';
  end if;
  if not task_row.is_active then
    raise exception 'Care task is already complete or archived';
  end if;
  if task_row.paused_at is not null then
    raise exception 'Resume this care task before resolving it';
  end if;

  insert into public.task_completions(
    task_id, pet_id, user_id, actor_name, completed_at, outcome
  ) values (
    task_row.id, task_row.pet_id, auth.uid(),
    left(coalesce(nullif(trim(actor_display_name), ''), 'Household member'), 120),
    now(), target_outcome
  ) returning id into completion_id;

  update public.care_tasks
  set is_active = false, updated_at = now()
  where id = task_row.id;

  select coalesce(h.time_zone, 'UTC') into household_time_zone
  from public.pets p
  join public.households h on h.id = p.household_id
  where p.id = task_row.pet_id;

  -- Add recurrence in the household's wall-clock time so a 09:00 task stays
  -- at 09:00 through daylight-saving changes.
  next_due := case task_row.recurrence_frequency
    when 'daily' then (
      (coalesce(task_row.scheduled_due_at, task_row.due_at) at time zone household_time_zone)
      + make_interval(days => task_row.recurrence_interval)
    ) at time zone household_time_zone
    when 'weekly' then (
      (coalesce(task_row.scheduled_due_at, task_row.due_at) at time zone household_time_zone)
      + make_interval(weeks => task_row.recurrence_interval)
    ) at time zone household_time_zone
    when 'monthly' then (
      (coalesce(task_row.scheduled_due_at, task_row.due_at) at time zone household_time_zone)
      + make_interval(months => task_row.recurrence_interval)
    ) at time zone household_time_zone
    else null
  end;

  if next_due is not null
    and (
      task_row.recurrence_ends_on is null
      or (next_due at time zone household_time_zone)::date <= task_row.recurrence_ends_on
    )
  then
    insert into public.care_tasks(
      pet_id, user_id, title, notes, due_at, task_type, is_active,
      scheduled_due_at, series_id, recurrence_frequency, recurrence_interval,
      recurrence_ends_on, occurrence_number
    ) values (
      task_row.pet_id, task_row.user_id, task_row.title, task_row.notes,
      next_due, task_row.task_type, true, next_due, task_row.series_id,
      task_row.recurrence_frequency, task_row.recurrence_interval,
      task_row.recurrence_ends_on, task_row.occurrence_number + 1
    );
  end if;

  return completion_id;
end;
$$;

create or replace function public.complete_care_task(
  target_task uuid,
  actor_display_name text default null
)
returns uuid
language sql
security definer
set search_path = public
as $$
  select public.resolve_care_task(target_task, actor_display_name, 'completed');
$$;

create or replace function public.set_care_task_state(
  target_task uuid,
  target_action text,
  snooze_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.care_tasks%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  select * into task_row
  from public.care_tasks
  where id = target_task
  for update;

  if task_row.id is null then
    raise exception 'Care task was not found';
  end if;
  if not public.can_manage_household_care(public.pet_household(task_row.pet_id)) then
    raise exception 'Only an owner or caregiver can change this task';
  end if;
  if target_action not in ('snooze', 'pause', 'resume', 'end') then
    raise exception 'Invalid care task action';
  end if;
  if not task_row.is_active then
    raise exception 'This care task has already ended';
  end if;
  if target_action = 'snooze' and (snooze_until is null or snooze_until <= now()) then
    raise exception 'Choose a future snooze time';
  end if;

  if target_action = 'snooze' then
    update public.care_tasks
    set due_at = snooze_until, snoozed_until = snooze_until, updated_at = now()
    where id = target_task;
  elsif target_action = 'pause' then
    update public.care_tasks
    set paused_at = now(), updated_at = now()
    where series_id = task_row.series_id and is_active;
  elsif target_action = 'resume' then
    update public.care_tasks
    set paused_at = null, updated_at = now()
    where series_id = task_row.series_id and is_active;
  else
    update public.care_tasks
    set is_active = false, updated_at = now()
    where series_id = task_row.series_id and is_active;
  end if;
end;
$$;

create or replace function public.update_household_member_role(
  target_household uuid,
  target_member uuid,
  target_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  member_row public.household_members%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.is_household_owner(target_household) then
    raise exception 'Only a household owner can change roles';
  end if;
  if target_role not in ('caregiver', 'sitter') then
    raise exception 'Choose caregiver or sitter';
  end if;

  select * into member_row
  from public.household_members
  where id = target_member and household_id = target_household
  for update;

  if member_row.id is null then
    raise exception 'Household member was not found';
  end if;
  if member_row.role = 'owner' then
    raise exception 'The owner role cannot be changed';
  end if;

  update public.household_members
  set role = target_role
  where id = target_member;
end;
$$;

-- Household sharing requires a recoverable identity. Anonymous users may keep
-- a private temporary workspace, but they cannot create or consume access
-- grants until they secure that account or sign in.
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
  normalized_email text := nullif(lower(trim(target_email)), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'true' then
    raise exception 'Secure your Pawso account before sending invitations';
  end if;
  if not public.is_household_owner(target_household) then
    raise exception 'Only a household owner can create invitations';
  end if;
  if target_role not in ('caregiver', 'sitter') then
    raise exception 'Invalid role';
  end if;
  if normalized_email is not null and (
    length(normalized_email) > 320
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ) then
    raise exception 'Enter a valid invitation email address';
  end if;

  insert into public.household_invitations(
    household_id, created_by, invited_email, role
  ) values (
    target_household, auth.uid(), normalized_email, target_role
  ) returning invite_code into code;

  return code::text;
end;
$$;

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
  if coalesce(auth.jwt() ->> 'is_anonymous', 'false') = 'true' then
    raise exception 'Secure or sign in to your Pawso account before joining a household';
  end if;
  if trim(coalesce(code_text, '')) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'Enter a valid invitation code';
  end if;
  if length(coalesce(preferred_display_name, '')) > 120 then
    raise exception 'Display name is too long';
  end if;

  select * into invitation
  from public.household_invitations
  where invite_code = trim(code_text)::uuid
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
    nullif(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1), ''),
    'Household member'
  );

  insert into public.household_members(
    household_id, user_id, display_name, role
  ) values (
    invitation.household_id, auth.uid(), display_value, invitation.role
  )
  on conflict (household_id, user_id)
  do update set
    display_name = excluded.display_name,
    role = case
      when public.household_members.role = 'owner' then 'owner'
      else excluded.role
    end;

  update public.household_invitations
  set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
  where id = invitation.id;

  return invitation.household_id;
end;
$$;

create or replace function public.consume_api_rate_limit(
  target_bucket text,
  minute_limit integer,
  day_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  minute_start timestamptz := date_trunc('minute', now());
  day_start timestamptz := date_trunc('day', now());
  minute_count integer;
  day_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if target_bucket !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'Invalid rate-limit bucket';
  end if;
  if minute_limit < 1 or day_limit < 1 then
    raise exception 'Rate limits must be positive';
  end if;

  insert into public.api_rate_limits(
    user_id, bucket, window_kind, window_start, request_count
  ) values (
    auth.uid(), target_bucket, 'minute', minute_start, 1
  )
  on conflict (user_id, bucket, window_kind, window_start)
  do update set
    request_count = public.api_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into minute_count;

  insert into public.api_rate_limits(
    user_id, bucket, window_kind, window_start, request_count
  ) values (
    auth.uid(), target_bucket, 'day', day_start, 1
  )
  on conflict (user_id, bucket, window_kind, window_start)
  do update set
    request_count = public.api_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into day_count;

  delete from public.api_rate_limits
  where user_id = auth.uid()
    and window_start < day_start - interval '2 days';

  return jsonb_build_object(
    'allowed', minute_count <= minute_limit and day_count <= day_limit,
    'minute_remaining', greatest(0, minute_limit - minute_count),
    'day_remaining', greatest(0, day_limit - day_count),
    'retry_after_seconds', case
      when minute_count > minute_limit then
        greatest(1, extract(epoch from (minute_start + interval '1 minute' - now()))::integer)
      else null
    end,
    'daily_limit_reached', day_count > day_limit
  );
end;
$$;

-- Confirm a reviewed extraction atomically and safely under retries. Row locks
-- prevent two devices from creating duplicate timeline events, while upserts
-- preserve owner-entered values when AI originally omitted a field.
create or replace function public.confirm_vet_extraction(
  target_pet uuid,
  target_document uuid,
  target_extraction uuid,
  target_visit_date date,
  target_clinic text,
  target_finding text,
  target_diagnosis text,
  target_diagnosis_certainty text,
  target_follow_up text,
  target_medications_json text,
  target_warnings_json text,
  target_event_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  document_row public.documents%rowtype;
  extraction_row public.ai_extractions%rowtype;
  household_time_zone text;
  medications_payload jsonb;
  warnings_payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.can_manage_household_medical(public.pet_household(target_pet)) then
    raise exception 'Only the household owner can confirm medical records';
  end if;
  if target_diagnosis_certainty not in (
    'confirmed', 'suspected', 'possible', 'rule_out', 'historical', 'unknown'
  ) then
    raise exception 'Invalid diagnosis certainty';
  end if;

  select * into document_row
  from public.documents
  where id = target_document and pet_id = target_pet
  for update;
  if document_row.id is null or document_row.status <> 'review_required' then
    raise exception 'This review was already completed or is no longer available';
  end if;

  select * into extraction_row
  from public.ai_extractions
  where id = target_extraction and document_id = target_document
  for update;
  if extraction_row.id is null or extraction_row.status <> 'proposed' then
    raise exception 'This review was already completed or is no longer available';
  end if;

  if length(coalesce(target_clinic, '')) > 200
    or length(coalesce(target_finding, '')) > 4000
    or length(coalesce(target_diagnosis, '')) > 4000
    or length(coalesce(target_follow_up, '')) > 4000
    or length(coalesce(target_event_description, '')) > 5000
  then
    raise exception 'The reviewed record contains a field that is too long';
  end if;
  if length(coalesce(target_medications_json, '')) > 20000
    or length(coalesce(target_warnings_json, '')) > 20000
  then
    raise exception 'The reviewed record contains too much list data';
  end if;

  select coalesce(h.time_zone, 'UTC') into household_time_zone
  from public.pets p
  join public.households h on h.id = p.household_id
  where p.id = target_pet;
  if target_visit_date is not null
    and target_visit_date > (now() at time zone household_time_zone)::date
  then
    raise exception 'Visit date cannot be in the future';
  end if;

  begin
    medications_payload := coalesce(nullif(target_medications_json, ''), '[]')::jsonb;
    warnings_payload := coalesce(nullif(target_warnings_json, ''), '[]')::jsonb;
  exception when invalid_text_representation then
    raise exception 'Medication and warning lists must be valid JSON';
  end;

  if jsonb_typeof(medications_payload) <> 'array'
    or jsonb_typeof(warnings_payload) <> 'array'
    or jsonb_array_length(medications_payload) > 30
    or jsonb_array_length(warnings_payload) > 30
  then
    raise exception 'Medication and warning lists must be arrays with at most 30 items';
  end if;
  if exists (
    select 1 from jsonb_array_elements(medications_payload) as item(value)
    where jsonb_typeof(item.value) <> 'string'
       or length(item.value #>> '{}') > 500
  ) or exists (
    select 1 from jsonb_array_elements(warnings_payload) as item(value)
    where jsonb_typeof(item.value) <> 'string'
       or length(item.value #>> '{}') > 500
  ) then
    raise exception 'Medication and warning entries must be short text values';
  end if;

  insert into public.medical_events(
    pet_id, document_id, user_id, event_type, event_date, title,
    description, source_type
  ) values (
    target_pet, target_document, auth.uid(), 'vet_visit', target_visit_date,
    left(coalesce(nullif(trim(target_finding), ''), 'Veterinary record added'), 160),
    coalesce(
      nullif(trim(target_event_description), ''),
      'Veterinary record confirmed by the owner.'
    ),
    'veterinary_record'
  );

  if nullif(trim(target_follow_up), '') is not null then
    insert into public.medical_events(
      pet_id, document_id, user_id, event_type, event_date, title,
      description, source_type
    ) values (
      target_pet, target_document, auth.uid(), 'follow_up', target_visit_date,
      'Follow-up recommended', trim(target_follow_up), 'veterinary_record'
    );
  end if;

  insert into public.extracted_fields(
    extraction_id, field_type, raw_value, normalized_value, status,
    confirmed_value, confirmed_by, confirmed_at
  )
  select
    target_extraction, field_value.field_type, null, null, 'confirmed',
    field_value.confirmed_value, auth.uid(), now()
  from (
    values
      ('visit_date', target_visit_date::text),
      ('clinic', nullif(trim(target_clinic), '')),
      ('finding', nullif(trim(target_finding), '')),
      ('diagnosis', nullif(trim(target_diagnosis), '')),
      ('diagnosis_certainty', target_diagnosis_certainty),
      ('follow_up', nullif(trim(target_follow_up), '')),
      ('medications', medications_payload::text),
      ('warnings', warnings_payload::text)
  ) as field_value(field_type, confirmed_value)
  on conflict (extraction_id, field_type)
  do update set
    status = 'confirmed',
    confirmed_value = excluded.confirmed_value,
    confirmed_by = excluded.confirmed_by,
    confirmed_at = excluded.confirmed_at,
    updated_at = now();

  update public.extracted_fields
  set status = 'confirmed',
      confirmed_by = auth.uid(),
      confirmed_at = now(),
      updated_at = now()
  where extraction_id = target_extraction
    and field_type not in (
      'visit_date', 'clinic', 'finding', 'diagnosis',
      'diagnosis_certainty', 'follow_up', 'medications', 'warnings'
    );

  update public.ai_extractions
  set status = 'confirmed', updated_at = now()
  where id = target_extraction;
  update public.documents
  set status = 'confirmed', updated_at = now()
  where id = target_document;
end;
$$;

-- Veterinary paths must retain the uploader/pet/document hierarchy used by
-- coordinated deletion. This prevents an owner from creating undiscoverable
-- objects elsewhere in the private bucket.
drop policy if exists "household owners can upload vet records" on storage.objects;
create policy "household owners can upload vet records"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vet-records'
  and array_length(storage.foldername(name), 1) >= 3
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.can_manage_household_medical(
    public.pet_household(((storage.foldername(name))[2])::uuid)
  )
);

-- Private pet photos. Object paths are {pet_id}/{random-name.ext}; unlike
-- veterinary files they do not expose the uploading user's id.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values (
  'pet-photos', 'pet-photos', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "household members can read pet photos" on storage.objects;
drop policy if exists "household owners can upload pet photos" on storage.objects;
drop policy if exists "household owners can update pet photos" on storage.objects;
drop policy if exists "household owners can delete pet photos" on storage.objects;

create policy "household members can read pet photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'pet-photos'
  and array_length(storage.foldername(name), 1) >= 1
  and public.is_household_member(
    public.pet_household(((storage.foldername(name))[1])::uuid)
  )
);

create policy "household owners can upload pet photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'pet-photos'
  and array_length(storage.foldername(name), 1) >= 1
  and public.can_manage_household_medical(
    public.pet_household(((storage.foldername(name))[1])::uuid)
  )
);

create policy "household owners can update pet photos"
on storage.objects for update to authenticated
using (
  bucket_id = 'pet-photos'
  and public.can_manage_household_medical(
    public.pet_household(((storage.foldername(name))[1])::uuid)
  )
)
with check (
  bucket_id = 'pet-photos'
  and public.can_manage_household_medical(
    public.pet_household(((storage.foldername(name))[1])::uuid)
  )
);

create policy "household owners can delete pet photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'pet-photos'
  and public.can_manage_household_medical(
    public.pet_household(((storage.foldername(name))[1])::uuid)
  )
);

-- Medication and care plan mutations are RPC-only so related rows and audit
-- history cannot be bypassed by a partial direct REST write. Reads remain
-- governed by the existing household RLS policies.
revoke insert, update, delete on public.medications from authenticated;
revoke insert, update, delete on public.medication_schedules from authenticated;
revoke insert, update, delete on public.medication_logs from authenticated;
revoke insert, update, delete on public.care_tasks from authenticated;
revoke insert, update, delete on public.task_completions from authenticated;

revoke execute on function public.correct_medication_log(uuid, text, text, text, text) from public, anon;
revoke execute on function public.record_structured_symptom(uuid, date, text, integer, text, integer, text) from public, anon;
revoke execute on function public.record_lab_result_entry(uuid, date, text, numeric, text, text, numeric, numeric, text, text, uuid) from public, anon;
revoke execute on function public.save_medication_with_schedules(uuid, text, text, text, text, text[], uuid, date, date, integer, date, boolean) from public, anon;
revoke execute on function public.record_medication_dose(uuid, timestamptz, text, text, text) from public, anon;
revoke execute on function public.set_medication_state(uuid, text) from public, anon;
revoke execute on function public.set_medication_schedule_snooze(uuid, timestamptz) from public, anon;
revoke execute on function public.create_care_task_with_recurrence(uuid, text, text, timestamptz, text, integer, date) from public, anon;
revoke execute on function public.resolve_care_task(uuid, text, text) from public, anon;
revoke execute on function public.set_care_task_state(uuid, text, timestamptz) from public, anon;
revoke execute on function public.update_household_member_role(uuid, uuid, text) from public, anon;
revoke execute on function public.create_household_invitation(uuid, text, text) from public, anon;
revoke execute on function public.accept_household_invitation(text, text) from public, anon;
revoke execute on function public.consume_api_rate_limit(text, integer, integer) from public, anon;
revoke execute on function public.confirm_vet_extraction(uuid, uuid, uuid, date, text, text, text, text, text, text, text, text) from public, anon;

grant execute on function public.correct_medication_log(uuid, text, text, text, text) to authenticated;
grant execute on function public.record_structured_symptom(uuid, date, text, integer, text, integer, text) to authenticated;
grant execute on function public.record_lab_result_entry(uuid, date, text, numeric, text, text, numeric, numeric, text, text, uuid) to authenticated;
grant execute on function public.save_medication_with_schedules(uuid, text, text, text, text, text[], uuid, date, date, integer, date, boolean) to authenticated;
grant execute on function public.record_medication_dose(uuid, timestamptz, text, text, text) to authenticated;
grant execute on function public.set_medication_state(uuid, text) to authenticated;
grant execute on function public.set_medication_schedule_snooze(uuid, timestamptz) to authenticated;
grant execute on function public.create_care_task_with_recurrence(uuid, text, text, timestamptz, text, integer, date) to authenticated;
grant execute on function public.resolve_care_task(uuid, text, text) to authenticated;
grant execute on function public.set_care_task_state(uuid, text, timestamptz) to authenticated;
grant execute on function public.update_household_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.create_household_invitation(uuid, text, text) to authenticated;
grant execute on function public.accept_household_invitation(text, text) to authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to authenticated;
grant execute on function public.confirm_vet_extraction(uuid, uuid, uuid, date, text, text, text, text, text, text, text, text) to authenticated;

commit;
