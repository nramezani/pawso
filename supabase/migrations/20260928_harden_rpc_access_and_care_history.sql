-- Keep multi-step medication, weight, and care workflows behind validated
-- transactional RPCs, and narrow function execution to authenticated users.
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default. Pawso's
-- functions already check auth.uid(), but explicitly limiting them to the
-- authenticated role reduces unnecessary anonymous surface area. Direct
-- inserts into task_completions are also removed so a task can only be
-- completed through complete_care_task(), which writes the audit row and
-- deactivates the task atomically.

begin;

create or replace function public.create_medication_with_schedules(
  target_pet uuid,
  target_name text,
  target_dose text,
  target_unit text,
  target_instructions text,
  target_times text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_medication_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.can_manage_household_medical(public.pet_household(target_pet)) then
    raise exception 'Only the household owner can add medications';
  end if;

  if nullif(trim(target_name), '') is null then
    raise exception 'Medication name is required';
  end if;

  if coalesce(array_length(target_times, 1), 0) < 1
    or array_length(target_times, 1) > 6
  then
    raise exception 'Add between one and six medication times';
  end if;

  if exists (
    select 1
    from unnest(target_times) as item(value)
    where item.value is null
      or trim(item.value) !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ) then
    raise exception 'Medication times must use 24-hour HH:MM format';
  end if;

  insert into public.medications(
    pet_id,
    user_id,
    name,
    dose,
    unit,
    instructions,
    is_active
  )
  values (
    target_pet,
    auth.uid(),
    trim(target_name),
    nullif(trim(target_dose), ''),
    nullif(trim(target_unit), ''),
    nullif(trim(target_instructions), ''),
    true
  )
  returning id into new_medication_id;

  insert into public.medication_schedules(
    medication_id,
    pet_id,
    user_id,
    time_of_day
  )
  select
    new_medication_id,
    target_pet,
    auth.uid(),
    trim(item.value)::time
  from (
    select distinct trim(times.value) as value
    from unnest(target_times) as times(value)
  ) as item;

  return new_medication_id;
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

  insert into public.medical_events(
    pet_id,
    user_id,
    event_type,
    event_date,
    title,
    description,
    source_type
  )
  values (
    target_pet,
    auth.uid(),
    'weight',
    target_date,
    format('Weight recorded: %s kg', target_weight),
    coalesce(nullif(trim(target_notes), ''), 'Owner-recorded weight.'),
    'owner_note'
  )
  returning id into event_id;

  update public.pets
  set weight_kg = target_weight,
      updated_at = now()
  where id = target_pet;

  return event_id;
end;
$$;

create unique index if not exists task_completions_one_per_task_idx
  on public.task_completions(task_id);

revoke insert on table public.task_completions from authenticated;

revoke execute on function public.is_household_member(uuid) from public, anon;
revoke execute on function public.is_household_owner(uuid) from public, anon;
revoke execute on function public.pet_household(uuid) from public, anon;
revoke execute on function public.household_role(uuid) from public, anon;
revoke execute on function public.can_view_household_medical(uuid) from public, anon;
revoke execute on function public.can_manage_household_medical(uuid) from public, anon;
revoke execute on function public.can_manage_household_care(uuid) from public, anon;
revoke execute on function public.ensure_household_for_current_user(text) from public, anon;
revoke execute on function public.create_household_invitation(uuid, text, text) from public, anon;
revoke execute on function public.accept_household_invitation(text, text) from public, anon;
revoke execute on function public.remove_household_member(uuid, uuid) from public, anon;
revoke execute on function public.cancel_household_invitation(uuid, uuid) from public, anon;
revoke execute on function public.complete_care_task(uuid, text) from public, anon;
revoke execute on function public.confirm_vet_extraction(
  uuid, uuid, uuid, date, text, text, text, text, text, text, text, text
) from public, anon;
revoke execute on function public.create_medication_with_schedules(
  uuid, text, text, text, text, text[]
) from public, anon;
revoke execute on function public.record_weight_check_in(
  uuid, date, numeric, text
) from public, anon;

grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;
grant execute on function public.pet_household(uuid) to authenticated;
grant execute on function public.household_role(uuid) to authenticated;
grant execute on function public.can_view_household_medical(uuid) to authenticated;
grant execute on function public.can_manage_household_medical(uuid) to authenticated;
grant execute on function public.can_manage_household_care(uuid) to authenticated;
grant execute on function public.ensure_household_for_current_user(text) to authenticated;
grant execute on function public.create_household_invitation(uuid, text, text) to authenticated;
grant execute on function public.accept_household_invitation(text, text) to authenticated;
grant execute on function public.remove_household_member(uuid, uuid) to authenticated;
grant execute on function public.cancel_household_invitation(uuid, uuid) to authenticated;
grant execute on function public.complete_care_task(uuid, text) to authenticated;
grant execute on function public.confirm_vet_extraction(
  uuid, uuid, uuid, date, text, text, text, text, text, text, text, text
) to authenticated;
grant execute on function public.create_medication_with_schedules(
  uuid, text, text, text, text, text[]
) to authenticated;
grant execute on function public.record_weight_check_in(
  uuid, date, numeric, text
) to authenticated;

commit;
