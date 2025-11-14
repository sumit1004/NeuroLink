# NeuroLink Family Dashboard - Setup Instructions

## Quick Setup Guide

### 1. Supabase Configuration

#### Disable Email Confirmation (Recommended for Family Dashboard)

Since family members will share credentials, email confirmation can be disabled:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings** (or **Auth** → **Configuration**)
4. Find **"Enable email confirmations"** or **"Confirm email"** setting
5. **Disable** this option
6. Save the changes

**Alternative:** If you want to keep email confirmation enabled, users will need to:
- Check their email after signup
- Click the confirmation link
- Then they can log in

#### Enable Email Provider

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Configure email templates if needed (optional)

### 2. Database Setup

Run the SQL script in your Supabase SQL Editor:

1. Go to **SQL Editor** in Supabase Dashboard
2. Open `supabase-schema.sql`
3. Copy and paste the entire content
4. Click **Run** to execute

This will create all required tables:
- `profiles`
- `patients`
- `known_people`
- `health_records`
- `routines`
- `tasks`
- `locations`
- `alerts`
- `conversations`
- `doctor_contacts`

### 3. Storage Buckets Setup

The SQL script also creates storage buckets, but you may need to set up policies:

1. Go to **Storage** in Supabase Dashboard
2. Verify these buckets exist:
   - `known_people`
   - `health_records`
   - `voice_records`

3. For each bucket, set up policies:
   - Go to **Policies** tab
   - Create a policy that allows authenticated users to:
     - **SELECT** (read)
     - **INSERT** (upload)
     - **UPDATE** (modify)
     - **DELETE** (remove)

Example policy SQL:
```sql
-- Allow authenticated users to read/write their own files
CREATE POLICY "Authenticated users can manage files"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id IN ('known_people', 'health_records', 'voice_records'));
```

### 4. Row Level Security (RLS)

Make sure RLS is enabled on tables and policies are set:

The `supabase-schema.sql` includes basic RLS policies, but you may need to adjust them based on your needs.

### 5. Configure Supabase Credentials

The credentials are already configured in `js/supabase.js`, but if you need to change them:

1. Open `js/supabase.js`
2. Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` with your project values
3. Or set them as window variables before loading the scripts

### 6. Running the Dashboard

1. Serve the files using any static file server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js (npx serve)
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

2. Open `signup.html` in your browser
3. Create the first family account
4. Share credentials with family members
5. They can log in using `login.html`

## Troubleshooting

### "Email not confirmed" Error

**Solution 1 (Recommended):** Disable email confirmation in Supabase Dashboard (see step 1 above)

**Solution 2:** Users must check their email and click the confirmation link before logging in. The login page now includes a "Resend Confirmation Email" button.

### Storage Upload Errors

- Check that storage buckets exist
- Verify storage policies allow authenticated users
- Check browser console for specific error messages

### Database Errors

- Ensure all tables are created (run `supabase-schema.sql`)
- Check RLS policies allow authenticated users to read/write
- Verify the `profiles` table has a row for the logged-in user

### Authentication Issues

- Verify Supabase URL and anon key are correct
- Check that email provider is enabled in Supabase
- Ensure email confirmation is disabled (if you want immediate access)

## Security Notes

- The anon key is safe to expose in client-side code
- RLS policies protect your data at the database level
- Never expose your service role key in client code
- Consider adding additional RLS policies based on your security requirements

