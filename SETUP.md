# AI Resume Builder - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ (recommended: 20.x)
- PostgreSQL 14+ or a Supabase account
- OpenAI API key (or Claude API key)
- Git

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

**Option A: Using Supabase (Recommended for quick start)**

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database and copy the connection string
4. Update `.env.local` with your DATABASE_URL

**Option B: Local PostgreSQL**

```bash
# Create database
createdb ai_resume

# Update DATABASE_URL in .env.local
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/ai_resume"
```

### 3. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your credentials
```

Required variables:
```env
DATABASE_URL="your_database_url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_here"  # Generate with: openssl rand -base64 32
GEMINI_API_KEY="your-gemini-api-key"  # Get from: https://aistudio.google.com/app/apikey
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Features Available

### ✅ Implemented Features

1. **User Authentication**
   - Sign up / Sign in
   - Session management with NextAuth
   - Password hashing with bcrypt

2. **Resume Parsing**
   - PDF upload and parsing
   - DOCX upload and parsing
   - AI-powered data extraction (OpenAI GPT-4)
   - Auto-populate profile from resume

3. **Job Description Optimization**
   - Paste job description
   - AI analysis of required skills
   - Match score calculation (0-100%)
   - Personalized suggestions

4. **PDF Generation**
   - Generate professional resumes
   - 3 templates (Minimalist, Technical, Creative)
   - ATS-friendly formatting
   - Cover letter generation

5. **Portfolio Generation**
   - Create public portfolio websites
   - 3 templates available
   - Unique URL generation
   - Responsive design

6. **Mock Interview System**
   - AI-generated interview questions
   - Answer evaluation
   - Comprehensive feedback reports
   - Interview history

7. **Application Tracking**
   - Save job applications
   - Track application status
   - Link documents to applications
   - Interview scheduling

---

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Sign in (via NextAuth)
- `GET /api/auth/signout` - Sign out

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Documents
- `POST /api/documents/upload` - Upload and parse resume
- `POST /api/documents/generate` - Generate PDF (resume/cover letter)

### Optimization
- `POST /api/optimize` - Analyze JD and get suggestions

### Applications
- `GET /api/applications` - List all applications
- `POST /api/applications` - Create application

### Portfolio
- `GET /api/portfolio` - Get portfolio
- `POST /api/portfolio` - Generate portfolio

### Mock Interview
- `POST /api/mock-interview/start` - Start interview
- `POST /api/mock-interview/[id]/answer` - Submit answer
- `POST /api/mock-interview/[id]/complete` - Complete interview

---

## Database Schema

See `prisma/schema.prisma` for complete schema.

Key models:
- `User` - User accounts
- `Profile` - User profile data (skills, experience, education)
- `Application` - Job applications with match scores
- `Document` - Uploaded/generated documents
- `MockInterview` - Interview practice sessions
- `Portfolio` - Portfolio websites
- `ApiUsage` - AI API cost tracking

---

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: Google Gemini (Gemini 2.0 Flash + Gemini 1.5 Pro)
- **PDF Generation**: Puppeteer
- **File Parsing**: pdf-parse, mammoth.js

---

## Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema without migration
npm run db:migrate       # Create migration
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio

# Type checking
npm run type-check       # Run TypeScript compiler
```

---

## Project Structure

```
ai-resume-builder/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Auth pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   └── ui/                # UI components
│   ├── lib/
│   │   ├── services/          # Business logic
│   │   ├── auth.ts            # NextAuth config
│   │   ├── prisma.ts          # Prisma client
│   │   └── utils.ts           # Utilities
│   └── types/                 # TypeScript types
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static files
└── uploads/                   # Uploaded files
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npx prisma db pull

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Gemini API Errors

- Check API key is valid at https://aistudio.google.com/app/apikey
- Ensure you have API quota available
- Check rate limits (Gemini has generous free tier)
- Verify GEMINI_API_KEY in .env.local

### Build Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
DATABASE_URL="production_db_url"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production_secret"
GEMINI_API_KEY="your-gemini-api-key"
```

---

## Next Steps

1. **Phase 1**: Test all features locally
2. **Phase 2**: Add error handling and validation
3. **Phase 3**: Implement caching for AI responses
4. **Phase 4**: Add email notifications
5. **Phase 5**: Deploy to production

---

## Support

For issues and questions:
- Check the documentation files in the repository
- Review the PRD_GAP_ANALYSIS.md for feature details
- See IMPLEMENTATION_ROADMAP.md for technical specifications

---

**Version**: 1.0.0
**Last Updated**: 2025-11-14
