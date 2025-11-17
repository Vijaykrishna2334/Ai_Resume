# 🚀 AI Resume Builder - Super Simple Setup Guide

This guide will help you get the AI Resume Builder running on your computer, step by step!

---

## 📋 What You Need First (Prerequisites)

Before we start, you need to install these programs on your computer:

### 1. **Node.js** (Version 18 or newer)
- **What it does**: Runs JavaScript code on your computer
- **Download from**: https://nodejs.org/
- **How to check if you have it**:
  ```bash
  node --version
  ```
  You should see something like `v18.0.0` or higher

### 2. **Git**
- **What it does**: Downloads code from the internet
- **Download from**: https://git-scm.com/
- **How to check if you have it**:
  ```bash
  git --version
  ```
  You should see something like `git version 2.x.x`

### 3. **PostgreSQL** (Optional - only if you want local database)
- **What it does**: Stores all your data (resumes, users, jobs)
- **Download from**: https://www.postgresql.org/download/
- **Or use**: Supabase (cloud database - easier!)

---

## 🎯 Step-by-Step Setup

### Step 1: Download the Code

Open your terminal (Command Prompt on Windows, Terminal on Mac/Linux) and type:

```bash
# Go to your projects folder (or wherever you want to save the code)
cd ~/Desktop

# Download the code from GitHub
git clone https://github.com/Vijaykrishna2334/Ai_Resume.git

# Go inside the project folder
cd Ai_Resume
```

**What happened?** You just downloaded all the code to your computer!

---

### Step 2: Install Dependencies

Dependencies are like "helper tools" that the project needs to work.

```bash
# Install all the helper tools
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

**What happened?** You just installed 600+ helper tools! This might take 2-3 minutes.

**Note**: We skip Puppeteer download because it's big and needs internet. You don't need it to run the app.

---

### Step 3: Get Your API Keys

The app needs special "keys" to use AI services. Think of them like passwords for robots!

#### 🔑 API Keys You Need:

1. **Google Gemini API Key** (REQUIRED - for AI features)
   - Go to: https://makersuite.google.com/app/apikey
   - Click "Create API Key"
   - Copy the key (looks like: `AIzaSyA...`)

2. **NextAuth Secret** (REQUIRED - for login security)
   - Open terminal and run:
     ```bash
     openssl rand -base64 32
     ```
   - Copy the random string it shows

3. **Resend API Key** (Optional - for sending emails)
   - Go to: https://resend.com/
   - Sign up for free account
   - Get your API key from dashboard

4. **Adzuna API Keys** (Optional - for job searching)
   - Go to: https://developer.adzuna.com/
   - Sign up for free
   - Get App ID and API Key

5. **RapidAPI Key** (Optional - for more job sources)
   - Go to: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
   - Sign up and subscribe to free plan
   - Copy your API key

---

### Step 4: Create Your .env File

This file stores all your secret keys!

```bash
# Copy the example file
cp .env.example .env
```

Now open the `.env` file in a text editor (Notepad, VS Code, etc.) and fill in your keys:

```bash
# Database - Choose ONE option:

# OPTION A: Use Supabase (Cloud - Easier!)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# OPTION B: Use Local PostgreSQL
# DATABASE_URL="postgresql://postgres:password@localhost:5432/ai_resume"

# Authentication (REQUIRED)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-the-random-string-from-step-3-here"

# Google Gemini AI (REQUIRED)
GEMINI_API_KEY="paste-your-gemini-key-here"

# Email Service (Optional but recommended)
RESEND_API_KEY="paste-your-resend-key-here"

# Job Search APIs (Optional)
ADZUNA_APP_ID="your-adzuna-app-id"
ADZUNA_API_KEY="your-adzuna-api-key"
RAPIDAPI_KEY="your-rapidapi-key"

# Cron Job Security (Optional - for automated jobs)
CRON_SECRET="make-up-a-random-password-here"
```

---

### Step 5: Set Up Supabase Database (Easiest Option!)

#### Why Supabase?
- ✅ Free forever plan
- ✅ No installation needed
- ✅ Works from anywhere
- ✅ Automatic backups

#### How to Set Up Supabase:

1. **Go to**: https://supabase.com/
2. **Click**: "Start your project"
3. **Sign up**: with GitHub or email
4. **Create a new project**:
   - Project name: `ai-resume-builder`
   - Database password: (save this!)
   - Region: Choose closest to you
   - Click "Create new project"

5. **Wait 2 minutes** for setup to complete

6. **Get your connection details**:
   - Click "Project Settings" (gear icon)
   - Click "Database" in left sidebar
   - Copy the "Connection String" (URI format)
   - Scroll down and copy:
     - Project URL
     - Anon (public) key
     - Service role key

7. **Update your .env file** with these values

8. **Create the database tables**:
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Create all tables in Supabase
   npx prisma db push
   ```

