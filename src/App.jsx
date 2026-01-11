import React, { useState, useEffect } from 'react';
import { Upload, FileText, Target, Sparkles, Download, ExternalLink, TrendingUp, Mic, MessageSquare, CheckCircle, Award, AlertCircle } from 'lucide-react';

const base64toBlob = (base64, type) => {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new Blob([arr], { type: type });
};

export default function PortfolioAI() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [jd, setJd] = useState('');
  const [score, setScore] = useState(null);
  const [tips, setTips] = useState([]);
  const [style, setStyle] = useState('minimalist');
  const [docs, setDocs] = useState(null);
  const [apps, setApps] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [current, setCurrent] = useState(null);
  const [response, setResponse] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await window.storage.get('portfolio-data');
      if (data) {
        const parsed = JSON.parse(data.value);
        setUser(parsed.user);
        setProfile(parsed.profile);
        setPortfolio(parsed.portfolio);
        setApps(parsed.apps || []);
        setInterviews(parsed.interviews || []);
      }
    } catch (e) {
      console.log('No data');
    }
  };

  const saveData = async (updates) => {
    const data = {
      user: updates.user || user,
      profile: updates.profile || profile,
      portfolio: updates.portfolio || portfolio,
      apps: updates.apps || apps,
      interviews: updates.interviews || interviews
    };
    await window.storage.set('portfolio-data', JSON.stringify(data));
  };

  const signup = async (email, name) => {
    const newUser = { email, name, date: new Date().toISOString() };
    setUser(newUser);
    await saveData({ user: newUser });
    setView('onboard');
  };

  const upload = (file) => {
    const prof = {
      name: user.name,
      email: user.email,
      summary: 'Passionate developer with modern tech experience',
      skills: ['React', 'JavaScript', 'Node.js', 'Python', 'Git'],
      experience: [{
        title: 'Junior Developer',
        company: 'Tech Startup',
        years: '2023 - Present',
        summary: 'Built responsive web apps with React and Node.js'
      }]
    };
    
    setProfile(prof);
    const url = 'portfolioai.app/' + prof.name.toLowerCase().replace(' ', '-');
    setPortfolio(url);
    setView('dash');
    saveData({ profile: prof, portfolio: url });
  };

  const analyze = async (text) => {
    setJd(text);
    
    // Call real backend API
    try {
      const response = await fetch('http://localhost:8080/api/optimizer/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jd: text,
          profile: profile // profile is already a JSON object
        })
      });
      
      const data = await response.json();
      console.log('Backend response:', data);
      
      setScore(data.score);
      setTips(data.suggestions || []);
    } catch (error) {
      console.error('Error calling backend:', error);
      // Fallback to mock data if backend fails
      const keywords = ['React', 'TypeScript', 'API', 'Agile', 'Testing'];
      const userSkills = profile.skills;
      const matches = keywords.filter(k => userSkills.includes(k));
      const newScore = Math.round((matches.length / keywords.length) * 100);
      setScore(newScore);
      
      const newTips = [
        {
          id: '1',
          title: 'Add TypeScript to skills',
          desc: 'Job requires TypeScript. Add it to your skills.',
          impact: '+15',
          done: false
        },
        {
          id: '2',
          title: 'Enhance project description',
          old: 'Built responsive web apps with React and Node.js',
          suggested: 'Architected scalable web apps with React, Node.js, and RESTful APIs, serving 10K+ users',
          impact: '+10',
          done: false
        },
        {
          id: '3',
          title: 'Highlight Agile experience',
          desc: 'Mention Agile/Scrum in your experience.',
          impact: '+8',
          done: false
        }
      ];
      setTips(newTips);
    }
  };

  const accept = (id) => {
    setTips(prev => prev.map(t => t.id === id ? { ...t, done: true } : t));
    const count = tips.filter(t => t.done || t.id === id).length;
    setScore(prev => Math.min(100, prev + (count * 12)));
  };

  const generate = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/optimizer/generate-documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile: profile,
          jd: jd,
          style: style
        })
      });
      const data = await response.json();

      const pdfBlob = base64toBlob(data.documents.resume_pdf_base64, 'application/pdf');
      const docxBlob = base64toBlob(data.documents.resume_docx_base64, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      setDocs({
        resume_pdf_url: URL.createObjectURL(pdfBlob),
        resume_docx_url: URL.createObjectURL(docxBlob),
        cover_letter: data.documents.cover_letter
      });
    } catch (error) {
      console.error('Error generating documents:', error);
    }
    
    const newApp = {
      id: Date.now().toString(),
      job: 'Software Engineer',
      company: 'Target Company',
      date: new Date().toISOString(),
      score: score
    };
    
    const updated = [...apps, newApp];
    setApps(updated);
    saveData({ apps: updated });
  };

  const startInterview = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/interview/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.email,
          jd: jd,
          jobTitle: 'Software Engineer'
        })
      });
      const data = await response.json();
      setCurrent(data.interview);
      setView('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  const send = async (msg) => {
    try {
      const response = await fetch('http://localhost:8080/api/interview/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          interviewId: current.id,
          answer: msg
        })
      });
      const data = await response.json();
      setCurrent(data.interview);
      setResponse('');
    } catch (error) {
      console.error('Error sending answer:', error);
    }
  };

  const complete = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/interview/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          interviewId: current.id
        })
      });
      const data = await response.json();
      const updated = [...interviews, data.interview];
      setInterviews(updated);
      setCurrent(data.interview);
      saveData({ interviews: updated });
    } catch (error) {
      console.error('Error ending interview:', error);
    }
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-12 h-12 text-indigo-600 mr-2" />
              <h1 className="text-5xl font-bold">PortfolioAI</h1>
            </div>
            <p className="text-2xl text-gray-700 mb-4">Your AI-Powered Career Suite</p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Turn your skills into interview invitations. Get the portfolio, resume, and interview prep you need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <FileText className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Professional Portfolio</h3>
              <p className="text-gray-600">Generate a clean web portfolio from your resume</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <Target className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Smart Optimization</h3>
              <p className="text-gray-600">AI-powered resume optimization increases match by 30%</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <Award className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-bold mb-2">Interview Prep</h3>
              <p className="text-gray-600">Practice with AI mock interviewer and get feedback</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Get Started Free</h2>
            <div>
              <input 
                type="text" 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your Name" 
                className="w-full p-3 border rounded-lg mb-4" 
              />
              <input 
                type="email" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Your Email" 
                className="w-full p-3 border rounded-lg mb-4" 
              />
              <button 
                onClick={() => {
                  if (nameInput && emailInput) {
                    signup(emailInput, nameInput);
                  }
                }} 
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
              >
                Start Building Your Career
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">100% Free. No credit card required.</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'onboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Welcome, {user.name}!</h1>
          <div className="bg-white p-8 rounded-lg shadow-lg mb-6">
            <h2 className="text-xl font-bold mb-4">Upload Your Resume</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Upload resume (PDF or DOCX)</p>
              <input type="file" accept=".pdf,.docx" onChange={(e) => upload(e.target.files[0])} className="hidden" id="up" />
              <label htmlFor="up" className="bg-indigo-600 text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-indigo-700 inline-block">
                Choose File
              </label>
            </div>
          </div>
          <div className="text-center text-gray-500 mb-6">OR</div>
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Fill Out Quick Form</h2>
            <button onClick={() => upload({})} className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200">
              Start Guided Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'dash') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <Sparkles className="w-8 h-8 text-indigo-600 mr-2" />
              <span className="text-xl font-bold">PortfolioAI</span>
            </div>
            <button onClick={() => setView('opt')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              Optimize Resume
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold">{apps.length}</span>
              </div>
              <p className="text-gray-600">Applications Sent</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold">{interviews.length}</span>
              </div>
              <p className="text-gray-600">Mock Interviews</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-purple-600" />
                <span className="text-2xl font-bold">{score || '--'}</span>
              </div>
              <p className="text-gray-600">Latest Match Score</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Your Portfolio</h2>
            {portfolio ? (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Live at:</p>
                  <p className="font-mono text-indigo-600">{portfolio}</p>
                </div>
                <button className="flex items-center text-indigo-600 hover:text-indigo-700">
                  <ExternalLink className="w-5 h-5 mr-1" />
                  View
                </button>
              </div>
            ) : (
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">Generate Portfolio</button>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button onClick={() => setView('opt')} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50">
                <Target className="w-6 h-6 text-indigo-600 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Optimize for a Job</p>
                  <p className="text-sm text-gray-600">Match resume to JD</p>
                </div>
              </button>
              <button onClick={startInterview} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-600 hover:bg-purple-50">
                <Mic className="w-6 h-6 text-purple-600 mr-3" />
                <div className="text-left">
                  <p className="font-semibold">Practice Interview</p>
                  <p className="text-sm text-gray-600">Get AI feedback</p>
                </div>
              </button>
            </div>
          </div>

          {apps.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow mt-6">
              <h2 className="text-xl font-bold mb-4">Recent Applications</h2>
              <div className="space-y-3">
                {apps.slice(-5).reverse().map(app => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{app.job}</p>
                      <p className="text-sm text-gray-600">{app.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-indigo-600">Match: {app.score}%</p>
                      <p className="text-xs text-gray-500">{new Date(app.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'opt') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button onClick={() => setView('dash')} className="text-indigo-600 hover:text-indigo-700">Back</button>
            <span className="text-xl font-bold">Resume Optimizer</span>
            <div></div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-8">Optimize Your Resume</h1>
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold mb-4">Paste Job Description</h2>
            <textarea value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste full job description..." className="w-full h-48 p-4 border rounded-lg resize-none" />
            <button onClick={() => analyze(jd)} disabled={!jd} className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300">
              Analyze Match
            </button>
          </div>

          {score !== null && (
            <>
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <h2 className="text-xl font-bold mb-4">Match Score</h2>
                <div className="flex items-center">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                      <circle cx="64" cy="64" r="56" stroke={score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="12" fill="none" strokeDasharray={score * 3.51 + ' 351'} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold">{score}</span>
                    </div>
                  </div>
                  <div className="ml-8">
                    <p className="text-2xl font-bold mb-2">{score >= 70 ? 'Great Match!' : score >= 50 ? 'Good Match' : 'Needs Work'}</p>
                    <p className="text-gray-600">{score >= 70 ? 'Profile aligns well' : 'Follow suggestions to improve'}</p>
                  </div>
                </div>
              </div>

              {tips.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                  <h2 className="text-xl font-bold mb-4">AI Suggestions</h2>
                  <div className="space-y-4">
                    {tips.map(tip => (
                      <div key={tip.id} className={'p-4 border rounded-lg ' + (tip.done ? 'bg-green-50 border-green-300' : 'border-gray-200')}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{tip.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{tip.desc}</p>
                            {tip.old && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-500">Current:</p>
                                <p className="text-sm italic text-gray-700 mt-1">{tip.old}</p>
                                <p className="text-sm text-gray-500 mt-2">Suggested:</p>
                                <p className="text-sm italic text-green-700 mt-1">{tip.suggested}</p>
                              </div>
                            )}
                          </div>
                          <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">{tip.impact}</span>
                        </div>
                        {!tip.done && (
                          <button onClick={() => accept(tip.id)} className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
                            Accept
                          </button>
                        )}
                        {tip.done && (
                          <div className="mt-2 flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm">Applied</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Generate Package</h2>
                <p className="text-gray-600 mb-4">Choose style:</p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {['minimalist', 'technical', 'creative'].map(s => (
                    <button key={s} onClick={() => setStyle(s)} className={'p-4 border-2 rounded-lg capitalize ' + (style === s ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300')}>
                      {s}
                    </button>
                  ))}
                </div>
                <button onClick={generate} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold">
                  Generate Resume and Cover Letter
                </button>
              </div>

              {docs && (
                <div className="bg-green-50 border border-green-300 p-6 rounded-lg mt-6">
                  <h3 className="text-lg font-bold text-green-800 mb-4">Documents Generated!</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white p-3 rounded">
                      <span>Resume (PDF)</span>
                      <a href={docs.resume_pdf_url} download="resume.pdf" className="flex items-center text-indigo-600 hover:text-indigo-700">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </div>
                    <div className="flex items-center justify-between bg-white p-3 rounded">
                      <span>Resume (DOCX)</span>
                      <a href={docs.resume_docx_url} download="resume.docx" className="flex items-center text-indigo-600 hover:text-indigo-700">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </a>
                    </div>
                    {docs.cover_letter && (
                      <div className="bg-white p-3 rounded">
                        <h4 className="font-semibold mb-2">Cover Letter</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{docs.cover_letter}</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setView('dash')} className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
                    Back to Dashboard
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (view === 'interview') {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button onClick={() => setView('dash')} className="text-indigo-600 hover:text-indigo-700">Exit</button>
            <span className="text-xl font-bold">Mock Interview</span>
            <div></div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto p-8">
          {!current.done ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex items-center mb-4">
                  <MessageSquare className="w-6 h-6 text-purple-600 mr-2" />
                  <h2 className="text-xl font-bold">Practicing for: {current.job}</h2>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {current.msgs.map((msg, i) => (
                    <div key={i} className={'p-4 rounded-lg ' + (msg.role === 'interviewer' ? 'bg-purple-50 border border-purple-200' : 'bg-indigo-50 border border-indigo-200')}>
                      <p className="font-semibold mb-1">{msg.role === 'interviewer' ? 'Interviewer' : 'You'}</p>
                      <p className="text-gray-700">{msg.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Type your answer..." className="w-full h-32 p-4 border rounded-lg resize-none mb-4" />
                  <div className="flex gap-4">
                    <button onClick={() => send(response)} disabled={!response} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300">
                      Send Answer
                    </button>
                    <button onClick={complete} className="px-6 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                      End Interview
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-6">Interview Feedback</h2>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold">Overall Score</span>
                  <span className="text-3xl font-bold text-indigo-600">{current.feedback.score}/100</span>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {current.feedback.strengths.map((s, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Areas to Improve</h3>
                <ul className="space-y-2">
                  {current.feedback.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-lg mb-3">Learning Resources</h3>
                <div className="space-y-2">
                  {current.feedback.resources.map((r, i) => (
                    <a key={i} href={r.url} className="flex items-center p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                      <ExternalLink className="w-4 h-4 text-indigo-600 mr-2" />
                      <span className="text-indigo-600">{r.title}</span>
                    </a>
                  ))}
                </div>
              </div>

              <button onClick={() => setView('dash')} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold">
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

