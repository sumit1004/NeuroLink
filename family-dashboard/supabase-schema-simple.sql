-- ============================================================================
-- NeuroLink Family Dashboard - Simplified Supabase Schema
-- ============================================================================
-- This version avoids DROP statements to prevent permission issues
-- If policies already exist, you may need to delete them manually first
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE TABLES
-- ============================================================================

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text unique,
  role text default 'family'
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  dob date,
  home_location text,
  emergency_contact jsonb
);

create table if not exists known_people (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  name text,
  relation text,
  photo_url text,
  notes text,
  created_at timestamptz default now()
);

-- Add missing columns if they don't exist (for existing tables)
alter table if exists known_people add column if not exists notes text;

create table if not exists health_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  title text,
  file_url text,
  uploaded_at timestamptz default now()
);

create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  title text,
  schedule jsonb,
  active boolean default true
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references routines(id) on delete cascade,
  title text,
  completed boolean default false,
  due_at timestamptz
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  lat float,
  lon float,
  accuracy float,
  created_at timestamptz default now()
);

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  type text check (type in ('lost','unknown_person')),
  payload jsonb,
  created_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  person_name text,
  transcript text,
  summary text,
  audio_url text,
  created_at timestamptz default now()
);

create table if not exists doctor_contacts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade,
  name text,
  phone text,
  speciality text
);

-- ============================================================================
-- SECTION 2: CREATE STORAGE BUCKETS
-- ============================================================================

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('known_people', 'known_people', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  on conflict (id) do update set public = true;
  
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('health_records', 'health_records', false, 104857600, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
  on conflict (id) do nothing;
  
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('voice_records', 'voice_records', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg'])
  on conflict (id) do nothing;
end $$;

-- ============================================================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY
-- ============================================================================

alter table profiles enable row level security;
alter table patients enable row level security;
alter table known_people enable row level security;
alter table health_records enable row level security;
alter table routines enable row level security;
alter table tasks enable row level security;
alter table locations enable row level security;
alter table alerts enable row level security;
alter table conversations enable row level security;
alter table doctor_contacts enable row level security;

-- ============================================================================
-- SECTION 4: CREATE RLS POLICIES FOR TABLES
-- ============================================================================

-- Profiles
create policy "Authenticated usesrs can view all profiles"
  on profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update to authenticated using (auth.uid() = id);

-- Patients
create policy "Authenticated users can view all patients"
  on patients for select to authenticated using (true);

create policy "Authenticated users can insert patients"
  on patients for insert to authenticated with check (true);

create policy "Authenticated users can update patients"
  on patients for update to authenticated using (true);

create policy "Authenticated users can delete patients"
  on patients for delete to authenticated using (true);

-- Known People
create policy "Authenticated users can view all known people"
  on known_people for select to authenticated using (true);

create policy "Authenticated users can insert known people"
  on known_people for insert to authenticated with check (true);

create policy "Authenticated users can update known people"
  on known_people for update to authenticated using (true);

create policy "Authenticated users can delete known people"
  on known_people for delete to authenticated using (true);

-- Health Records
create policy "Authenticated users can view all health records"
  on health_records for select to authenticated using (true);

create policy "Authenticated users can insert health records"
  on health_records for insert to authenticated with check (true);

create policy "Authenticated users can update health records"
  on health_records for update to authenticated using (true);

create policy "Authenticated users can delete health records"
  on health_records for delete to authenticated using (true);

-- Routines
create policy "Authenticated users can view all routines"
  on routines for select to authenticated using (true);

create policy "Authenticated users can insert routines"
  on routines for insert to authenticated with check (true);

create policy "Authenticated users can update routines"
  on routines for update to authenticated using (true);

create policy "Authenticated users can delete routines"
  on routines for delete to authenticated using (true);

-- Tasks
create policy "Authenticated users can view all tasks"
  on tasks for select to authenticated using (true);

create policy "Authenticated users can insert tasks"
  on tasks for insert to authenticated with check (true);

create policy "Authenticated users can update tasks"
  on tasks for update to authenticated using (true);

create policy "Authenticated users can delete tasks"
  on tasks for delete to authenticated using (true);

-- Locations
create policy "Authenticated users can view all locations"
  on locations for select to authenticated using (true);

create policy "Authenticated users can insert locations"
  on locations for insert to authenticated with check (true);

create policy "Authenticated users can update locations"
  on locations for update to authenticated using (true);

create policy "Authenticated users can delete locations"
  on locations for delete to authenticated using (true);

-- Alerts
create policy "Authenticated users can view all alerts"
  on alerts for select to authenticated using (true);

create policy "Authenticated users can insert alerts"
  on alerts for insert to authenticated with check (true);

create policy "Authenticated users can update alerts"
  on alerts for update to authenticated using (true);

create policy "Authenticated users can delete alerts"
  on alerts for delete to authenticated using (true);

-- Conversations
create policy "Authenticated users can view all conversations"
  on conversations for select to authenticated using (true);

create policy "Authenticated users can insert conversations"
  on conversations for insert to authenticated with check (true);

create policy "Authenticated users can update conversations"
  on conversations for update to authenticated using (true);

create policy "Authenticated users can delete conversations"
  on conversations for delete to authenticated using (true);

-- Doctor Contacts
create policy "Authenticated users can view all doctor contacts"
  on doctor_contacts for select to authenticated using (true);

create policy "Authenticated users can insert doctor contacts"
  on doctor_contacts for insert to authenticated with check (true);

create policy "Authenticated users can update doctor contacts"
  on doctor_contacts for update to authenticated using (true);

create policy "Authenticated users can delete doctor contacts"
  on doctor_contacts for delete to authenticated using (true);

-- ============================================================================
-- SECTION 5: CREATE STORAGE POLICIES
-- ============================================================================
-- IMPORTANT: If you get errors about policies already existing, go to:
-- Supabase Dashboard → Storage → [Select bucket] → Policies tab
-- Delete existing policies manually, then run this section again

-- Known People Bucket
create policy "Authenticated users can upload to known_people"
  on storage.objects for insert to authenticated with check (bucket_id = 'known_people');

create policy "Authenticated users can view known_people files"
  on storage.objects for select to authenticated using (bucket_id = 'known_people');

create policy "Public can view known_people files"
  on storage.objects for select using (bucket_id = 'known_people');

create policy "Authenticated users can update known_people files"
  on storage.objects for update to authenticated using (bucket_id = 'known_people');

create policy "Authenticated users can delete known_people files"
  on storage.objects for delete to authenticated using (bucket_id = 'known_people');

-- Health Records Bucket
create policy "Authenticated users can upload to health_records"
  on storage.objects for insert to authenticated with check (bucket_id = 'health_records');

create policy "Authenticated users can view health_records files"
  on storage.objects for select to authenticated using (bucket_id = 'health_records');

create policy "Authenticated users can update health_records files"
  on storage.objects for update to authenticated using (bucket_id = 'health_records');

create policy "Authenticated users can delete health_records files"
  on storage.objects for delete to authenticated using (bucket_id = 'health_records');

-- Voice Records Bucket
create policy "Authenticated users can upload to voice_records"
  on storage.objects for insert to authenticated with check (bucket_id = 'voice_records');

create policy "Authenticated users can view voice_records files"
  on storage.objects for select to authenticated using (bucket_id = 'voice_records');

create policy "Authenticated users can update voice_records files"
  on storage.objects for update to authenticated using (bucket_id = 'voice_records');

create policy "Authenticated users can delete voice_records files"
  on storage.objects for delete to authenticated using (bucket_id = 'voice_records');

