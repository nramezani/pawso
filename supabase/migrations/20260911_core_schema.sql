-- Pawso baseline schema
-- This migration intentionally precedes the household migrations and can be
-- applied to a brand-new Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  species text not null check (species in ('dog', 'cat')),
  breed text,
  approximate_age text,
  sex text check (sex is null or sex in ('male', 'female', 'unknown')),
  spayed_neutered boolean,
  weight_kg numeric(8, 2) check (weight_kg is null or weight_kg > 0),
  microchip_number text,
  conditions text,
  allergies text,
  medications text,
  vet_clinic text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  content_type text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  storage_path text unique,
  status text not null default 'review_required'
    check (status in ('review_required', 'confirmed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_date date,
  title text not null,
  description text,
  source_type text not null default 'owner_note',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  dose text,
  unit text,
  instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medication_schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  time_of_day time not null,
  created_at timestamptz not null default now(),
  unique (medication_id, time_of_day)
);

create table if not exists public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  schedule_id uuid references public.medication_schedules(id) on delete set null,
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null check (status in ('given', 'skipped')),
  logged_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  unique (schedule_id, scheduled_for)
);

create table if not exists public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  notes text,
  due_at timestamptz not null,
  task_type text not null default 'general',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.care_tasks(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  model text not null,
  schema_version text not null,
  status text not null default 'proposed'
    check (status in ('proposed', 'confirmed', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.extracted_fields (
  id uuid primary key default gen_random_uuid(),
  extraction_id uuid not null references public.ai_extractions(id) on delete cascade,
  field_type text not null,
  raw_value text,
  normalized_value text,
  status text not null default 'proposed'
    check (status in ('proposed', 'confirmed', 'rejected')),
  confirmed_value text,
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (extraction_id, field_type)
);

create index if not exists pets_user_id_idx on public.pets(user_id);
create index if not exists documents_pet_id_idx on public.documents(pet_id);
create index if not exists medical_events_pet_date_idx on public.medical_events(pet_id, event_date desc);
create index if not exists medications_pet_active_idx on public.medications(pet_id, is_active);
create index if not exists medication_schedules_medication_id_idx on public.medication_schedules(medication_id);
create index if not exists medication_logs_pet_scheduled_idx on public.medication_logs(pet_id, scheduled_for desc);
create index if not exists care_tasks_pet_due_idx on public.care_tasks(pet_id, due_at);
create index if not exists task_completions_task_id_idx on public.task_completions(task_id);
create index if not exists ai_extractions_document_id_idx on public.ai_extractions(document_id);
create index if not exists extracted_fields_extraction_id_idx on public.extracted_fields(extraction_id);

alter table public.pets enable row level security;
alter table public.documents enable row level security;
alter table public.medical_events enable row level security;
alter table public.medications enable row level security;
alter table public.medication_schedules enable row level security;
alter table public.medication_logs enable row level security;
alter table public.care_tasks enable row level security;
alter table public.task_completions enable row level security;
alter table public.ai_extractions enable row level security;
alter table public.extracted_fields enable row level security;

grant select, insert, update, delete on all tables in schema public to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vet-records',
  'vet-records',
  false,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
