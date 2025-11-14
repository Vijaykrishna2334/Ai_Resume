# AI Resume Builder - Technical Architecture

**Version:** 1.0
**Last Updated:** 2025-11-14

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  (Next.js 14 App Router + React + TypeScript + Tailwind)    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS / WebSocket
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      API Layer (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth API   │  │  Profile API │  │  Docs API    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │           Middleware Layer                          │    │
│  │  • Authentication (NextAuth)                        │    │
│  │  • Rate Limiting                                    │    │
│  │  • Input Validation (Zod)                           │    │
│  │  • Error Handling                                   │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼────────┐ ┌────▼─────────┐ ┌───▼──────────┐
│  Service Layer │ │ Database     │ │  External    │
│                │ │ (PostgreSQL) │ │  Services    │
│ • ResumeParser │ │              │ │              │
│ • Optimizer    │ │ • Prisma ORM │ │ • OpenAI API │
│ • PDFGenerator │ │              │ │ • S3 Storage │
│ • PortfolioGen │ │              │ │ • SendGrid   │
└────────────────┘ └──────────────┘ └──────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Next.js 14** | React framework | SSR, API routes, file-based routing, excellent DX |
| **TypeScript** | Type safety | Catch errors early, better IDE support |
| **Tailwind CSS** | Styling | Rapid UI development, consistent design |
| **shadcn/ui** | Component library | Beautiful, accessible, customizable components |
| **React Hook Form** | Form management | Performance, validation, better UX |
| **Zod** | Schema validation | Type-safe validation, works with RHF |
| **Zustand** | State management | Lightweight, simple API, better than Redux |
| **TanStack Query** | Data fetching | Caching, optimistic updates, auto-refetch |

### Backend
| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Next.js API Routes** | Backend API | Monorepo, same codebase as frontend |
| **Prisma** | ORM | Type-safe queries, migrations, excellent DX |
| **PostgreSQL** | Database | Robust, JSONB support, full-text search |
| **NextAuth.js** | Authentication | Built for Next.js, supports multiple providers |
| **bcryptjs** | Password hashing | Industry standard, secure |

### AI & Processing
| Technology | Purpose | Justification |
|------------|---------|---------------|
| **OpenAI API** | LLM integration | GPT-4 for parsing, analysis, generation |
| **pdf-parse** | PDF parsing | Lightweight, Node.js native |
| **mammoth.js** | DOCX parsing | Clean text extraction |
| **puppeteer** | PDF generation | Headless Chrome, perfect for HTML→PDF |

### Infrastructure
| Technology | Purpose | Justification |
|------------|---------|---------------|
| **Vercel** | Hosting | Optimized for Next.js, edge functions |
| **Supabase** | Database hosting | Free tier, great DX, built-in auth option |
| **AWS S3** | File storage | Scalable, cheap, industry standard |
| **SendGrid** | Email service | Reliable, good free tier |
| **Sentry** | Error tracking | Best-in-class error monitoring |

---

## System Design Patterns

### 1. Service Layer Pattern

All business logic lives in services, not API routes.

```
src/lib/services/
├── resume-parser.ts      # Resume parsing logic
├── optimizer.ts          # JD analysis & suggestions
├── pdf-generator.ts      # PDF creation
├── portfolio-generator.ts # Portfolio site generation
├── interview-bot.ts      # Mock interview logic
└── email-service.ts      # Email sending
```

**Benefits:**
- Easy to test (mock database)
- Reusable across API routes
- Clear separation of concerns

### 2. Repository Pattern

Database access abstracted into repositories.

```typescript
// src/lib/repositories/profile-repository.ts
export class ProfileRepository {
  async findByUserId(userId: string) {
    return prisma.profile.findUnique({ where: { userId } });
  }

  async update(userId: string, data: ProfileData) {
    return prisma.profile.update({
      where: { userId },
      data
    });
  }
}
```

**Benefits:**
- Easy to swap database
- Centralized query logic
- Better testing

### 3. DTO Pattern

Data Transfer Objects for API contracts.

```typescript
// src/lib/dto/profile.dto.ts
export interface ProfileDTO {
  id: string;
  summary: string | null;
  skills: string[];
  experience: ExperienceDTO[];
  // No sensitive data
}

export function toProfileDTO(profile: Profile): ProfileDTO {
  return {
    id: profile.id,
    summary: profile.summary,
    skills: profile.skills,
    experience: profile.experience as ExperienceDTO[],
  };
}
```

**Benefits:**
- Hide sensitive fields
- Version API contracts
- Type safety across layers

---

## Data Flow Examples

### Resume Upload Flow

```
1. User uploads PDF via UI
   ↓
2. Frontend sends multipart/form-data to /api/documents/upload
   ↓
3. API validates file (type, size)
   ↓
4. Save file to S3 (or local in dev)
   ↓
5. ResumeParser.parseFile(buffer, mimeType)
   ├─ Extract text (pdf-parse or mammoth)
   └─ Structure with OpenAI API
   ↓
6. Save Document record
   ↓
7. Upsert Profile with parsed data
   ↓
8. Return { document, parsed } to frontend
   ↓
9. Frontend redirects to profile editor
```

### Resume Optimization Flow

```
1. User pastes job description
   ↓
2. Frontend calls /api/optimize with JD text
   ↓
3. Fetch user's profile from database
   ↓
4. Optimizer.analyzeJobDescription(jd)
   └─ OpenAI extracts skills, keywords, requirements
   ↓
5. Optimizer.calculateMatchScore(profile, jdAnalysis)
   └─ Compare user skills vs job skills
   ↓
6. Optimizer.generateSuggestions(profile, jdAnalysis)
   └─ OpenAI suggests improvements
   ↓
7. Save Application record (if company/position provided)
   ↓
8. Return { matchScore, suggestions, analysis }
   ↓
9. Frontend displays results with actionable cards
```

### PDF Resume Generation Flow

```
1. User clicks "Generate Resume"
   ↓
2. Frontend calls /api/documents/generate
   body: { templateStyle: "minimalist", applicationId?: "..." }
   ↓
3. Fetch profile and application (if optimizing for job)
   ↓
4. PDFGenerator.generate(profile, template, jdAnalysis?)
   ├─ Render React component with profile data
   ├─ Use Puppeteer to convert HTML → PDF
   └─ Optimize for ATS (no images, proper headings)
   ↓
5. Upload PDF to S3
   ↓
6. Save Document record
   ↓
7. Return { documentId, downloadUrl }
   ↓
8. Frontend triggers download
```

---

## Database Design

### Key Design Decisions

1. **JSONB for flexible data**
   - Experience, projects, education stored as JSON arrays
   - Allows schema evolution without migrations
   - Still queryable with PostgreSQL JSON operators

2. **Separate tables for core entities**
   - User, Profile, Application, Document, etc.
   - Clear relationships
   - Easy to query and join

3. **Audit trails**
   - createdAt and updatedAt on all tables
   - Soft deletes where appropriate
   - API usage tracking for cost analysis

4. **Indexes**
   ```sql
   -- Frequently queried fields
   CREATE INDEX idx_applications_user_status ON applications(user_id, status);
   CREATE INDEX idx_documents_user_type ON documents(user_id, type);
   CREATE INDEX idx_api_usage_user_date ON api_usage(user_id, created_at);

   -- Full-text search
   CREATE INDEX idx_applications_jd_search ON applications
     USING GIN (to_tsvector('english', job_description));
   ```

---

## Security Architecture

### Authentication Flow

```
1. User signs up
   ↓
2. Hash password with bcrypt (10 rounds)
   ↓
3. Store user record
   ↓
4. User logs in
   ↓
5. Validate credentials
   ↓
6. Generate JWT with NextAuth
   ↓
7. Return session cookie (httpOnly, secure, sameSite)
   ↓
8. Include JWT in all subsequent requests
```

### Data Protection

| Layer | Protection | Implementation |
|-------|------------|----------------|
| **Transport** | HTTPS only | Vercel automatic HTTPS |
| **Storage** | Encryption at rest | PostgreSQL encryption |
| **API** | Rate limiting | Upstash Redis or in-memory |
| **Input** | Validation | Zod schemas |
| **Output** | Sanitization | Strip sensitive fields via DTOs |
| **Files** | Signed URLs | S3 pre-signed URLs with expiry |
| **AI** | Data sanitization | Remove PII before sending to OpenAI |

### Security Checklist

- [x] Use environment variables for secrets
- [x] Validate all inputs with Zod
- [x] Sanitize outputs (no raw database objects)
- [x] Use parameterized queries (Prisma)
- [x] Implement CSRF protection (NextAuth)
- [x] Set security headers (helmet or Next.js config)
- [x] Rate limit API endpoints
- [x] Log security events
- [x] Regular dependency updates
- [x] Principle of least privilege for DB users

---

## Scalability Considerations

### Current Architecture (MVP)

```
Vercel (Serverless) → Supabase PostgreSQL → S3
                   ↘ OpenAI API ↙
```

**Limits:**
- Vercel: 100GB bandwidth/month (Pro)
- Supabase: 8GB database (Pro)
- OpenAI: Rate limits per tier

**Expected capacity:**
- 1,000 active users/month
- 10 resume uploads per user
- 50 optimizations per user
- Estimated cost: $500-800/month

### Scaling Strategy (Future)

#### Phase 1: Vertical Scaling (500-5K users)
- Upgrade Supabase tier
- Add Redis caching (Upstash)
- Implement response caching
- Optimize database queries

#### Phase 2: Horizontal Scaling (5K-50K users)
- Move to AWS/GCP for more control
- Read replicas for database
- CDN for static assets
- Background job queue (BullMQ)

#### Phase 3: Distributed (50K+ users)
- Microservices for heavy operations
- Separate AI service
- Multi-region deployment
- Database sharding by user ID

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API response time | < 500ms (p95) | Vercel Analytics |
| Resume parsing | < 30s | Application logs |
| PDF generation | < 5s | Application logs |
| Match score calculation | < 2s | Application logs |
| Page load (dashboard) | < 2s | Web Vitals |

---

## Monitoring & Observability

### Error Tracking

**Sentry integration:**
```typescript
// src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Remove sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
    }
    return event;
  },
});
```

### Logging Strategy

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: "info", message, ...meta, timestamp: new Date() }));
  },
  error: (message: string, error: any, meta?: any) => {
    console.error(JSON.stringify({
      level: "error",
      message,
      error: error.message,
      stack: error.stack,
      ...meta,
      timestamp: new Date()
    }));

    // Also send to Sentry
    Sentry.captureException(error, { extra: meta });
  },
  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({ level: "warn", message, ...meta, timestamp: new Date() }));
  },
};
```

### Key Metrics to Track

1. **Business Metrics**
   - User signups per day
   - Resume uploads per day
   - Optimizations per user
   - PDF downloads per day
   - Portfolio creations per day

2. **Technical Metrics**
   - API error rate
   - API latency (p50, p95, p99)
   - Database query time
   - AI API success rate
   - File upload success rate

3. **Cost Metrics**
   - AI API cost per user
   - Total AI spend per day
   - Storage cost per GB
   - Bandwidth usage

### Monitoring Dashboard

Use Vercel Analytics + custom dashboard for:
- Real-time error tracking
- API endpoint performance
- User activity heatmap
- Cost tracking per feature
- Conversion funnel (signup → first PDF)

---

## Development Workflow

### Local Development

```bash
# 1. Clone and install
git clone <repo>
cd ai-resume-builder
npm install

