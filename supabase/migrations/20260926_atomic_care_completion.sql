-- Complete a care task and write its audit entry as one transaction so the
-- task cannot disappear without a matching completion (or vice versa).

create or replace function public.complete_care_task(
  target_task uuid,
  actor_display_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.care_tasks%rowtype;
  completion_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into task_row
  from public.care_tasks
  where id = target_task
  for update;

  if task_row.id is null then
    raise exception 'Care task was not found';
  end if;

  if not public.is_household_member(public.pet_household(task_row.pet_id)) then
    raise exception 'You do not have access to this care task';
  end if;

  if not task_row.is_active then
    raise exception 'Care task is already complete or archived';
  end if;

  insert into public.task_completions(
    task_id,
    pet_id,
    user_id,
    actor_name,
    completed_at
  )
  values (
    task_row.id,
    task_row.pet_id,
    auth.uid(),
    coalesce(nullif(trim(actor_display_name), ''), 'Household member'),
    now()
  )
  returning id into completion_id;

  update public.care_tasks
  set is_active = false,
      updated_at = now()
  where id = task_row.id;

  return completion_id;
end;
$$;

grant execute on function public.complete_care_task(uuid, text) to authenticated;
