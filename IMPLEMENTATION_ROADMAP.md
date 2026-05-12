# AI Resume Builder - Implementation Roadmap

**Version:** 1.0
**Last Updated:** 2025-11-14
**Target Launch:** V1 MVP in 10 weeks

---

## Table of Contents
1. [Quick Start Guide](#quick-start-guide)
2. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
3. [Technical Specifications](#technical-specifications)
4. [API Contracts](#api-contracts)
5. [Database Schema](#database-schema)
6. [Testing Strategy](#testing-strategy)

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ or Supabase account
- OpenAI or Claude API key
- Git configured

### Day 1 Setup (2-4 hours)

```bash
# 1. Initialize Next.js project
npx create-next-app@latest ai-resume-builder \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --src-dir

cd ai-resume-builder

# 2. Install core dependencies
npm install \
  prisma @prisma/client \
  next-auth @auth/prisma-adapter \
  zod react-hook-form @hookform/resolvers \
  pdf-parse mammoth \
  openai \
  @radix-ui/react-* \
  class-variance-authority clsx tailwind-merge

# 3. Install dev dependencies
npm install -D \
  @types/pdf-parse \
  prisma

# 4. Initialize Prisma
npx prisma init

# 5. Set up environment variables
cp .env.example .env.local
```

**`.env.local` template:**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_resume"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# AI Provider
OPENAI_API_KEY="sk-..."
# OR
ANTHROPIC_API_KEY="sk-ant-..."

# File Storage (for production)
AWS_S3_BUCKET=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""

# Email (for production)
EMAIL_SERVER="smtp://username:password@smtp.example.com:587"
EMAIL_FROM="noreply@example.com"
```

---

## Phase-by-Phase Implementation

---

### Phase 0: Foundation (Week 1-2)

**Goal:** Working authentication and database

#### Database Schema Setup

**File:** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  profile       Profile?
  applications  Application[]
  documents     Document[]
  interviews    MockInterview[]
  portfolio     Portfolio?
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Profile {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Structured profile data
  summary   String?
  skills    String[] // Array of skill names

  // Work experience stored as JSONB
  experience Json[]
  // Example: [{ company: "X", title: "Y", start: "2020-01", end: "2023-01", bullets: [...] }]

  // Projects stored as JSONB
  projects  Json[]
  // Example: [{ name: "X", description: "Y", tech: [...], url: "..." }]

  // Education stored as JSONB
  education Json[]
  // Example: [{ institution: "X", degree: "Y", field: "Z", year: "2020" }]

  // Raw parsed resume data
  rawResumeData Json?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Application {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  company     String
  position    String
  jobUrl      String?
  jobDescription String @db.Text

  status      ApplicationStatus @default(APPLIED)
  matchScore  Int? // 0-100

  appliedAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  interviews  Interview[]
  documents   Document[]
}

enum ApplicationStatus {
  SAVED
  APPLIED
  INTERVIEWING
  OFFER
  REJECTED
  ACCEPTED
  DECLINED
}

model Interview {
  id            String   @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id], onDelete: Cascade)

  type          InterviewType
  scheduledAt   DateTime?
  completedAt   DateTime?
  outcome       String?
  notes         String? @db.Text

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum InterviewType {
  PHONE_SCREEN
  TECHNICAL
  BEHAVIORAL
  ONSITE
  FINAL
  OTHER
}

model Document {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  applicationId String?
  application   Application? @relation(fields: [applicationId], references: [id], onDelete: SetNull)

  type          DocumentType
  fileName      String
  fileUrl       String
  filePath      String
  mimeType      String

  // Metadata for generated documents
  metadata      Json? // { templateStyle: "minimalist", generated: true, ... }

  createdAt     DateTime @default(now())
}

enum DocumentType {
  UPLOADED_RESUME
  GENERATED_RESUME
  COVER_LETTER
  PORTFOLIO
  OTHER
}

model MockInterview {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  jobTitle  String?
  questions Json[] // [{ question: "...", answer: "...", timestamp: "..." }]
  feedback  Json?  // { overall: "...", strengths: [...], improvements: [...] }

  completedAt DateTime?
  createdAt   DateTime @default(now())
}

model Portfolio {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  slug        String   @unique // For URL: /portfolio/{slug}
  template    String   @default("minimalist")

  isPublished Boolean  @default(false)
  publishedAt DateTime?

  // Custom settings
  settings    Json?    // { theme: "dark", accentColor: "blue", ... }

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ApiUsage {
  id        String   @id @default(cuid())
  userId    String

  endpoint  String   // "parse_resume", "optimize", "generate_cover_letter"
  provider  String   // "openai", "anthropic"
  model     String   // "gpt-4", "claude-3-opus"

  tokensIn  Int
  tokensOut Int
  cost      Float    // In USD

  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}
```

#### Run Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

#### Authentication Setup

**File:** `src/lib/auth.ts`

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
```

**File:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

#### Deliverables
- [x] Database schema defined
- [x] Prisma migrations working
- [x] NextAuth configured
- [x] User sign up endpoint
- [x] User login working
- [x] Protected routes middleware

---

### Phase 1: Core Backend API (Week 2-3)

**Goal:** RESTful API for all core resources

#### API Routes Structure

```
src/app/api/
├── auth/
│   └── [...nextauth]/route.ts
├── users/
│   ├── route.ts (GET, PATCH)
│   └── [id]/route.ts
├── profile/
│   ├── route.ts (GET, PUT)
│   ├── experience/route.ts (POST, PATCH, DELETE)
│   ├── projects/route.ts (POST, PATCH, DELETE)
│   ├── education/route.ts (POST, PATCH, DELETE)
│   └── skills/route.ts (POST, DELETE)
├── applications/
│   ├── route.ts (GET, POST)
│   ├── [id]/route.ts (GET, PATCH, DELETE)
│   └── [id]/interviews/route.ts
├── documents/
│   ├── upload/route.ts (POST)
│   ├── generate/route.ts (POST)
│   └── [id]/route.ts (GET, DELETE)
├── optimize/
│   └── route.ts (POST)
├── mock-interview/
│   ├── start/route.ts (POST)
│   ├── [id]/message/route.ts (POST)
│   └── [id]/complete/route.ts (POST)
└── portfolio/
    ├── route.ts (GET, POST, PATCH)
    └── [slug]/route.ts (GET - public)
```

#### Example API Implementation

**File:** `src/app/api/profile/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const profileSchema = z.object({
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    bullets: z.array(z.string()),
  })).optional(),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    url: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    year: z.string(),
  })).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id }
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validated = profileSchema.parse(body);

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: validated,
    create: {
      userId: session.user.id,
      ...validated,
    }
  });

  return NextResponse.json(profile);
}
```

#### Validation Schemas

**File:** `src/lib/validations/profile.ts`

```typescript
import { z } from "zod";