# 2. Set up database
docker-compose up -d postgres
npx prisma migrate dev

# 3. Set environment variables
cp .env.example .env.local
# Add OpenAI key, database URL, etc.

# 4. Run dev server
npm run dev
```

### Git Workflow

```
main (production)
  ↑
  │ PR + review
  │
develop (staging)
  ↑
  │ PR + review
  │
feature/user-profile-editor (feature branches)
```

**Branch naming:**
- `feature/<name>` for new features
- `fix/<name>` for bug fixes
- `refactor/<name>` for refactoring
- `docs/<name>` for documentation

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: vercel/actions/deploy@v1
```

---

## API Documentation

### OpenAPI Specification

Use Swagger UI for API docs.

**File:** `src/app/api/docs/route.ts`

```typescript
import { NextResponse } from "next/server";
import { openAPISpec } from "@/lib/openapi";

export async function GET() {
  return NextResponse.json(openAPISpec);
}
```

### Example Endpoint Documentation

```yaml
/api/profile:
  get:
    summary: Get user profile
    security:
      - bearerAuth: []
    responses:
      200:
        description: Profile data
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Profile'
      401:
        description: Unauthorized
      404:
        description: Profile not found

  put:
    summary: Update user profile
    security:
      - bearerAuth: []
    requestBody:
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ProfileUpdate'
    responses:
      200:
        description: Updated profile
      400:
        description: Validation error
      401:
        description: Unauthorized
```

