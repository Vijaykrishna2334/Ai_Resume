<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=160&section=header&text=AI%20Resume%20Builder&fontSize=40&fontColor=fff&animation=twinkling&fontAlignY=36&desc=AI-Powered%20Resume%20Optimization%2C%20Portfolio%20%26%20Job%20Matching%20Platform&descAlignY=58&descSize=14" width="100%"/>

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Resume optimization · ATS scoring · Portfolio generation · Daily job alerts · Mock interviews**

</div>

---

## 🎯 What It Does

AI Resume Builder is a full-stack platform that takes your resume and transforms your entire job search. Upload your resume, paste a job description — get an ATS-optimized resume, tailored cover letter, and a professional portfolio site, all powered by **Google Gemini 2.5**.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📄 **Resume Parser** | Upload PDF/DOCX — AI extracts and structures your experience |
| 🎯 **ATS Optimizer** | Match resume to any JD with Gemini-powered keyword optimization |
| 📝 **Cover Letter Generator** | Tailored cover letters for each application in seconds |
| 🌐 **Portfolio Builder** | Auto-generate a professional portfolio website from your resume |
| 🎤 **Mock Interviews** | AI-powered text + voice interview practice with feedback |
| 🔊 **Voice Coaching** | Speaking metrics, pacing analysis, and improvement tips |
| 🔔 **Daily Job Alerts** | Automated personalized job matches delivered to your inbox |
| 📊 **ATS Score** | Real-time score showing how well your resume matches a JD |

---

## 🏗 How It Works

```
Upload resume (PDF/DOCX)
        ↓
Gemini 2.5 parses and structures all content
        ↓
Paste a job description → AI optimizes resume for ATS
        ↓
Generate cover letter + portfolio site
        ↓
Practice with AI mock interviewer
        ↓
Daily job alerts emailed based on your profile
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS |
| **AI** | Google Gemini 2.5 Flash + Pro — all AI features |
| **Database** | Supabase (PostgreSQL) + Storage |
| **Auth** | Supabase Auth |
| **Email** | Automated job alert scheduler (GitHub Actions cron) |
| **PDF** | Resume + cover letter PDF generation |

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Google Gemini API key (free at [ai.google.dev](https://ai.google.dev))

### Setup

```bash
# Clone
git clone https://github.com/Vijaykrishna2334/Ai_Resume.git
cd Ai_Resume

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

```bash
# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
Ai_Resume/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Main app dashboard
│   ├── portfolio/        # Portfolio builder
│   └── interview/        # Mock interview UI
├── components/           # Reusable UI components
├── lib/                  # Gemini AI + Supabase clients
├── .github/
│   └── workflows/        # Job alerts cron workflow
├── .env.example          # Environment variables template
└── package.json
```

---

## 🔔 Automated Job Alerts

Daily job matching runs automatically via **GitHub Actions** — no server needed. Configure your job preferences in the dashboard and get matched roles delivered every morning.

---

## 📬 Contact

**Built by [Vijay Krishna](https://github.com/Vijaykrishna2334)**
- 📧 vijaykrishna2334@gmail.com
- 💼 [LinkedIn](https://linkedin.com/in/vijaykrishna2334)

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=80&section=footer" width="100%"/>