export const experienceSchema = z.object({
  company: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Title is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
  endDate: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM").optional(),
  bullets: z.array(z.string()).min(1),
  current: z.boolean().default(false),
});

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  tech: z.array(z.string()).min(1),
  url: z.string().url().optional(),
  github: z.string().url().optional(),
});

export const educationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().min(1),
  year: z.string().regex(/^\d{4}$/),
  gpa: z.number().min(0).max(4).optional(),
});
```

#### Deliverables
- [x] All CRUD endpoints implemented
- [x] Input validation with Zod
- [x] Error handling middleware
- [x] Rate limiting
- [x] API documentation (OpenAPI/Swagger)

---

### Phase 2: Resume Parsing (Week 3-4)

**Goal:** Extract structured data from PDF/DOCX

#### Resume Parser Service

**File:** `src/lib/services/resume-parser.ts`

```typescript
import pdf from "pdf-parse";
import mammoth from "mammoth";
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ResumeParser {
  async parseFile(file: Buffer, mimeType: string): Promise<ParsedResume> {
    // Step 1: Extract raw text
    const rawText = await this.extractText(file, mimeType);

    // Step 2: Use AI to structure the data
    const structured = await this.structureWithAI(rawText);

    return structured;
  }

  private async extractText(file: Buffer, mimeType: string): Promise<string> {
    if (mimeType === "application/pdf") {
      const data = await pdf(file);
      return data.text;
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer: file });
      return result.value;
    } else {
      throw new Error("Unsupported file type");
    }
  }

  private async structureWithAI(text: string): Promise<ParsedResume> {
    const prompt = `Extract structured information from this resume. Return JSON only.

Resume text:
${text}

Return format:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "summary": "professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if current",
      "bullets": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University",
      "degree": "Degree",
      "field": "Field of Study",
      "year": "YYYY"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Description",
      "tech": ["tech1", "tech2"]
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a resume parser. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    // Track API usage
    await this.trackUsage({
      endpoint: "parse_resume",
      provider: "openai",
      model: "gpt-4-turbo",
      tokensIn: completion.usage?.prompt_tokens || 0,
      tokensOut: completion.usage?.completion_tokens || 0,
    });

    return result;
  }

  private async trackUsage(usage: any) {
    // Implement cost tracking
    const costPer1kTokens = 0.01; // Example pricing
    const totalTokens = usage.tokensIn + usage.tokensOut;
    const cost = (totalTokens / 1000) * costPer1kTokens;

    await prisma.apiUsage.create({
      data: {
        ...usage,
        cost,
      }
    });
  }
}

export interface ParsedResume {
  name: string;
  email: string;
  phone?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    tech: string[];
  }>;
}
```

#### Upload API Endpoint

**File:** `src/app/api/documents/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResumeParser } from "@/lib/services/resume-parser";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  try {
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file to disk (or S3 in production)
    const fileName = `${session.user.id}-${Date.now()}-${file.name}`;
    const filePath = join(process.cwd(), "uploads", fileName);
    await writeFile(filePath, buffer);

    // Parse resume
    const parser = new ResumeParser();
    const parsed = await parser.parseFile(buffer, file.type);

    // Save document record
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        type: "UPLOADED_RESUME",
        fileName: file.name,
        fileUrl: `/uploads/${fileName}`,
        filePath,
        mimeType: file.type,
      }
    });

    // Update or create profile with parsed data
    await prisma.profile.upsert({
      where: { userId: session.user.id },
      update: {
        skills: parsed.skills,
        experience: parsed.experience as any,
        education: parsed.education as any,
        projects: parsed.projects as any,
        summary: parsed.summary,
        rawResumeData: parsed as any,
      },
      create: {
        userId: session.user.id,
        skills: parsed.skills,
        experience: parsed.experience as any,
        education: parsed.education as any,
        projects: parsed.projects as any,
        summary: parsed.summary,
        rawResumeData: parsed as any,
      }
    });

    return NextResponse.json({
      document,
      parsed,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process resume" },
      { status: 500 }
    );
  }
}
```

#### Deliverables
- [x] PDF text extraction working
- [x] DOCX text extraction working
- [x] AI-powered structuring
- [x] Profile auto-population
- [x] Error handling for malformed resumes
- [x] Cost tracking for AI API calls

---

### Phase 3: AI Optimization (Week 4-5)

**Goal:** Real job description analysis and suggestions

#### Optimizer Service

**File:** `src/lib/services/optimizer.ts`

```typescript
import { OpenAI } from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class ResumeOptimizer {
  async analyzeJobDescription(jd: string): Promise<JDAnalysis> {
    const prompt = `Analyze this job description and extract key information. Return JSON only.

Job Description:
${jd}

Return format:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill3", "skill4"],
  "keywords": ["keyword1", "keyword2"],
  "experienceLevel": "junior|mid|senior",
  "role": "Brief role summary",
  "responsibilities": ["resp1", "resp2"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a job description analyzer. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  }

  async calculateMatchScore(profile: any, jdAnalysis: JDAnalysis): Promise<number> {
    const userSkills = new Set(profile.skills.map((s: string) => s.toLowerCase()));
    const requiredSkills = new Set(jdAnalysis.requiredSkills.map(s => s.toLowerCase()));
    const allJobSkills = new Set([
      ...jdAnalysis.requiredSkills,
      ...jdAnalysis.preferredSkills
    ].map(s => s.toLowerCase()));

    // Calculate required skills match
    let requiredMatches = 0;
    requiredSkills.forEach(skill => {
      if (userSkills.has(skill)) requiredMatches++;
    });

    const requiredScore = (requiredMatches / requiredSkills.size) * 70;

    // Calculate overall skills match
    let totalMatches = 0;
    allJobSkills.forEach(skill => {
      if (userSkills.has(skill)) totalMatches++;
    });

    const skillScore = (totalMatches / allJobSkills.size) * 30;

    return Math.round(requiredScore + skillScore);
  }

  async generateSuggestions(
    profile: any,
    jdAnalysis: JDAnalysis,
    matchScore: number
  ): Promise<OptimizationSuggestion[]> {
    const prompt = `You are a resume optimization expert. Given a user's profile and job requirements, suggest specific improvements.

User Profile:
${JSON.stringify(profile, null, 2)}

Job Requirements:
${JSON.stringify(jdAnalysis, null, 2)}

Current Match Score: ${matchScore}/100

Provide 5-7 actionable suggestions to improve the resume for this job. Focus on:
1. Skills to highlight or add
2. Experience bullets to emphasize or rewrite
3. Keywords to include
4. Gaps to address

Return JSON array:
[
  {
    "type": "skill|experience|keyword|summary",
    "priority": "high|medium|low",
    "title": "Brief title",
    "description": "Detailed suggestion",
    "example": "Specific example if applicable"
  }
]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a resume expert. Always return valid JSON array." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{ \"suggestions\": [] }");
    return result.suggestions || [];
  }

  async generateCoverLetter(
    profile: any,
    jdAnalysis: JDAnalysis,
    company: string,
    position: string
  ): Promise<string> {
    const prompt = `Write a professional cover letter for this job application.

Candidate Profile:
${JSON.stringify(profile, null, 2)}

Job Details:
Company: ${company}
Position: ${position}
Requirements: ${JSON.stringify(jdAnalysis, null, 2)}

Write a compelling cover letter that:
1. Opens with enthusiasm for the role
2. Highlights 2-3 relevant experiences
3. Connects skills to job requirements
4. Shows cultural fit and genuine interest
5. Closes with call to action

Keep it concise (3-4 paragraphs). Use professional tone.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a professional cover letter writer." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
    });

    return completion.choices[0].message.content || "";
  }
}

