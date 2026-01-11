# Quick Start Guide - PortfolioAI

## Backend Setup

1. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

2. **Create .env file:**
   ```bash
   copy env.example .env
   ```

3. **Edit .env and add your Gemini API key:**
   ```
   GEMINI_API_KEY=your-actual-gemini-key-here
   ```

4. **Start backend server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

## Frontend Setup (Already Running)

Frontend is already set up and running on `http://localhost:5173`

## Test the Backend

1. **Health Check:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Sign Up:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","name":"Test User","password":"password123"}'
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Sign up
- `POST /api/auth/signin` - Sign in

### Profile
- `GET /api/profile?userId=123` - Get profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/parse-resume` - Parse resume (multipart/form-data)

### Optimizer
- `POST /api/optimizer/analyze` - Analyze job match
- `POST /api/optimizer/generate-documents` - Generate documents

### Interview
- `POST /api/interview/start` - Start interview
- `POST /api/interview/answer` - Submit answer
- `POST /api/interview/end` - End interview

## Next: Connect Frontend to Backend

The frontend UI is ready, but currently uses mock data. You need to:

1. Create an API service in frontend to connect to backend
2. Update the frontend to make real API calls instead of mocks
3. Replace localStorage with API calls

## Getting Google Gemini API Key

1. Go to https://ai.google.dev/
2. Sign up or log in with your Google account
3. Click on "Get API Key"
4. Create a new API key
5. Copy it to your `.env` file

