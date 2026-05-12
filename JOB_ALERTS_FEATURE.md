# Automated Job Alerts Feature Documentation

## Overview

The Job Alerts feature automatically searches job portals daily, matches jobs to user profiles using AI, and sends personalized email notifications with the top matches. Users receive curated job opportunities tailored to their skills, experience, and preferences without manual searching.

## Key Features

### 1. **Multi-Source Job Aggregation**
- Fetches jobs from multiple platforms:
  - **Adzuna API** (free tier available)
  - **RapidAPI** (JSearch and other job search APIs)
  - **Demo jobs** (for development/testing)
- Automatic deduplication
- Database persistence for historical tracking

### 2. **AI-Powered Job Matching**
- Uses Google Gemini 2.5 Flash for cost-efficient matching
- Analyzes user profile vs job requirements
- Calculates match scores (0-100)
- Generates detailed match explanations
- Identifies strengths and gaps
- Provides actionable recommendations

### 3. **Personalized Email Notifications**
- Beautiful HTML email templates
- Displays match scores and reasons
- Highlights user strengths for each role
- Includes direct application links
- Customizable delivery time and timezone

### 4. **Smart Scheduling**
- Daily automated job matching
- User-configurable notification time
- Timezone support
- Prevents duplicate sends (20-hour cooldown)
- Tracks last sent timestamp

### 5. **Comprehensive Preferences**
- Desired job titles
- Preferred locations
- Job types (Full-time, Remote, Contract, etc.)
- Experience levels
- Salary range filtering
- Minimum match score threshold
- Maximum jobs per day

## Architecture

### Database Schema

#### JobAlertPreferences
```prisma
model JobAlertPreferences {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])

  enabled           Boolean  @default(true)
  notificationEmail String
  notificationTime  String   // HH:MM format
  timezone          String   @default("UTC")

  maxJobsPerDay     Int      @default(10)
  minMatchScore     Int      @default(70)

  desiredRoles      String[]
  locations         String[]
  jobTypes          String[]
  experienceLevels  String[]
  salaryMin         Int?
  salaryMax         Int?

  lastSentAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

#### Job
```prisma
model Job {
  id              String   @id @default(cuid())

  title           String
  company         String
  location        String?
  jobType         String?
  experienceLevel String?
  description     String   @db.Text
  requirements    String?  @db.Text
  salary          String?

  source          String
  externalId      String
  jobUrl          String

  postedAt        DateTime?
  isActive        Boolean  @default(true)

  matches         JobMatch[]

  @@unique([source, externalId])
}
```

#### JobMatch
```prisma
model JobMatch {
  id          String   @id @default(cuid())
  userId      String
  jobId       String

  matchScore  Int
  matchReason String?  @db.Text

  sentAt      DateTime?
  viewedAt    DateTime?
  appliedAt   DateTime?

  @@unique([userId, jobId])
}
```

### Services

#### 1. JobAggregationService
**Location:** `src/lib/services/job-aggregation.ts`

**Methods:**
- `fetchJobs(params)` - Fetches jobs from all configured sources
- `fetchFromAdzuna(params)` - Adzuna API integration
- `fetchFromRapidAPI(params)` - RapidAPI (JSearch) integration
- `getDemoJobs(params)` - Demo jobs for development
- `saveJobs(jobs)` - Persists jobs to database
- `deduplicateJobs(jobs)` - Removes duplicate listings

**Example Usage:**
```typescript
const aggregation = new JobAggregationService();
const jobs = await aggregation.fetchJobs({
  keywords: ["Software Engineer", "Full Stack Developer"],
  location: "San Francisco",
  jobType: "Full-time",
  maxResults: 50
});
await aggregation.saveJobs(jobs);
```

#### 2. JobMatchingService
**Location:** `src/lib/services/job-matching.ts`

**Methods:**
- `matchUserToJobs(userId, profile, jobs, minScore)` - Matches user to multiple jobs
- `matchSingleJob(profile, job, userId)` - AI-powered single job match
- `saveJobMatches(userId, matches)` - Persists matches
- `getTopMatches(userId, limit)` - Retrieves best matches
- `markMatchesAsSent(matchIds)` - Updates sent status

**AI Matching Logic:**
Uses Gemini 2.5 Flash with structured prompts analyzing:
1. Skills match (technical and soft skills)
2. Experience level and years
3. Industry/domain experience
4. Education requirements
5. Location and job type preferences
6. Career trajectory alignment

**Match Score Guidelines:**
- 90-100: Exceptional fit, highly qualified
- 80-89: Strong fit, very qualified
- 70-79: Good fit, qualified with minor gaps
- 60-69: Moderate fit, some significant gaps
- 50-59: Weak fit, major gaps
- 0-49: Poor fit, not recommended

**Example Usage:**
```typescript
const matching = new JobMatchingService();
const userProfile = {
  summary: "Senior Software Engineer with 8 years experience",
  skills: ["React", "Node.js", "TypeScript"],
  experience: [...],
  education: [...],
  desiredRoles: ["Senior Software Engineer"],
  locations: ["Remote"],
  jobTypes: ["Full-time"]
};

