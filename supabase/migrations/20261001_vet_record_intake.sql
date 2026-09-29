-- A clinic can upload one file through an owner-created, short-lived link.
alter table public.pets add column if not exists vet_name text;
alter table public.pets add column if not exists vet_phone text;
alter table public.pets add column if not exists vet_email text;

alter table public.documents add column if not exists source_type text not null default 'owner_upload';
alter table public.documents add constraint documents_source_type_check
  check (source_type in ('owner_upload', 'clinic_upload'));

create table public.vet_upload_links (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique check (length(token_hash) = 64),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  revoked_at timestamptz
);
create index vet_upload_links_pet_idx on public.vet_upload_links(pet_id, created_at desc);
alter table public.vet_upload_links enable row level security;
-- Access to links is through the backend service role only. Never expose hashes to clients.
revoke all on public.vet_upload_links from anon, authenticated;
grant select, insert, update, delete on public.vet_upload_links to service_role;

create function public.consume_vet_upload_link(
  p_token_hash text, p_filename text, p_content_type text, p_size_bytes bigint
) returns table(document_id uuid, pet_id uuid, owner_id uuid)
language plpgsql security definer set search_path = '' as $$
declare v_link public.vet_upload_links%rowtype;
begin
  if auth.role() <> 'service_role' then
    raise exception 'Not authorized';
  end if;
  select * into v_link from public.vet_upload_links
    where token_hash = p_token_hash and used_at is null and revoked_at is null
      and expires_at > now() for update;
  if not found then
    return;
  end if;
  -- A deleted or archived pet cannot receive a record.
  if not exists (select 1 from public.pets p where p.id = v_link.pet_id and p.archived_at is null) then
    return;
  end if;
  insert into public.documents (pet_id, user_id, filename, content_type, size_bytes, status, source_type)
    values (v_link.pet_id, v_link.owner_id, p_filename, p_content_type, p_size_bytes,
            'review_required', 'clinic_upload') returning id into document_id;
  update public.vet_upload_links set used_at = now() where id = v_link.id;
  pet_id := v_link.pet_id;
  owner_id := v_link.owner_id;
  return next;
end;
$$;
revoke all on function public.consume_vet_upload_link(text, text, text, bigint) from public, anon, authenticated;
grant execute on function public.consume_vet_upload_link(text, text, text, bigint) to service_role;
