# Supabase Setup Guide

This guide will help you configure Supabase as your database and file storage backend.

## Why Supabase?

- ✅ **Hosted PostgreSQL** - No need to manage database servers
- ✅ **Free Tier** - 500MB database, 1GB file storage
- ✅ **Auto Backups** - Daily backups included
- ✅ **Real-time Features** - Built-in subscriptions (for future features)
- ✅ **File Storage** - Managed storage for resume uploads
- ✅ **Global CDN** - Fast file delivery worldwide
- ✅ **Easy Scaling** - Upgrade as you grow

## Step 1: Create Supabase Project

### 1.1 Sign Up
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email

### 1.2 Create New Project
1. Click "New Project"
2. Fill in details:
   - **Name:** `ai-resume-builder` (or your choice)
   - **Database Password:** Generate strong password (SAVE THIS!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (500MB DB, 1GB storage)
3. Click "Create new project"
4. Wait ~2 minutes for setup

## Step 2: Get Database Connection String

### 2.1 Navigate to Settings
1. Click the **Settings** icon (⚙️) in left sidebar
2. Click **Database**

### 2.2 Copy Connection String
1. Scroll to **Connection String** section
2. Select **URI** tab (not Prisma)
3. Copy the connection string - looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with your actual database password

### 2.3 Update .env File
```bash
# In your .env file:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
```

**Important:** Use the actual password, not `[YOUR-PASSWORD]`

## Step 3: Create Database Tables

Run Prisma migration to create all tables in Supabase:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Confirm when prompted
```

You should see:
```
✔ Generated Prisma Client
🚀 Your database is now in sync with your Prisma schema.
```

## Step 4: Verify Database

### Option 1: Prisma Studio
```bash
npx prisma studio
```
Opens at http://localhost:5555 - you should see all tables

### Option 2: Supabase Dashboard
1. Go to Supabase Dashboard
2. Click **Table Editor** in left sidebar
3. You should see all your tables:
   - User
   - Profile
   - Application
   - MockInterview
   - Job
   - JobMatch
   - JobAlertPreferences
   - Document
   - ApiUsage
   - etc.

## Step 5: (Optional) Configure File Storage

Instead of storing uploaded files locally, use Supabase Storage.

### 5.1 Create Storage Bucket
1. In Supabase Dashboard, click **Storage**
2. Click "Create a new bucket"
3. Name: `resumes`
4. Public: ✅ (check this - files need to be accessible)
5. Click "Create bucket"

### 5.2 Get API Keys
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://xxxxxxxxxxxxx.supabase.co`
   - **anon public:** `eyJhbG...` (safe to expose in frontend)
   - **service_role:** `eyJhbG...` (KEEP SECRET!)

### 5.3 Update .env
```bash
# Add these to .env:
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 5.4 Install Dependency
```bash
npm install @supabase/supabase-js
```

**Note:** File storage service is already implemented - it will automatically use Supabase when these env vars are set!

## Step 6: Test Connection

### 6.1 Start Development Server
```bash
npm run dev
```

### 6.2 Test Database
1. Navigate to http://localhost:3000
2. Sign up for an account
3. Upload a resume
4. Check Supabase Dashboard → Table Editor → User table
5. You should see your new user!

### 6.3 Test File Upload (if configured)
1. Upload a resume
2. Check Supabase Dashboard → Storage → resumes bucket
3. You should see the uploaded file

## Connection Details

### Database Connection
- **Provider:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Location:** Cloud (Supabase servers)
- **Access:** Via DATABASE_URL connection string

### File Storage
- **With Supabase Storage:** Files stored in Supabase Cloud
- **Without Supabase Storage:** Files stored locally in `/uploads/`
- **Switching:** Automatic based on env vars

## Environment Variables Summary

### Required (Database Only)
```bash
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"
```

### Optional (File Storage)
```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
```

## Supabase Dashboard Features

### 1. Table Editor
- View all data
- Edit records
- Add/delete rows
- SQL queries

### 2. Storage
- Browse uploaded files
- Download files
- Delete files
- View file URLs

### 3. SQL Editor
- Run custom queries
- Save queries
- View query history

### 4. Database
- Connection pooling
- Backups
- Usage stats
- Connection strings

### 5. Logs
- Database logs
- API logs
- Error tracking

## Data Migration

### From Local PostgreSQL to Supabase

If you have existing data:

```bash
# 1. Export from local database
pg_dump $OLD_DATABASE_URL > backup.sql

# 2. Update DATABASE_URL to Supabase

# 3. Import to Supabase
psql $DATABASE_URL < backup.sql
```

### From Supabase to Local

```bash
# 1. Export from Supabase
pg_dump $DATABASE_URL > supabase-backup.sql

# 2. Update DATABASE_URL to local

# 3. Import to local
psql $DATABASE_URL < supabase-backup.sql
```

## Free Tier Limits

- **Database:** 500MB
- **Storage:** 1GB
- **Bandwidth:** 2GB/month
- **API Requests:** 50,000/month
- **Concurrent Connections:** 60

**Upgrading:**
- Pro: $25/month (8GB DB, 100GB storage)
- Team: $599/month (Unlimited)

## Security Best Practices

### 1. Database Password
- ✅ Use strong password (20+ characters)
- ✅ Store in .env, never commit
- ✅ Different password for production

### 2. API Keys
- ✅ `anon key` - safe for frontend (read-only)
- ❌ `service_role key` - NEVER expose in frontend
- ✅ Store service_role in .env only

### 3. Row Level Security (RLS)
Supabase recommends enabling RLS for production:

```sql
-- Enable RLS on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own data
CREATE POLICY "Users can view own data"
  ON "User"
  FOR SELECT
  USING (auth.uid() = id);
```

**Note:** RLS is optional for this app since we use NextAuth for authentication.

## Troubleshooting

### Connection Refused
- ✅ Check DATABASE_URL is correct
- ✅ Verify password has no special chars that need escaping
- ✅ Check Supabase project is not paused (free tier pauses after 7 days inactivity)

### Tables Not Created
```bash
# Reset and recreate
npx prisma db push --force-reset

# Or migrate
npx prisma migrate dev --name init
```

### File Upload Fails
- ✅ Check bucket is created
- ✅ Verify bucket is public
- ✅ Check API keys are correct
- ✅ Ensure service_role key (not anon key) is used for uploads

### Can't See Data
- ✅ Use Prisma Studio: `npx prisma studio`
- ✅ Or Supabase Dashboard → Table Editor
- ✅ Check you're looking at correct project

## Performance Tips

### 1. Connection Pooling
Supabase includes connection pooling. For high traffic:

```bash
# Use pooled connection (port 6543 instead of 5432)
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
```

### 2. Indexes
Add indexes for frequently queried fields:

```sql
-- Index on email for faster user lookups
CREATE INDEX idx_user_email ON "User"(email);

-- Index on userId for faster profile lookups
CREATE INDEX idx_profile_user_id ON "Profile"("userId");
```

### 3. Caching
Consider adding Redis/Upstash for caching frequent queries.

## Backup Strategy

### Automatic Backups
Supabase automatically backs up:
- **Free tier:** Daily backups (7 days retention)
- **Pro tier:** Daily backups (30 days retention)

### Manual Backup
```bash
# Create manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Compress backup
gzip backup-$(date +%Y%m%d).sql
```

### Restore from Backup
```bash
# Restore from backup
psql $DATABASE_URL < backup.sql
```

## Monitoring

### Supabase Dashboard
1. **Database Usage:** Settings → Usage
2. **API Requests:** Settings → Usage → API
3. **Storage:** Settings → Usage → Storage

### Alerts
Set up alerts for:
- Database size approaching limit
- High API usage
- Storage approaching limit

## Next Steps

After setup:
1. ✅ Database connected to Supabase
2. ✅ Tables created
3. ✅ Can view data in Supabase Dashboard
4. ✅ (Optional) File storage configured

Now you can:
- Deploy to Vercel/Netlify (set DATABASE_URL in deployment)
- Access database from anywhere
- Scale as needed
- Monitor usage in dashboard

## Support

- **Supabase Docs:** https://supabase.com/docs
- **Community:** https://github.com/supabase/supabase/discussions
- **Status:** https://status.supabase.com

---

**🎉 You're all set! Your data is now stored in Supabase.**