const matches = await matching.matchUserToJobs(
  userId,
  userProfile,
  jobs,
  70 // minimum score
);

await matching.saveJobMatches(userId, matches);
```

#### 3. EmailNotificationService
**Location:** `src/lib/services/email-notification.ts`

**Email Providers Supported:**
- **Resend** (recommended) - Free tier: 100 emails/day
- **SendGrid** - Enterprise solution
- **Console fallback** - Development mode

**Methods:**
- `sendJobMatchesEmail(data)` - Sends formatted job matches
- `sendViaResend(data)` - Resend API integration
- `sendViaSendGrid(data)` - SendGrid API integration
- `generateEmailHTML(data)` - Creates beautiful HTML email
- `sendTestEmail(email)` - Test email delivery

**Email Template Features:**
- Responsive design
- Match score badges
- Job metadata (location, type, salary)
- Match reasoning and strengths
- Direct application CTAs
- Footer with preference links

**Example Usage:**
```typescript
const emailService = new EmailNotificationService();
await emailService.sendJobMatchesEmail({
  userEmail: "user@example.com",
  userName: "John Doe",
  matches: [{
    job: {...},
    matchScore: 92,
    matchReason: "Perfect skill alignment",
    strengths: ["5+ years React", "TypeScript expert"],
    gaps: []
  }]
});
```

### API Endpoints

#### POST /api/job-alerts/preferences
Create or update job alert preferences

**Request Body:**
```json
{
  "enabled": true,
  "notificationEmail": "user@example.com",
  "notificationTime": "09:00",
  "timezone": "America/New_York",
  "maxJobsPerDay": 10,
  "minMatchScore": 70,
  "desiredRoles": ["Software Engineer", "Full Stack Developer"],
  "locations": ["Remote", "San Francisco"],
  "jobTypes": ["Full-time", "Contract"],
  "experienceLevels": ["Mid-level", "Senior"],
  "salaryMin": 100000,
  "salaryMax": 180000
}
```

**Response:**
```json
{
  "success": true,
  "preferences": {...}
}
```

#### GET /api/job-alerts/preferences
Get user's current preferences

**Response:**
```json
{
  "preferences": {...}
}
```

#### POST /api/job-alerts/trigger
Manually trigger job matching (for testing)

**Response:**
```json
{
  "success": true,
  "jobsFetched": 45,
  "jobsMatched": 12,
  "topMatches": 10,
  "emailSent": true,
  "matches": [...]
}
```

#### GET /api/job-alerts/matches
Get user's job matches

**Query Parameters:**
- `limit` (default: 20) - Number of matches to return
- `includeViewed` (default: false) - Include already viewed matches

**Response:**
```json
{
  "success": true,
  "total": 15,
  "matches": [
    {
      "id": "clx...",
      "matchScore": 92,
      "matchReason": "Your extensive React experience...",
      "sentAt": "2025-11-16T10:00:00Z",
      "viewedAt": null,
      "job": {
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        ...
      }
    }
  ]
}
```

#### POST /api/job-alerts/matches/[id]/applied
Mark a job match as applied

**Request Body:**
```json
{
  "createApplication": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Marked as applied"
}
```

### Cron Job Scheduler

#### GET /api/cron/job-alerts
Automated job alerts processing endpoint

**Authentication:**
Requires `Authorization: Bearer {CRON_SECRET}` header

**How it works:**
1. Finds all users with enabled job alerts
2. Checks if it's time to send alerts (based on notificationTime)
3. Prevents duplicate sends (20-hour cooldown)
4. For each eligible user:
   - Fetches jobs matching their preferences
   - Runs AI matching against user profile
   - Filters by minimum match score
   - Takes top N matches (maxJobsPerDay)
   - Sends email notification
   - Marks matches as sent
   - Updates lastSentAt timestamp

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-11-16T10:00:00Z",
  "totalUsersWithAlerts": 50,
  "usersProcessed": 12,
  "processedUsers": ["user1@example.com", ...],
  "errors": []
}
```

#### Deployment Options

**Option 1: Vercel Cron (Recommended for Vercel deployments)**

