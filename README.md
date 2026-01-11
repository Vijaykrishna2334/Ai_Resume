# PortfolioAI - AI-Powered Resume Optimization System

An intelligent resume optimization platform that uses Google Gemini AI to analyze resumes, match them against job descriptions, and generate professionally formatted documents.

## 🎯 Features

- **Resume Analysis**: Upload PDF/DOCX resumes for AI-powered parsing
- **Job Matching**: Analyze job descriptions and get AI-driven match scores
- **Smart Suggestions**: Receive actionable recommendations to improve your resume
- **Multi-Style Generation**: Generate resumes in 3 professional styles:
  - **Minimalist**: Clean, simple layout
  - **Technical**: Code-oriented formatting
  - **Creative**: Modern, colorful design
- **Document Export**: Download as PDF or DOCX
- **AI Cover Letters**: Automatically generate personalized cover letters
- **Mock Interviews**: Practice with AI-powered interview simulations (bonus feature)

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Python Flask + Google Gemini AI
- **Document Generation**: ReportLab (PDF) + python-docx (DOCX)
- **AI Model**: Google Gemini 2.5 Flash

## 📋 Prerequisites

- Python 3.12+
- Node.js 18+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd Resume
```

### 2. Backend Setup (Python)

```bash
# Navigate to Python backend
cd python_backend

# Activate virtual environment (if you have one)
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env  # Windows
# OR
cp .env.example .env    # Mac/Linux

# Edit .env and add your API key
# GEMINI_API_KEY=your_actual_api_key_here

# Start backend
python app.py
```

Backend runs on: **http://localhost:8080**

### 3. Frontend Setup (React)

```bash
# From root directory
npm install

# Start frontend
npm run dev
```

Frontend runs on: **http://localhost:5173**

## 🎮 How to Use

1. **Open Browser**: Navigate to `http://localhost:5173`
2. **Sign Up**: Enter your name and email
3. **Upload Resume**: Upload your PDF or DOCX resume (optional - you can use mock data)
4. **Paste Job Description**: Copy and paste a job posting
5. **Analyze**: Click "Analyze Match" to get AI-powered insights
6. **View Suggestions**: Review recommended improvements
7. **Select Style**: Choose minimalist, technical, or creative
8. **Generate Documents**: Click "Generate Resume and Cover Letter"
9. **Download**: Download your optimized PDF and DOCX files

## 📁 Project Structure

```
Resume/
├── python_backend/          # Flask API backend
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables (create this)
├── src/                    # React frontend source
│   ├── App.jsx            # Main React component
│   ├── main.jsx           # React entry point
│   └── index.css          # Tailwind styles
├── index.html             # HTML entry point
├── package.json           # Node dependencies
└── vite.config.js         # Vite configuration
```

## 🔧 Environment Variables

Create `python_backend/.env` with:

```env
# Google Gemini API Key (Required)
GEMINI_API_KEY=your_api_key_here

# Server Configuration
PORT=8080
```

## 🌐 API Endpoints

### Health Check
```
GET /health
```

### Resume Parsing
```
POST /api/optimizer/parse-resume
Content-Type: multipart/form-data
Body: file (PDF or DOCX)
```

### Job Analysis
```
POST /api/optimizer/analyze
Content-Type: application/json
Body: { jd: string, profile: object }
```

### Document Generation
```
POST /api/optimizer/generate-documents
Content-Type: application/json
Body: { profile: object, jd: string, style: string }
```

## 🐛 Troubleshooting

### CORS Errors
- Ensure Python backend is running on port 8080
- Check that frontend is accessing `localhost:5173`

### API Key Errors
- Verify `GEMINI_API_KEY` is set in `python_backend/.env`
- Test API key at [Google AI Studio](https://aistudio.google.com/)

### Import Errors (Python)
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

### Port Already in Use
```bash
# Kill process on port 8080
# Windows:
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8080 | xargs kill -9
```

## 🎨 Available Resume Styles

1. **Minimalist**: Clean design with standard fonts, perfect for conservative industries
2. **Technical**: Monospace fonts and code-style formatting for tech roles
3. **Creative**: Modern colors and dynamic layouts for creative positions

## 📝 Technologies Used

### Frontend
- React 18
- Vite 4
- Tailwind CSS
- Lucide React (icons)

### Backend
- Flask 3.1
- Google Genai SDK
- Pydantic (data validation)
- ReportLab (PDF generation)
- python-docx (DOCX generation)
- pypdf (PDF parsing)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Google Gemini AI for powerful language models
- ReportLab for PDF generation
- The open-source community

---

**Made with ❤️ using Google Gemini AI**
