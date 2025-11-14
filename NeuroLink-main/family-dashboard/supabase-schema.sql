-- ============================================================================
-- NeuroLink Family Dashboard - Complete Supabase Schema
-- ============================================================================
-- This file contains everything needed to set up the database:
-- 1. All tables
-- 2. Storage buckets
-- 3. Row Level Security (RLS) policies for all tables
-- 4. Storage policies for file uploads
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run" to execute
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
  -- Create known_people bucket (for photos of known people)
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('known_people', 'known_people', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  on conflict (id) do nothing;
  
  -- Create health_records bucket (for PDFs and medical documents)
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('health_records', 'health_records', false, 104857600, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
  on conflict (id) do nothing;
  
  -- Create voice_records bucket (for audio conversations)
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('voice_records', 'voice_records', false, 52428800, ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg'])
  on conflict (id) do nothing;
end $$;

-- ============================================================================
-- SECTION 3: ENABLE ROW LEVEL SECURITY (RLS)
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

-- Note: RLS is already enabled on storage.objects by default in Supabase
-- We don't need to enable it manually

-- ============================================================================
-- SECTION 4: DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================================================
-- Note: If you get errors about policies not existing, that's fine - just continue
-- These DROP statements are safe and won't cause issues if policies don't exist

-- Drop existing table policies if they exist
drop policy if exists "Authenticated users can view all profiles" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;

drop policy if exists "Authenticated users can view all patients" on patients;
drop policy if exists "Authenticated users can insert patients" on patients;
drop policy if exists "Authenticated users can update patients" on patients;
drop policy if exists "Authenticated users can delete patients" on patients;

drop policy if exists "Authenticated users can view all known people" on known_people;
drop policy if exists "Authenticated users can insert known people" on known_people;
drop policy if exists "Authenticated users can update known people" on known_people;
drop policy if exists "Authenticated users can delete known people" on known_people;

drop policy if exists "Authenticated users can view all health records" on health_records;
drop policy if exists "Authenticated users can insert health records" on health_records;
drop policy if exists "Authenticated users can update health records" on health_records;
drop policy if exists "Authenticated users can delete health records" on health_records;

drop policy if exists "Authenticated users can view all routines" on routines;
drop policy if exists "Authenticated users can insert routines" on routines;
drop policy if exists "Authenticated users can update routines" on routines;
drop policy if exists "Authenticated users can delete routines" on routines;

drop policy if exists "Authenticated users can view all tasks" on tasks;
drop policy if exists "Authenticated users can insert tasks" on tasks;
drop policy if exists "Authenticated users can update tasks" on tasks;
drop policy if exists "Authenticated users can delete tasks" on tasks;

drop policy if exists "Authenticated users can view all locations" on locations;
drop policy if exists "Authenticated users can insert locations" on locations;
drop policy if exists "Authenticated users can update locations" on locations;
drop policy if exists "Authenticated users can delete locations" on locations;

drop policy if exists "Authenticated users can view all alerts" on alerts;
drop policy if exists "Authenticated users can insert alerts" on alerts;
drop policy if exists "Authenticated users can update alerts" on alerts;
drop policy if exists "Authenticated users can delete alerts" on alerts;

drop policy if exists "Authenticated users can view all conversations" on conversations;
drop policy if exists "Authenticated users can insert conversations" on conversations;
drop policy if exists "Authenticated users can update conversations" on conversations;
drop policy if exists "Authenticated users can delete conversations" on conversations;

drop policy if exists "Authenticated users can view all doctor contacts" on doctor_contacts;
drop policy if exists "Authenticated users can insert doctor contacts" on doctor_contacts;
drop policy if exists "Authenticated users can update doctor contacts" on doctor_contacts;
drop policy if exists "Authenticated users can delete doctor contacts" on doctor_contacts;

-- Drop existing storage policies if they exist
-- Note: If you get permission errors here, you can skip this section
-- and manually delete existing policies from Supabase Dashboard → Storage → Policies
do $$
begin
  drop policy if exists "Authenticated users can upload to known_people" on storage.objects;
  drop policy if exists "Authenticated users can view known_people files" on storage.objects;
  drop policy if exists "Authenticated users can update known_people files" on storage.objects;
  drop policy if exists "Authenticated users can delete known_people files" on storage.objects;
  drop policy if exists "Authenticated users can upload to health_records" on storage.objects;
  drop policy if exists "Authenticated users can view health_records files" on storage.objects;
  drop policy if exists "Authenticated users can update health_records files" on storage.objects;
  drop policy if exists "Authenticated users can delete health_records files" on storage.objects;
  drop policy if exists "Authenticated users can upload to voice_records" on storage.objects;
  drop policy if exists "Authenticated users can view voice_records files" on storage.objects;
  drop policy if exists "Authenticated users can update voice_records files" on storage.objects;
  drop policy if exists "Authenticated users can delete voice_records files" on storage.objects;
exception when others then
  -- If dropping policies fails, continue anyway - we'll create new ones
  raise notice 'Some policies could not be dropped, continuing...';
end $$;

-- ============================================================================
-- SECTION 5: CREATE RLS POLICIES FOR TABLES
-- ============================================================================

-- RLS Policies for profiles
create policy "Authenticated users can view all profiles"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- RLS Policies for patients (all authenticated users can manage)
create policy "Authenticated users can view all patients"
  on patients for select
  to authenticated
  using (true);

create policy "Authenticated users can insert patients"
  on patients for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update patients"
  on patients for update
  to authenticated
  using (true);

create policy "Authenticated users can delete patients"
  on patients for delete
  to authenticated
  using (true);

-- RLS Policies for known_people
create policy "Authenticated users can view all known people"
  on known_people for select
  to authenticated
  using (true);

create policy "Authenticated users can insert known people"
  on known_people for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update known people"
  on known_people for update
  to authenticated
  using (true);

create policy "Authenticated users can delete known people"
  on known_people for delete
  to authenticated
  using (true);

-- RLS Policies for health_records
create policy "Authenticated users can view all health records"
  on health_records for select
  to authenticated
  using (true);

create policy "Authenticated users can insert health records"
  on health_records for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update health records"
  on health_records for update
  to authenticated
  using (true);

create policy "Authenticated users can delete health records"
  on health_records for delete
  to authenticated
  using (true);

-- RLS Policies for routines
create policy "Authenticated users can view all routines"
  on routines for select
  to authenticated
  using (true);

create policy "Authenticated users can insert routines"
  on routines for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update routines"
  on routines for update
  to authenticated
  using (true);

create policy "Authenticated users can delete routines"
  on routines for delete
  to authenticated
  using (true);

-- RLS Policies for tasks
create policy "Authenticated users can view all tasks"
  on tasks for select
  to authenticated
  using (true);

create policy "Authenticated users can insert tasks"
  on tasks for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update tasks"
  on tasks for update
  to authenticated
  using (true);

create policy "Authenticated users can delete tasks"
  on tasks for delete
  to authenticated
  using (true);

-- RLS Policies for locations
create policy "Authenticated users can view all locations"
  on locations for select
  to authenticated
  using (true);

create policy "Authenticated users can insert locations"
  on locations for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update locations"
  on locations for update
  to authenticated
  using (true);

create policy "Authenticated users can delete locations"
  on locations for delete
  to authenticated
  using (true);

-- RLS Policies for alerts
create policy "Authenticated users can view all alerts"
  on alerts for select
  to authenticated
  using (true);

create policy "Authenticated users can insert alerts"
  on alerts for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update alerts"
  on alerts for update
  to authenticated
  using (true);

create policy "Authenticated users can delete alerts"
  on alerts for delete
  to authenticated
  using (true);

-- RLS Policies for conversations
create policy "Authenticated users can view all conversations"
  on conversations for select
  to authenticated
  using (true);

create policy "Authenticated users can insert conversations"
  on conversations for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update conversations"
  on conversations for update
  to authenticated
  using (true);

create policy "Authenticated users can delete conversations"
  on conversations for delete
  to authenticated
  using (true);

-- RLS Policies for doctor_contacts
create policy "Authenticated users can view all doctor contacts"
  on doctor_contacts for select
  to authenticated
  using (true);

create policy "Authenticated users can insert doctor contacts"
  on doctor_contacts for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update doctor contacts"
  on doctor_contacts for update
  to authenticated
  using (true);

create policy "Authenticated users can delete doctor contacts"
  on doctor_contacts for delete
  to authenticated
  using (true);

-- ============================================================================
-- SECTION 6: CREATE STORAGE POLICIES (for file uploads)
-- ============================================================================

-- Storage Policies for known_people bucket
create policy "Authenticated users can upload to known_people"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'known_people');

create policy "Authenticated users can view known_people files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'known_people');

create policy "Authenticated users can update known_people files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'known_people');

create policy "Authenticated users can delete known_people files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'known_people');

-- Storage Policies for health_records bucket
create policy "Authenticated users can upload to health_records"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'health_records');

create policy "Authenticated users can view health_records files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'health_records');

create policy "Authenticated users can update health_records files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'health_records');

create policy "Authenticated users can delete health_records files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'health_records');

-- Storage Policies for voice_records bucket
create policy "Authenticated users can upload to voice_records"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'voice_records');

create policy "Authenticated users can view voice_records files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'voice_records');

create policy "Authenticated users can update voice_records files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'voice_records');

create policy "Authenticated users can delete voice_records files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'voice_records');

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- All tables, buckets, and policies have been created.
-- You can now use the NeuroLink Family Dashboard.
-- ============================================================================
