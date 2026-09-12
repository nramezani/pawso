grant select, update on table public.households to authenticated;
grant select, update, delete on table public.household_members to authenticated;
grant select on table public.household_invitations to authenticated;

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

drop policy if exists "household members can view pets" on public.pets;
drop policy if exists "household members can add pets" on public.pets;
drop policy if exists "household members can update pets" on public.pets;

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

drop policy if exists "household members can view documents" on public.documents;
drop policy if exists "household members can add documents" on public.documents;
drop policy if exists "household members can update documents" on public.documents;

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

drop policy if exists "household members can view medical events" on public.medical_events;
drop policy if exists "household members can add medical events" on public.medical_events;
drop policy if exists "household owners can update medical events" on public.medical_events;

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

drop policy if exists "household members can view medications" on public.medications;
drop policy if exists "household members can add medications" on public.medications;
drop policy if exists "household members can update medications" on public.medications;

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

drop policy if exists "household members can view medication schedules" on public.medication_schedules;
drop policy if exists "household members can add medication schedules" on public.medication_schedules;
drop policy if exists "household owners can update medication schedules" on public.medication_schedules;

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

drop policy if exists "household members can view medication logs" on public.medication_logs;
drop policy if exists "household members can add medication logs" on public.medication_logs;
drop policy if exists "household members can update medication logs" on public.medication_logs;

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

drop policy if exists "household members can view care tasks" on public.care_tasks;
drop policy if exists "household members can add care tasks" on public.care_tasks;
drop policy if exists "household members can update care tasks" on public.care_tasks;

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

drop policy if exists "household members can view ai extractions" on public.ai_extractions;
drop policy if exists "household members can add ai extractions" on public.ai_extractions;
drop policy if exists "household members can update ai extractions" on public.ai_extractions;

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

drop policy if exists "household members can view extracted fields" on public.extracted_fields;
drop policy if exists "household members can add extracted fields" on public.extracted_fields;
drop policy if exists "household members can update extracted fields" on public.extracted_fields;

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

drop policy if exists "household members can read vet records" on storage.objects;
drop policy if exists "household members can upload vet records" on storage.objects;

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
