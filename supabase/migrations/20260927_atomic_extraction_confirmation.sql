-- Confirm an AI extraction and create its health timeline events in one
-- transaction. Retrying after a network timeout cannot create duplicates.

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

  if not exists (
    select 1
    from public.documents d
    where d.id = target_document
      and d.pet_id = target_pet
      and d.status = 'review_required'
  ) or not exists (
    select 1
    from public.ai_extractions e
    where e.id = target_extraction
      and e.document_id = target_document
      and e.status = 'proposed'
  ) then
    raise exception 'This review was already completed or is no longer available';
  end if;

  insert into public.medical_events(
    pet_id,
    document_id,
    user_id,
    event_type,
    event_date,
    title,
    description,
    source_type
  )
  values (
    target_pet,
    target_document,
    auth.uid(),
    'vet_visit',
    target_visit_date,
    coalesce(nullif(trim(target_finding), ''), 'Veterinary record added'),
    coalesce(
      nullif(trim(target_event_description), ''),
      'Veterinary record confirmed by the owner.'
    ),
    'veterinary_record'
  );

  if nullif(trim(target_follow_up), '') is not null then
    insert into public.medical_events(
      pet_id,
      document_id,
      user_id,
      event_type,
      event_date,
      title,
      description,
      source_type
    )
    values (
      target_pet,
      target_document,
      auth.uid(),
      'follow_up',
      target_visit_date,
      'Follow-up recommended',
      trim(target_follow_up),
      'veterinary_record'
    );
  end if;

  update public.extracted_fields
  set status = 'confirmed',
      confirmed_value = case field_type
        when 'visit_date' then target_visit_date::text
        when 'clinic' then nullif(trim(target_clinic), '')
        when 'finding' then nullif(trim(target_finding), '')
        when 'diagnosis' then nullif(trim(target_diagnosis), '')
        when 'diagnosis_certainty' then target_diagnosis_certainty
        when 'follow_up' then nullif(trim(target_follow_up), '')
        when 'medications' then target_medications_json
        when 'warnings' then target_warnings_json
        else confirmed_value
      end,
      confirmed_by = auth.uid(),
      confirmed_at = now(),
      updated_at = now()
  where extraction_id = target_extraction;

  update public.ai_extractions
  set status = 'confirmed',
      updated_at = now()
  where id = target_extraction;

  update public.documents
  set status = 'confirmed',
      updated_at = now()
  where id = target_document;
end;
$$;

grant execute on function public.confirm_vet_extraction(
  uuid, uuid, uuid, date, text, text, text, text, text, text, text, text
) to authenticated;