---

## Environment Variables Reference

### Required (Development)

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
OPENAI_API_KEY="sk-..."
```

### Required (Production)

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="..."
OPENAI_API_KEY="sk-..."

AWS_S3_BUCKET="ai-resume-uploads"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"

EMAIL_SERVER="smtp://..."
EMAIL_FROM="noreply@yourdomain.com"

SENTRY_DSN="https://..."
```

### Optional

```env
ANTHROPIC_API_KEY="sk-ant-..." # Alternative to OpenAI
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="15" # minutes
LOG_LEVEL="info"
```

---

## Migration Strategy

### From Mock Data to Real Implementation

Since this is a fresh start, no migration needed. However, for future features:

1. **Database Migrations**
   ```bash
   npx prisma migrate dev --name add_voice_interview
   ```

2. **Code Migrations**
   - Use feature flags for gradual rollout
   - A/B test new AI models
   - Backward compatibility for API changes

3. **Data Migrations**
   - Use Prisma migration scripts
   - Test on staging first
   - Backup before migration

---

## Cost Optimization Strategies

### AI API Costs

1. **Caching**
   ```typescript
   // Cache JD analysis for duplicate job postings
   const cacheKey = `jd:${hash(jobDescription)}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);

   const result = await openai.chat.completions.create(...);
   await redis.set(cacheKey, JSON.stringify(result), { ex: 86400 });
   ```

2. **Model Selection**
   - Use GPT-3.5 for simple tasks (keyword extraction)
   - Use GPT-4 only for complex tasks (cover letters)

3. **Prompt Engineering**
   - Minimize token usage
   - Use structured output (JSON mode)
   - Batch requests where possible

4. **Rate Limiting**
   - Limit optimizations per user per day
   - Throttle resume uploads
   - Queue background jobs

### Infrastructure Costs

1. **File Storage**
   - Delete old uploaded resumes after 30 days
   - Compress PDFs before storage
   - Use lifecycle policies on S3

2. **Database**
   - Archive old applications
   - Regularly vacuum PostgreSQL
   - Use read replicas sparingly

3. **Hosting**
   - Use edge functions for static routes
   - Optimize bundle size
   - Lazy load components

---

## Future Architecture Enhancements

### Voice Interview Feature

```
┌─────────────┐
│   Browser   │
│  (WebRTC)   │
└──────┬──────┘
       │ Audio Stream
       ▼
┌──────────────────┐
│  Audio Service   │
│  • Whisper (STT) │
│  • ElevenLabs    │
└──────┬───────────┘
       │ Text
       ▼
┌──────────────────┐
│  Interview Bot   │
│  • GPT-4 + RAG   │
└──────────────────┘
```

### Job Alert System

```
┌────────────────┐
│  Cron Job      │
│  (daily @ 9am) │
└────┬───────────┘
     │
     ▼
┌────────────────────┐
│  Job Scraper       │
│  • Indeed API      │
│  • LinkedIn Jobs   │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│  Matching Engine   │
│  • Vector search   │
│  • Skill matching  │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│  Email Service     │
│  • SendGrid        │
│  • Template engine │
└────────────────────┘
```

---

**Document Maintained By:** Engineering Team
**Review Cadence:** After each major feature release
