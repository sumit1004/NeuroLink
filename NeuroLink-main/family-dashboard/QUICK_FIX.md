# Quick Fix for 400 Errors and Storage RLS Policy Errors

If you're getting 400 errors or "new row violates row-level security policy" errors when uploading files, follow these steps:

## IMMEDIATE FIX (Run this first!)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open and run the file: `fix-storage-policies.sql`
3. This will fix all storage policies at once

This should resolve the storage upload errors immediately.

## Step 1: Verify Storage Buckets Exist

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Check if these buckets exist:
   - `known_people`
   - `health_records`
   - `voice_records`

If they don't exist:
- Go to **Storage** → Click **New bucket**
- Create each bucket with the exact names above
- Set them as **Private** (not public)

## Step 2: Apply RLS Policies

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the entire `supabase-schema.sql` file (or at least the RLS policies section starting from line 93)

## Step 3: Verify Storage Policies

1. Go to **Storage** → Select a bucket (e.g., `known_people`)
2. Click on **Policies** tab
3. You should see policies like:
   - "Authenticated users can upload to known_people"
   - "Authenticated users can view known_people files"
   - "Authenticated users can update known_people files"
   - "Authenticated users can delete known_people files"

If policies are missing, run the storage policies section from `supabase-schema.sql` (lines 310-371).

## Step 4: Test

1. Make sure you're logged in
2. Configure a patient first (Patient Config tab)
3. Try uploading a file again

## Common Issues:

- **400 Bad Request**: Usually means bucket doesn't exist or policies aren't set
- **403 Forbidden**: RLS policies are blocking access
- **Storage bucket not found**: Bucket needs to be created manually or via SQL

## Manual Bucket Creation (Alternative)

If SQL doesn't work, create buckets manually:
1. Storage → New bucket
2. Name: `known_people` → Create
3. Repeat for `health_records` and `voice_records`
4. Then run the storage policies SQL