**What happened?** You just created a database in the cloud with all the tables needed!

---

### Step 6: Run the Application

Time to start the app!

```bash
# Start the development server
npm run dev
```

**What happened?** The app is now running! You should see:
```
✓ Ready in 3.5s
○ Local: http://localhost:3000
```

---

### Step 7: Open in Browser

Open your web browser (Chrome, Firefox, etc.) and go to:

```
http://localhost:3000
```

**🎉 YOU DID IT!** You should see the beautiful landing page!

---

## 🎮 How to Use the App

### 1. **Sign Up**
- Click "Get Started Free"
- Create an account with email and password

### 2. **Upload Your Resume**
- Go to Dashboard
- Click "Resume Parser"
- Upload your PDF resume
- AI will extract all your information!

### 3. **Optimize for Jobs**
- Click "Job Optimizer"
- Paste a job description
- Get AI suggestions to improve your resume

### 4. **Practice Interviews**
- Click "Mock Interview"
- Choose "Voice Interview" for speak-to-speak practice
- Answer AI questions out loud
- Get feedback on your speaking!

### 5. **Set Up Job Alerts**
- Click "Job Alerts"
- Add your email and preferred time
- Choose your desired roles
- Get daily job matches by email!

---

## 🛠️ Common Problems & Solutions

### Problem 1: "Port 3000 is already in use"

**Solution**: Kill the process using port 3000
```bash
# On Mac/Linux
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Problem 2: "Cannot find module 'next'"

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

### Problem 3: "Database connection failed"

**Solution**: Check your DATABASE_URL in .env file
- Make sure there are no spaces
- Make sure the password is correct
- Make sure Supabase project is running

### Problem 4: "Prisma Client not found"

**Solution**: Generate Prisma client
```bash
npx prisma generate
```

### Problem 5: Voice interview not working

**Solution**:
- Use Google Chrome (best support for voice)
- Make sure you allow microphone access
- Check your microphone is working

---

## 📚 Important Files Explained

| File/Folder | What It Does |
|-------------|--------------|
| `.env` | Stores all your secret keys (NEVER share this!) |
| `package.json` | Lists all the helper tools needed |
| `prisma/schema.prisma` | Defines your database structure |
| `src/app/` | All the web pages |
| `src/lib/` | Reusable code and AI services |
| `public/` | Images and static files |

---

## 🔒 Security Tips

1. **NEVER share your .env file** - it has secret keys!
2. **NEVER commit .env to GitHub** - it's already in .gitignore
3. **Use different NEXTAUTH_SECRET** for production
4. **Keep your API keys safe** - don't share them

---

## 🚀 Deploying to Production (Advanced)

When you're ready to share with the world:

### Option 1: Deploy to Vercel (Easiest)

1. **Create account**: https://vercel.com/
2. **Connect GitHub**: Link your repository
3. **Add environment variables**: Copy all from .env
4. **Deploy**: Click deploy button!

### Option 2: Deploy to Railway

1. **Create account**: https://railway.app/
2. **New project**: From GitHub repo
3. **Add environment variables**: Copy all from .env
4. **Deploy**: Automatic!

---

## 📞 Need Help?

If something isn't working:

1. **Check the error message** - it usually tells you what's wrong
2. **Read this guide again** - make sure you didn't skip a step
3. **Check your .env file** - most issues are here
4. **Google the error** - someone probably had the same problem!

---

## 🎉 Congratulations!

You now have a fully working AI Resume Builder! Here's what you can do:

- ✅ Parse resumes with AI
- ✅ Optimize for any job description
- ✅ Practice voice interviews
- ✅ Get daily job matches
- ✅ Generate cover letters
- ✅ Track all applications

**Go build amazing resumes and land your dream job!** 🚀

---

## 📖 What Each API Key Does (Simple Explanation)

| API Key | What It's For | Free Tier |
|---------|---------------|-----------|
| **Gemini API** | Makes the AI smart (understands resumes, generates questions) | 60 requests/minute |
| **Resend API** | Sends you job match emails every day | 100 emails/day |
| **Adzuna API** | Finds real jobs from websites | 5,000 calls/month |
| **RapidAPI** | Finds more jobs from different websites | 100 calls/month |
| **Supabase** | Stores all your data in the cloud | 500MB storage |

---

## 🎓 Learning Resources

Want to learn how the app works?

- **Next.js**: https://nextjs.org/learn (Learn web development)
- **Prisma**: https://www.prisma.io/docs (Learn databases)
- **Gemini AI**: https://ai.google.dev/ (Learn AI)
- **TypeScript**: https://www.typescriptlang.org/docs/ (Learn programming)

---

**Made with ❤️ for job seekers worldwide!**
