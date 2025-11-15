-- ============================================================================
-- NeuroLink Family Dashboard - Schema Fix for known_people table
-- ============================================================================
-- Run this script if you get "Could not find column" errors
-- This recreates the known_people table with all required columns

-- Step 1: Drop the old table (if it exists and you want to start fresh)
-- Uncomment the line below ONLY if you want to delete all known_people data
-- drop table if exists known_people cascade;

-- Step 2: Create the table with all columns properly defined
create table if not exists known_people (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(id) on delete cascade,
  name text not null,
  relation text,
  photo_url text,
  notes text,
  created_at timestamptz default now()
);

-- Step 3: Ensure all columns exist (safe for existing tables)
alter table known_people add column if not exists id uuid default gen_random_uuid();
alter table known_people add column if not exists patient_id uuid references patients(id) on delete cascade;
alter table known_people add column if not exists name text;
alter table known_people add column if not exists relation text;
alter table known_people add column if not exists photo_url text;
alter table known_people add column if not exists notes text;
alter table known_people add column if not exists created_at timestamptz default now();

-- Step 4: Enable RLS
alter table known_people enable row level security;

-- Step 5: Create RLS policies
-- Delete existing policies first if you get conflicts
create policy "Authenticated users can view all known people"
  on known_people for select to authenticated using (true);

create policy "Authenticated users can insert known people"
  on known_people for insert to authenticated with check (true);

create policy "Authenticated users can update known people"
  on known_people for update to authenticated using (true);

create policy "Authenticated users can delete known people"
  on known_people for delete to authenticated using (true);

-- Step 6: Make storage bucket public
do $$
begin
  -- Update known_people bucket to public
  update storage.buckets 
  set public = true 
  where id = 'known_people';
  
  -- If bucket doesn't exist, create it
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('known_people', 'known_people', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  on conflict (id) do update set public = true;
end $$;

-- Step 7: Create storage policies for public access
create policy "Public can view known_people files"
  on storage.objects for select using (bucket_id = 'known_people');

create policy "Authenticated users can upload to known_people"
  on storage.objects for insert to authenticated with check (bucket_id = 'known_people');

create policy "Authenticated users can delete known_people files"
  on storage.objects for delete to authenticated using (bucket_id = 'known_people');