Configuration in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/job-alerts",
      "schedule": "0 * * * *"
    }
  ]
}
```

Runs every hour automatically. No additional setup required.

**Option 2: GitHub Actions**

Configuration in `.github/workflows/job-alerts-cron.yml`:
```yaml
name: Job Alerts Cron
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  trigger-job-alerts:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Job Alerts
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            ${{ secrets.APP_URL }}/api/cron/job-alerts
```

**Required GitHub Secrets:**
- `CRON_SECRET` - Matches your .env CRON_SECRET
- `APP_URL` - Your deployed application URL

**Option 3: External Cron Services**

Use services like:
- **Cron-job.org** (free tier available)
- **EasyCron**
- **Crony** (cron-job.org)

Setup:
1. Create a cron job pointing to your endpoint
2. Add `Authorization: Bearer {CRON_SECRET}` header
3. Set schedule to run hourly: `0 * * * *`

## Setup Guide

### 1. Environment Variables

Add to `.env`:

```bash
# Required: Gemini API (already configured)
GEMINI_API_KEY="your-key"

# Required: Email Provider (choose one)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# OR

SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# Required: Cron Security
CRON_SECRET="generate-random-secret-here"

# Optional: Job Search APIs (uses demo jobs if not configured)
ADZUNA_APP_ID="your-app-id"
ADZUNA_API_KEY="your-api-key"
ADZUNA_COUNTRY="us"