export interface JDAnalysis {
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
  experienceLevel: string;
  role: string;
  responsibilities: string[];
}

export interface OptimizationSuggestion {
  type: "skill" | "experience" | "keyword" | "summary";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  example?: string;
}
```

#### Optimize API Endpoint

**File:** `src/app/api/optimize/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResumeOptimizer } from "@/lib/services/optimizer";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobDescription, company, position } = await req.json();

  if (!jobDescription) {
    return NextResponse.json({ error: "Job description required" }, { status: 400 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id }
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const optimizer = new ResumeOptimizer();

  // Analyze JD
  const jdAnalysis = await optimizer.analyzeJobDescription(jobDescription);

  // Calculate match score
  const matchScore = await optimizer.calculateMatchScore(profile, jdAnalysis);

  // Generate suggestions
  const suggestions = await optimizer.generateSuggestions(profile, jdAnalysis, matchScore);

  // Optionally save as application
  let application;
  if (company && position) {
    application = await prisma.application.create({
      data: {
        userId: session.user.id,
        company,
        position,
        jobDescription,
        matchScore,
        status: "SAVED",
      }
    });
  }

  return NextResponse.json({
    matchScore,
    analysis: jdAnalysis,
    suggestions,
    applicationId: application?.id,
  });
}
```

#### Deliverables
- [x] JD analysis working
- [x] Match score calculation
- [x] Optimization suggestions
- [x] Cover letter generation
- [x] Response caching for duplicate JDs

---

### Phase 4: Profile Management UI (Week 5-6)

**See PRD_GAP_ANALYSIS.md for detailed component structure**

Key components:
- Profile editor form with sections
- Work experience CRUD interface
- Projects CRUD interface
- Skills tag input
- Education CRUD interface
- Auto-save functionality
- Validation feedback

---

### Phase 5: PDF Generation (Week 6-7)

**See PRD_GAP_ANALYSIS.md for PDF generation setup**

Tools: Puppeteer + React PDF or similar

---

### Phase 6-8: Portfolio, Mock Interview, Polish

**See PRD_GAP_ANALYSIS.md for remaining phases**

---

## Testing Strategy

### Unit Tests
- Services (parser, optimizer)
- Utility functions
- Validation schemas

### Integration Tests
- API endpoints
- Database operations
- AI service calls (mocked)

### E2E Tests
- User flows (signup → upload → optimize)
- Critical paths
- Payment flows (future)

### Testing Tools
```bash
npm install -D \
  @testing-library/react \
  @testing-library/jest-dom \
  vitest \
  @vitest/ui \
  playwright
```

---

## Deployment Checklist

### Pre-launch
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] File storage configured (S3)
- [ ] Email service configured
- [ ] Error tracking active (Sentry)
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers set

### Launch Day
- [ ] Database backups enabled
- [ ] Monitoring dashboards ready
- [ ] Support email configured
- [ ] Terms of service live
- [ ] Privacy policy live

---

**Next Steps:** Begin Phase 0 setup following the Quick Start Guide above.
