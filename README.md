# AI Resume Builder

**Status:** V1 MVP Implemented ✅
**Latest Feature:** Automated Daily Job Alerts 🔔

---

## Overview

AI Resume Builder is a comprehensive platform that helps job seekers:
- Upload and parse existing resumes (PDF/DOCX)
- Optimize resumes for specific job descriptions using AI
- Generate ATS-friendly PDF resumes and cover letters
- Create professional portfolio websites
- Practice interviews with AI-powered mock interviews (text & voice)
- Get voice coaching with detailed speaking metrics and feedback
- **NEW: Receive personalized job matches via email daily**

---

## Quick Links

### 📋 Documentation

1. **[SETUP.md](./SETUP.md)** - START HERE
   - Environment setup instructions
   - Database configuration
   - API key setup (Gemini)
   - Running the application

2. **[JOB_ALERTS_FEATURE.md](./JOB_ALERTS_FEATURE.md)** - NEW!
   - Automated job matching documentation
   - Multi-source job aggregation
   - AI-powered matching system
   - Email notifications setup
   - Cron scheduler configuration
   - Complete API reference

3. **[VOICE_INTERVIEW_FEATURE.md](./VOICE_INTERVIEW_FEATURE.md)**
   - Complete voice interview documentation
   - Technical implementation details
   - API specifications
   - Usage guide and best practices
   - Troubleshooting

4. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)**
   - Complete feature overview
   - All implemented endpoints
   - Service architecture
   - Component structure

5. **[GEMINI_MIGRATION.md](./GEMINI_MIGRATION.md)**
   - Migration from OpenAI to Gemini
   - Cost comparisons
   - Performance benchmarks
   - Rollback instructions

### 📋 Planning Documents (Historical)

1. **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)**
2. **[PRD_GAP_ANALYSIS.md](./PRD_GAP_ANALYSIS.md)**
3. **[IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)**
4. **[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)**

---

## Technology Stack

**Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
**Backend:** Next.js API Routes, Prisma ORM
**Database:** PostgreSQL
**AI:** Google Gemini (Gemini 2.5 Flash + Gemini 2.5 Pro)
**Voice:** Web Speech API (SpeechRecognition + SpeechSynthesis)
**Storage:** AWS S3 (future)
**Hosting:** Vercel
**Auth:** NextAuth.js with JWT

---

## Development Timeline

**Total:** 10 weeks for V1 MVP

- **Week 1-2:** Foundation (Auth + Database)
- **Week 2-3:** Core Backend API
- **Week 3-4:** Resume Parsing
- **Week 4-5:** AI Optimization
- **Week 5-6:** Profile Management UI
- **Week 6-7:** PDF Generation
- **Week 7-8:** Portfolio Generation
- **Week 8-9:** Mock Interview
- **Week 9-10:** Polish & Testing

---

## Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd Ai_Resume

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add:
# - DATABASE_URL (PostgreSQL connection string)
# - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)
# - NEXTAUTH_URL (http://localhost:3000)
# - GEMINI_API_KEY (get from Google AI Studio)

# 4. Set up database
npx prisma generate
npx prisma db push

# 5. Start development server
npm run dev

# 6. Open browser
# Navigate to http://localhost:3000
```

For detailed setup instructions, see [SETUP.md](./SETUP.md)

---

## Project Structure (After Setup)

```
ai-resume-builder/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── auth/             # Auth pages
│   │   ├── dashboard/        # Main dashboard
│   │   └── profile/          # Profile editor
│   ├── components/           # React components
│   ├── lib/
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Database access
│   │   ├── validations/      # Zod schemas
│   │   ├── auth.ts           # NextAuth config
│   │   └── prisma.ts         # Prisma client
│   └── types/                # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
├── public/                   # Static files
└── docs/                     # Documentation
```

---

## Cost Estimates

### Development
- **Timeline:** 10 weeks (solo) or 6 weeks (team of 2)
- **Effort:** 400-600 hours

### Infrastructure (Monthly)

**Development:**
- Vercel: $0 (Hobby)
- Supabase: $0 (Free tier)
- Gemini: $0 (Generous free tier - 1,500 requests/day)
- **Total: ~$0/month**

**Production (1K users):**
- Vercel: $20
- Supabase: $25
- Gemini: $20-50 (70% cheaper than OpenAI)
- S3 + SendGrid + Sentry: $35
- **Total: $100-130/month**

**Per User:** $0.20-0.40 (58% cost reduction)

---

## Current Status

**Repository State:** V1 MVP Fully Implemented ✅

**Completed:**
- ✅ PRD gap analysis & planning
- ✅ Technical architecture implementation
- ✅ Complete database schema with Prisma
- ✅ User authentication with NextAuth.js
- ✅ Resume parsing (PDF/DOCX) with AI
- ✅ Job description analysis & optimization
- ✅ Profile management & editing
- ✅ Application tracking
- ✅ Text-based mock interviews
- ✅ **NEW: Voice interview with comprehensive coaching**
- ✅ API usage tracking & cost monitoring
- ✅ Complete documentation

**Latest Addition:**
- 🎤 **Voice Interview Feature** - AI-powered voice coaching with real-time analysis
  - Text-to-Speech question delivery
  - Voice recording with live transcription
  - Comprehensive voice metrics (WPM, pauses, filler words, confidence, clarity, energy)
  - Personalized coaching and resource recommendations
  - Detailed final report with action plans

---

## Key Features

### V1 MVP - Implemented ✅

**Core Features:**
- ✅ User authentication (sign up, login, JWT sessions)
- ✅ Resume upload and parsing (PDF, DOCX)
- ✅ AI-powered job description analysis
- ✅ Match score calculation
- ✅ Optimization suggestions
- ✅ Profile editor (manual editing)
- ✅ Cover letter generation
- ✅ Application tracking
- ✅ Mock interview (text-based)
- ✅ Interview feedback with AI evaluation

**Voice Interview Features (NEW):**
- ✅ Text-to-Speech question delivery
- ✅ Voice recording with Web Speech API
- ✅ Real-time transcription
- ✅ Comprehensive voice analysis:
  - Speaking pace (Words Per Minute)
  - Pause detection and analysis
  - Filler word detection
  - Confidence level assessment
  - Clarity rating
  - Energy level measurement
- ✅ Dual feedback system (content + delivery)
- ✅ Personalized voice coaching
- ✅ Resource recommendations
- ✅ Exercise suggestions
- ✅ Comprehensive final report with action plan

### V2 Features (Planned)

- PDF resume generation (3 templates)
- Portfolio website generation
- Portfolio customization
- Multiple resume versions
- LinkedIn profile sync
- Automated job alerts
- Advanced voice analytics (tone, emotion)
- Interview recording playback
- Collaborative features (mentor sharing)

---

## Getting Started

1. **Read:** [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)
2. **Review:** [PRD_GAP_ANALYSIS.md](./PRD_GAP_ANALYSIS.md)
3. **Follow:** [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
4. **Reference:** [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)

---

## Contributing

This project is in the planning phase. Development will begin with Phase 0 (Foundation).

---

## License

[Add license information]

---

## Contact

[Add contact information]

---

**Last Updated:** 2025-11-16
**Status:** V1 MVP Complete with Voice Interview ✅