RAPIDAPI_KEY="your-rapidapi-key"
```

### 2. Database Migration

Run Prisma migration:

```bash
npx prisma db push
# OR
npx prisma migrate dev --name add_job_alerts
```

### 3. Email Provider Setup

**Resend (Recommended):**
1. Sign up at https://resend.com
2. Free tier: 100 emails/day, 3,000/month
3. Add and verify your domain
4. Generate API key
5. Add to `.env`

**SendGrid:**
1. Sign up at https://sendgrid.com
2. Verify sender email/domain
3. Generate API key
4. Add to `.env`

### 4. Job Search APIs (Optional)

**Adzuna:**
1. Sign up at https://developer.adzuna.com
2. Create application
3. Get App ID and API Key
4. Free tier: 500 calls/month
5. Add to `.env`

**RapidAPI (JSearch):**
1. Sign up at https://rapidapi.com
2. Subscribe to JSearch API
3. Free tier: 100 requests/month
4. Get API key
5. Add to `.env`

**Note:** If no job APIs are configured, the system uses demo jobs for testing.

### 5. Cron Setup

Choose one option:

**Vercel (automatic):**
- Deploy to Vercel
- Cron automatically configured via `vercel.json`
- No additional setup needed

**GitHub Actions:**
1. Add repository secrets:
   - `CRON_SECRET`
   - `APP_URL`
2. Push `.github/workflows/job-alerts-cron.yml`
3. Verify workflow runs

**External Service:**
1. Create cron job at chosen service
2. URL: `{YOUR_APP_URL}/api/cron/job-alerts`
3. Method: GET or POST
4. Header: `Authorization: Bearer {CRON_SECRET}`
5. Schedule: `0 * * * *` (hourly)

## User Guide

### Setting Up Job Alerts

1. Navigate to **Dashboard → Job Alerts**
2. Configure preferences:
   - **Email:** Where to receive alerts
   - **Time:** When to receive daily alerts (with timezone)
   - **Max Jobs:** How many matches to receive (1-50)
   - **Min Score:** Minimum match percentage (50-100%)
3. Add job preferences:
   - **Job Titles:** Desired roles
   - **Locations:** Preferred locations (including "Remote")
   - **Job Types:** Full-time, Part-time, Contract, etc.
   - **Experience:** Entry, Mid-level, Senior, Lead
   - **Salary Range:** Optional min/max
4. Click **Save Preferences**
5. Test with **Find Jobs Now** button

### How Matching Works

The AI analyzes your:
1. **Resume/Profile:**
   - Summary
   - Skills (technical and soft)
   - Work experience
   - Education
   - Projects

2. **Job Posting:**
   - Title and description
   - Requirements
   - Company and location
   - Experience level

3. **Match Calculation:**
   - Skills alignment
   - Experience fit
   - Education requirements
   - Location match
   - Job type preferences
   - Salary expectations

4. **Results:**
   - Match score (0-100%)
   - Why it's a match
   - Your strengths for this role
   - Gaps to address
   - Recommendations

### Email Notifications

You'll receive daily emails with:
- Top matched jobs (based on your maxJobsPerDay setting)
- Match scores and reasons
- Your strengths highlighted
- Job details (location, type, salary)
- Direct apply links
- Tips and advice

Only jobs meeting your minimum match score are sent.

### Tracking Applications

1. View matches in **Dashboard → Job Alerts**
2. Click job to view details
3. Apply through job portal
4. Mark as applied to track progress
5. Optional: Create application record

## Cost Analysis

### Per User Per Month (10 jobs/day)

**AI Matching (Gemini 2.5 Flash):**
- ~300 jobs matched/month
- ~1.5M tokens/month
- Cost: ~$0.11/month

**Email (Resend Free Tier):**
- 30 emails/month
- Free tier: 100 emails/day
- Cost: $0.00

**Job APIs:**
- Adzuna: Free tier (500 calls/month)
- RapidAPI: Free tier (100 requests/month)
- Cost: $0.00 (with free tiers)

**Total: ~$0.11/user/month** (using free email tier)

### Scaling to 1,000 Users

**AI Matching:**
- 300,000 matches/month
- ~1.5B tokens/month
- Cost: ~$110/month

**Email (Resend paid):**
- 30,000 emails/month
- Resend: $20/month (50k emails)
- Cost: $20/month

**Job APIs:**
- Need paid plans
- Estimated: $50/month

**Total: ~$180/month for 1,000 users**
**Per user: ~$0.18/month**

## Best Practices

### For Users

1. **Complete Your Profile:**
   - Add detailed work experience
   - List all relevant skills
   - Include education and certifications

2. **Be Specific with Preferences:**
   - Use exact job titles (e.g., "Senior Software Engineer" not just "Engineer")
   - Specify locations clearly
   - Set realistic salary ranges

3. **Adjust Match Score:**
   - Start with 70% minimum
   - Increase to 80%+ if receiving too many matches
   - Decrease to 60% if not getting enough matches

4. **Review Regularly:**
   - Check emails daily
   - Update preferences as your search evolves
   - Track which jobs you apply to

### For Developers

1. **Rate Limiting:**
   - Implement rate limits on job search APIs
   - Cache job listings to reduce API calls
   - Use demo jobs during development

2. **Error Handling:**
   - Log all cron job failures
   - Retry failed email sends
   - Alert on critical errors

3. **Performance:**
   - Index database tables (userId, matchScore, sentAt)
   - Batch process users in groups
   - Use database connection pooling

4. **Monitoring:**
   - Track email delivery rates
   - Monitor API usage and costs
   - Alert on job aggregation failures
   - Log match score distributions

## Troubleshooting

### Emails Not Sending

1. **Check email provider configuration:**
   ```bash
   # Test email sending
   POST /api/job-alerts/trigger
   # Check response for emailSent: true/false
   ```

2. **Verify environment variables:**
   - RESEND_API_KEY or SENDGRID_API_KEY
   - FROM_EMAIL configured and verified

3. **Check spam folder:**
   - Emails may be filtered
   - Verify sender domain authentication

### No Job Matches Found

1. **Broaden search criteria:**
   - Reduce minimum match score
   - Add more desired roles
   - Include more locations

2. **Check job APIs:**
   - Verify API keys are valid
   - Check quota limits
   - Review API response logs

3. **Use demo jobs for testing:**
   - Remove API keys temporarily
   - System will use built-in demo jobs

### Cron Not Running

1. **Vercel:**
   - Check Vercel dashboard → Cron Jobs
   - Verify deployment includes vercel.json
   - Check cron execution logs

2. **GitHub Actions:**
   - Verify workflow file is in `.github/workflows/`
   - Check Actions tab for execution history
   - Verify secrets are configured

3. **External Service:**
   - Check service dashboard for execution history
   - Verify endpoint URL is correct
   - Check authorization header

### Duplicate Emails

The system prevents duplicates with:
- 20-hour cooldown between sends
- lastSentAt timestamp tracking
- Time window matching (60-minute window)

If receiving duplicates:
1. Check cron running frequency
2. Verify lastSentAt updates in database
3. Check timezone settings

## Future Enhancements

Planned improvements:

1. **Advanced Matching:**
   - Company culture fit analysis
   - Career growth potential scoring
   - Salary negotiation insights

2. **More Job Sources:**
   - LinkedIn integration
   - Indeed scraping
   - Glassdoor integration
   - Company career pages

3. **Smart Notifications:**
   - Real-time alerts for perfect matches
   - Weekly summary emails
   - SMS/Slack notifications

4. **Analytics:**
   - Application success rates
   - Match quality feedback
   - Interview conversion tracking

5. **AI Enhancements:**
   - Auto-apply to selected jobs
   - Cover letter generation
   - Application status tracking
   - Interview scheduling assistance

## Support

For issues or questions:
1. Check this documentation
2. Review environment variable configuration
3. Check application logs
4. Test with "Find Jobs Now" button
5. Verify email delivery with test email endpoint

## License

Part of the AI Resume Builder application.
