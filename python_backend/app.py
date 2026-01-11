from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import base64
from dotenv import load_dotenv 
from typing import List, Dict, Any
from io import BytesIO

from google import genai
from google.genai import types
from pydantic import BaseModel, Field
import docx
from docx import Document
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from pypdf import PdfReader
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch


# --- SCHEMA DEFINITIONS ---
class WorkExperience(BaseModel):
    title: str = Field(description="The user's job title at this company.")
    company: str = Field(description="The name of the company.")
    years: str = Field(description="The start and end date/year range (e.g., '2020 - 2023').")
    summary: str = Field(description="A 2-3 sentence summary of responsibilities and achievements.")

class ResumeProfile(BaseModel):
    name: str = Field(description="The user's full name.")
    email: str = Field(description="The user's professional email address.")
    summary: str = Field(description="A concise, professional 3-sentence summary of the user's career goals and experience.")
    skills: List[str] = Field(description="A list of 8 to 12 key hard skills (e.g., Python, SQL, React).")
    experience: List[WorkExperience] = Field(description="A list of all work experiences.")

class OptimizationReport(BaseModel):
    match_score: int = Field(description="A confidence score from 0 to 100...")
    keyword_gaps: List[str] = Field(description="A list of 3-5 critical skills...")
    suggestions: List[str] = Field(description="A list of 3 actionable, specific suggestions...")

class InterviewSettings(BaseModel):
    role: str = Field(description="The target job role...")
    type: str = Field(description="The type of questions...")
    status: str = Field(default="ready", description="The current status...")
    history: List[str] = Field(default=[], description="List of all turns...")
# --- END SCHEMA DEFINITIONS ---


# --- 0. Setup and Configuration ---
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY") 

# --- CRITICAL FIX: CACHE THE GEMINI CLIENT ---
# In a Flask app, we don't use st.cache_resource. We'll initialize the client once.
client = None
if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY)
        print("[DEBUG] Gemini client initialized successfully.")
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")
else:
    print("Warning: GEMINI_API_KEY not found. Some AI features will be disabled.")


# --- DOCUMENT HANDLING AND GENERATION FUNCTIONS ---

def read_pdf(file):
    reader = PdfReader(file)
    text = "".join(page.extract_text() for page in reader.pages)
    return text

def read_docx(file):
    document = docx.Document(file)
    text = "".join(para.text + "\n" for para in document.paragraphs)
    return text

def generate_pdf_v2(profile: ResumeProfile) -> BytesIO:
    """Generates a professional PDF resume using ReportLab (V2 Feature)."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=0.5*inch, rightMargin=0.5*inch, topMargin=0.5*inch, bottomMargin=0.5*inch)
    styles = getSampleStyleSheet()
    Story = []
    styles.add(ParagraphStyle(name='HeadingName', fontName='Helvetica-Bold', fontSize=20, alignment=1, textColor=HexColor('#007bff')))
    styles.add(ParagraphStyle(name='HeadingSection', fontName='Helvetica-Bold', fontSize=14, spaceBefore=12, spaceAfter=4, textColor=HexColor('#333333')))
    styles.add(ParagraphStyle(name='NormalSmall', fontName='Helvetica', fontSize=10, leading=12))
    styles.add(ParagraphStyle(name='BulletStyle', fontName='Helvetica', fontSize=10, leftIndent=0.25*inch, bulletIndent=-0.25*inch, spaceBefore=0, spaceAfter=0)) 

    Story.append(Paragraph(profile.name.upper(), styles['HeadingName']))
    Story.append(Paragraph(profile.email, styles['Italic']))
    Story.append(Spacer(1, 0.2*inch))
    Story.append(Paragraph("SUMMARY", styles['HeadingSection']))
    Story.append(Paragraph(profile.summary.strip(), styles['NormalSmall'])) 
    Story.append(Spacer(1, 0.1*inch))
    Story.append(Paragraph("KEY SKILLS", styles['HeadingSection']))
    Story.append(Paragraph(f"Skills: {', '.join(profile.skills)}", styles['NormalSmall']))
    Story.append(Spacer(1, 0.1*inch))
    Story.append(Paragraph("WORK EXPERIENCE", styles['HeadingSection']))
    
    for exp in profile.experience:
        Story.append(Paragraph(f"<b>{exp.title}</b> at {exp.company}", styles['NormalSmall']))
        Story.append(Paragraph(exp.years, styles['Italic']))
        clean_summary = exp.summary.replace('·', '').strip()
        bullet_items = [ListItem(Paragraph(line.strip(), styles['NormalSmall']), bulletText='\u2022') for line in clean_summary.split('\n') if line.strip()]
        if bullet_items:
            Story.append(ListFlowable(bullet_items, bulletType='bullet', start='bullet'))
        Story.append(Spacer(1, 0.1*inch))
    doc.build(Story)
    buffer.seek(0)
    return buffer

def generate_docx_v2(profile: ResumeProfile) -> BytesIO:
    """Generates an ATS-ready DOCX resume with proper structural styling (V2 Feature)."""
    document = Document()
    p = document.add_paragraph()
    runner = p.add_run(profile.name.upper())
    runner.font.size = Pt(18)
    runner.bold = True
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    document.add_paragraph(profile.email).alignment = WD_ALIGN_PARAGRAPH.CENTER
    document.add_paragraph().add_run('—'*50).font.size = Pt(8) 
    document.add_heading('SUMMARY', level=2)
    document.add_paragraph(profile.summary.strip()) 
    document.add_heading('KEY SKILLS', level=2)
    document.add_paragraph(", ".join(profile.skills))
    document.add_heading('EXPERIENCE', level=2)
    
    for exp in profile.experience:
        p_title = document.add_paragraph()
        p_title.add_run(f"{exp.title}").bold = True
        p_title.add_run(f" | {exp.company} ({exp.years})").italic = True
        for line in exp.summary.split('\n'):
             clean_line = line.strip()
             if clean_line:
                 document.add_paragraph(clean_line, style='List Bullet')
    
    buffer = BytesIO()
    document.save(buffer)
    buffer.seek(0)
    return buffer

# --- CORE AI FUNCTIONS ---
def parse_resume_to_json(resume_text: str) -> ResumeProfile:
    global client
    if not client: print("AI client not available."); return None
    
    prompt = ("You are an expert career data analyst. Your job is to extract all relevant "
        "professional information from the user's resume text and structure it "
        "according to the provided JSON schema...")

    try:
        response = client.models.generate_content(model="gemini-2.5-flash", contents=[prompt + f"---RESUME TEXT---\n{resume_text}"], config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=ResumeProfile))
        return ResumeProfile(**json.loads(response.text))
    except Exception as e:
        print(f"AI Parsing Error: {e}"); return None

def generate_cover_letter(profile_json: str, job_description: str, tone: str) -> str:
    global client
    if not client: return "Error: Gemini client not initialized."
    
    prompt = f"""You are an expert career coach and professional writer. Your task is to write a highly persuasive cover letter tailored to a specific job description, drawing upon the candidate's provided resume profile.
    
    Candidate Profile (JSON):
    {profile_json}

    Job Description:
    {job_description}

    Desired Tone: {tone}

    Instructions:
    1. Address the letter to "Hiring Manager".
    2. Start with a strong opening that highlights a key achievement or skill relevant to the job.
    3. In the body, connect the candidate's experience and skills (from the profile) directly to the requirements and responsibilities mentioned in the job description. Use specific examples where possible.
    4. Maintain the specified tone throughout the letter.
    5. Conclude with a strong call to action, expressing enthusiasm for an interview.
    6. Keep the letter concise, ideally one page.
    7. Do not include a physical address or date.
    """
    try:
        response = client.models.generate_content(model="gemini-2.5-flash", contents=[prompt])
        return response.text
    except Exception as e:
        print(f"Cover Letter API Error: {e}"); return None

def generate_optimization_report(profile_json: str, job_description: str) -> dict:
    global client
    if not client: return None
    
    prompt = f"""You are an expert Applicant Tracking System (ATS) and career consultant. Your task is to analyze a candidate's resume profile against a target job description and provide an optimization report.

    Candidate Profile (JSON):
    {profile_json}

    Job Description:
    {job_description}

    Instructions:
    1. Calculate a 'match_score' from 0 to 100, indicating how well the profile aligns with the job description.
    2. Identify 'keyword_gaps': 3-5 critical skills or keywords from the job description that are missing or underrepresented in the candidate's profile.
    3. Provide 'suggestions': 3 actionable, specific recommendations to improve the candidate's profile for this job, focusing on incorporating missing keywords or rephrasing existing experience.
    4. Ensure the output strictly adheres to the OptimizationReport JSON schema.
    """
    try:
        response = client.models.generate_content(model="gemini-2.5-flash", contents=[prompt], config=types.GenerateContentConfig(response_mime_type="application/json", response_schema=OptimizationReport))
        return json.loads(response.text)
    except Exception as e:
        print(f"Optimization API Error: {e}"); return None

def generate_final_feedback(history: list, role: str, type: str, profile_json: str) -> str:
    global client
    if not client: return "Error: Gemini client not initialized."
    
    transcript = "\n".join([f"**{m['role'].upper()}:** {m['text']}" for m in history])
    prompt = f"""You are a professional Interview Performance Analyst. Analyze the following interview transcript and provide comprehensive feedback.

    Interview Role: {role}
    Question Type: {type}
    Candidate Profile (JSON):
    {profile_json}

    --- INTERVIEW TRANSCRIPT ---
    {transcript}
    --- END TRANSCRIPT ---

    Instructions:
    1. Provide an overall score (e.g., X/100).
    2. List 3-5 key strengths demonstrated by the candidate.
    3. List 3-5 specific areas for improvement, with actionable advice.
    4. Suggest 2-3 learning resources (e.g., articles, courses, topics) relevant to the improvement areas.
    5. Format the feedback clearly with headings for each section.
    """

    try:
        response = client.models.generate_content(model="gemini-2.5-flash", contents=[prompt])
        return response.text
    except Exception as e:
        print(f"Final Feedback API Error: {e}"); return "Failed to generate final feedback report."
# --- END CORE AI FUNCTIONS ---


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}) # Allow CORS from your frontend

# Health Check
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "OK", "message": "Python Backend API is running"})

# Endpoint to parse resume
@app.route('/api/optimizer/parse-resume', methods=['POST'])
def parse_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    resume_text = ""
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension == "pdf":
        resume_text = read_pdf(file.stream)
    elif file_extension == "docx":
        resume_text = read_docx(file.stream)
    else:
        return jsonify({"error": "Unsupported file type"}), 400

    profile = parse_resume_to_json(resume_text)
    if profile:
        return jsonify(profile.model_dump()), 200
    return jsonify({"error": "Failed to parse resume"}), 500

# Endpoint to analyze job description
@app.route('/api/optimizer/analyze', methods=['POST'])
def analyze_jd():
    try:
        data = request.get_json()
        jd = data.get('jd')
        profile_data = data.get('profile')

        if not jd or not profile_data:
            return jsonify({"error": "Missing jd or profile data"}), 400
        
        # Ensure profile_data is a JSON string for the AI function
        profile_json_str = json.dumps(profile_data)

        report = generate_optimization_report(profile_json_str, jd)
        if report:
            return jsonify(report), 200
        return jsonify({"error": "Failed to generate optimization report"}), 500
    except Exception as e:
        print(f"Error in analyze_jd: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

# Endpoint to generate documents (resume/cover letter)
@app.route('/api/optimizer/generate-documents', methods=['POST'])
def generate_documents():
    data = request.get_json()
    profile_data = data.get('profile')
    jd = data.get('jd')
    style = data.get('style', 'minimalist') # Default style

    if not profile_data:
        return jsonify({"error": "Missing profile data"}), 400

    profile = ResumeProfile(**profile_data)

    # Generate resume (PDF and DOCX)
    pdf_buffer = generate_pdf_v2(profile)
    docx_buffer = generate_docx_v2(profile)

    # Generate cover letter
    cover_letter_text = generate_cover_letter(profile.model_dump_json(), jd, style)

    # Encode the generated files in base64
    pdf_base64 = base64.b64encode(pdf_buffer.getvalue()).decode('utf-8')
    docx_base64 = base64.b64encode(docx_buffer.getvalue()).decode('utf-8')

    return jsonify({
        "documents": {
            "resume_pdf_base64": pdf_base64,
            "resume_docx_base64": docx_base64,
            "cover_letter": cover_letter_text
        },
        "message": "Documents generated successfully."
    }), 200

# Endpoint to start an interview
@app.route('/api/interview/start', methods=['POST'])
def start_interview():
    data = request.get_json()
    user_id = data.get('userId')
    jd = data.get('jd')
    job_title = data.get('jobTitle')

    if not user_id or not jd or not job_title:
        return jsonify({"error": "Missing user_id, jd, or job_title"}), 400

    # Initialize a new chat session for the interview
    # This is a simplified approach. In a real app, you'd manage session state more robustly.
    system_instruction = f"""You are a professional, rigorous technical interviewer. You are interviewing the candidate for the role of '{job_title}' focused on 'Technical' questions. The candidate's profile data is based on the provided JD. Rules: 1. You must start by welcoming the candidate and asking the first question ONLY. DO NOT INCLUDE ANY FEEDBACK YET. 2. After this initial welcome and question, provide brief, constructive feedback on the candidate's previous response and ask the next question in the sequence. 3. Do not rush or give too much information at once. Maintain a professional tone. 4. The interview should last for 5 questions total."""
    
    if not client:
        return jsonify({"error": "AI client not initialized"}), 500

    chat_session = client.chats.create(model="gemini-2.5-flash", history=[types.Content(role="user", parts=[types.Part.from_text(text=system_instruction)])])
    initial_response = chat_session.send_message("Please start the interview now.")

    # Store chat session (e.g., in a dictionary or database for real applications)
    # For this example, we'll just return the first message and a dummy interview ID
    interview_id = "interview_" + str(os.urandom(16).hex()) # Generate a unique ID
    
    # In a real application, you'd store the chat_session object or its history
    # associated with the interview_id. For this example, we'll simulate it.
    
    # This is a temporary way to store the chat session. For a production app,
    # you'd use a proper session management system (e.g., Redis, database).
    # We'll use a global dictionary for demonstration purposes.
    if not hasattr(app, 'interview_sessions'):
        app.interview_sessions = {}
    app.interview_sessions[interview_id] = {
        "chat_session": chat_session,
        "history": [{"role": "interviewer", "text": initial_response.text}],
        "job_title": job_title,
        "jd": jd,
        "user_id": user_id,
        "done": False
    }

    return jsonify({
        "interview": {
            "id": interview_id,
            "job": job_title,
            "msgs": [{"role": "interviewer", "text": initial_response.text}],
            "done": False
        }
    }), 200

# Endpoint to send an answer during an interview
@app.route('/api/interview/answer', methods=['POST'])
def interview_answer():
    data = request.get_json()
    interview_id = data.get('interviewId')
    answer = data.get('answer')

    if not interview_id or not answer:
        return jsonify({"error": "Missing interviewId or answer"}), 400

    if not hasattr(app, 'interview_sessions') or interview_id not in app.interview_sessions:
        return jsonify({"error": "Interview session not found"}), 404

    session_data = app.interview_sessions[interview_id]
    chat_session = session_data["chat_session"]
    history = session_data["history"]

    history.append({"role": "you", "text": answer})

    if not client:
        return jsonify({"error": "AI client not initialized"}), 500

    response = chat_session.send_message(answer)
    history.append({"role": "interviewer", "text": response.text})

    # Update the session data
    app.interview_sessions[interview_id]["history"] = history

    return jsonify({
        "interview": {
            "id": interview_id,
            "job": session_data["job_title"],
            "msgs": history,
            "done": False # Interview is not done until explicitly ended
        }
    }), 200

# Endpoint to end an interview
@app.route('/api/interview/end', methods=['POST'])
def end_interview():
    data = request.get_json()
    interview_id = data.get('interviewId')

    if not interview_id:
        return jsonify({"error": "Missing interviewId"}), 400

    if not hasattr(app, 'interview_sessions') or interview_id not in app.interview_sessions:
        return jsonify({"error": "Interview session not found"}), 404

    session_data = app.interview_sessions[interview_id]
    history = session_data["history"]
    job_title = session_data["job_title"]
    jd = session_data["jd"] # Assuming JD is stored or can be retrieved
    user_id = session_data["user_id"] # Assuming user_id is stored

    # For generating final feedback, we need the parsed profile.
    # In a real app, this would be retrieved from a database or session.
    # For now, we'll use a dummy profile or assume it's passed.
    # Let's assume for this example that the profile was parsed and stored somewhere accessible
    # or we can re-parse it from the JD if needed.
    # For now, we'll use a placeholder.
    dummy_profile = ResumeProfile(
        name="Candidate Name",
        email="candidate@example.com",
        summary="A highly motivated individual.",
        skills=["Python", "JavaScript"],
        experience=[]
    )
    
    # Convert history to the format expected by generate_final_feedback
    formatted_history = [{"role": msg["role"], "text": msg["text"]} for msg in history]

    feedback_report = generate_final_feedback(
        history=formatted_history,
        role=job_title,
        type="Technical", # Assuming technical for now, can be passed from frontend
        profile_json=dummy_profile.model_dump_json() # Use dummy or retrieve actual profile
    )

    session_data["done"] = True
    session_data["feedback"] = feedback_report
    app.interview_sessions[interview_id] = session_data # Update session

    return jsonify({
        "interview": {
            "id": interview_id,
            "job": job_title,
            "msgs": history,
            "done": True,
            "feedback": {
                "score": 85, # Placeholder score
                "strengths": ["Clear communication", "Good problem-solving"],
                "improvements": ["More specific examples", "Better handling of edge cases"],
                "resources": [{"title": "Advanced Algorithms", "url": "http://example.com/algo"}]
            }
        }
    }), 200


if __name__ == '__main__':
    app.run(port=8080, debug=True)
