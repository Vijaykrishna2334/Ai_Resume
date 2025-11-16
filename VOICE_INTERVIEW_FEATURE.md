# Voice Interview Feature Documentation

## Overview

The Voice Interview feature is an advanced AI-powered mock interview system that analyzes not just the content of your answers, but also your voice delivery, pace, confidence, and speaking patterns. It provides comprehensive coaching to help you improve both what you say and how you say it.

## Key Features

### 1. **Interactive Voice Interview**
- **Text-to-Speech Questions**: The AI speaks questions to you using the Web Speech API
- **Voice Recording**: Record your answers using your microphone
- **Real-time Transcription**: See your answers transcribed in real-time as you speak
- **Natural Flow**: Answer questions naturally as if in a real interview

### 2. **Comprehensive Voice Analysis**

The system analyzes multiple dimensions of your voice delivery:

#### Speaking Metrics
- **Words Per Minute (WPM)**: Measures your speaking pace
  - Optimal range: 130-150 WPM
  - Too fast (>180 WPM): May sound rushed or nervous
  - Too slow (<90 WPM): May lose listener engagement

- **Pause Analysis**: Tracks pauses during your answer
  - Counts total pauses (>500ms gaps)
  - Calculates average pause duration
  - Identifies whether pauses are intentional or due to uncertainty

- **Filler Words**: Detects and counts filler words like:
  - "um", "uh", "like", "you know"
  - "actually", "basically", "literally"

#### Voice Characteristics
- **Confidence Level**: Rated as low, medium, or high based on:
  - Speaking pace stability
  - Number of filler words
  - Pause patterns

- **Clarity**: Rated as poor, fair, good, or excellent
  - Based on optimal speaking pace
  - Filler word frequency
  - Overall coherence

- **Energy Level**: Rated as low, medium, or high
  - Determined by speaking pace
  - Pause frequency and duration
  - Overall delivery momentum

### 3. **Dual Feedback System**

#### Content Feedback
- Evaluates the substance of your answer
- Assesses relevance to the question
- Checks for structure and examples
- Provides content score (0-100)

#### Delivery Feedback
- Focuses on how you delivered the answer
- Analyzes voice metrics and patterns
- Provides specific coaching on improvement areas
- Provides delivery score (0-100)

### 4. **Personalized Voice Coaching**

For each answer, you receive targeted coaching on:

- **Pace Advice**: Specific guidance on adjusting your speaking speed
- **Pause Advice**: How to use intentional pauses effectively
- **Confidence Advice**: Techniques to sound more assured
- **Energy Advice**: How to maintain engagement and enthusiasm

### 5. **Resource Recommendations**

The system suggests:
- **Videos**: Tutorials on specific speaking techniques
- **Articles**: In-depth guides on interview skills
- **Courses**: Comprehensive training programs
- **Exercises**: Practical drills to improve specific aspects

Each resource includes:
- Priority level (high/medium/low)
- Type (video/article/course)
- Description of how it helps
- Direct link to access

### 6. **Comprehensive Final Report**

After completing all questions, you receive:

#### Overall Assessment
- **Overall Score**: Combined content and delivery score
- **Content Score**: Average across all answers
- **Delivery Score**: Average voice metrics score

#### Voice Profile
- Average speaking speed across interview
- Optimal WPM range recommendation
- Pace consistency analysis
- Confidence trend throughout interview

#### Detailed Analysis
- **Key Strengths**: Top 3-5 things you did well
- **Key Improvements**: Top 3-5 areas to focus on
- **Action Plan**: Week-by-week improvement roadmap
- **Recommended Resources**: Curated learning materials

#### Interview Readiness
- **Ready Status**: Are you ready for the real interview?
- **Estimated Success Rate**: Predicted likelihood of success (%)
- **Next Steps**: What to do before your real interview

## Technical Implementation

### Frontend Components

#### VoiceRecorder Component
Location: `src/components/VoiceRecorder.tsx`

Features:
- Uses Web Speech API (`SpeechRecognition`)
- Continuous recording with interim results
- Automatic pause detection (>500ms gaps)
- Live transcript display
- Browser compatibility checking
- Visual recording indicator

#### Voice Interview Page
Location: `src/app/dashboard/voice-interview/page.tsx`

Features:
- Multi-step interview flow (Setup → Interview → Feedback → Report)
- Text-to-Speech integration for questions
- Real-time voice metrics display
- Question-by-question feedback
- Comprehensive final report with visualizations

### Backend Services

#### VoiceInterviewBot Service
Location: `src/lib/services/voice-interview-bot.ts`

Methods:
- `analyzeVoice()`: Calculates voice metrics from transcript and timing data
- `generateVoiceFeedback()`: Uses Gemini 2.5 Pro to generate detailed coaching
- `generateVoiceInterviewReport()`: Creates comprehensive final report

Voice Metrics Calculated:
- Words per minute
- Pause count and average duration
- Confidence level
- Clarity rating
- Energy level
- Filler word count

### API Endpoints

#### POST /api/voice-interview/start
Starts a new voice interview session

Request:
```json
{
  "jobTitle": "Software Engineer",
  "questionCount": 5
}
```

Response:
```json
{
  "interviewId": "clx...",
  "jobTitle": "Software Engineer",
  "totalQuestions": 5,
  "currentQuestion": 0,
  "question": "Tell me about yourself..."
}
```

#### POST /api/voice-interview/[id]/answer
Submits a voice answer and gets feedback

Request:
```json
{
  "transcript": "I am a software engineer...",
  "duration": 45.5,
  "pauseData": [800, 1200, 600],
  "questionIndex": 0
}
```

Response:
```json
{
  "success": true,
  "voiceAnalysis": {
    "wordsPerMinute": 145,
    "pauseCount": 3,
    "avgPauseDuration": 867,
    "confidenceLevel": "high",
    "clarity": "good",
    "energyLevel": "medium",
    "fillerWords": 2,
    "totalDuration": 45.5
  },
  "feedback": { /* detailed feedback object */ },
  "hasMore": true,
  "nextQuestion": "What are your strengths?",
  "currentQuestion": 1,
  "totalQuestions": 5
}
```

#### POST /api/voice-interview/[id]/complete
Completes interview and generates final report

Response:
```json
{
  "success": true,
  "interviewId": "clx...",
  "jobTitle": "Software Engineer",
  "questionsAnswered": 5,
  "report": {
    "overallScore": 78,
    "contentScore": 82,
    "deliveryScore": 74,
    "summary": "Overall strong performance...",
    "keyStrengths": [...],
    "keyImprovements": [...],
    "voiceProfile": {...},
    "actionPlan": [...],
    "recommendedResources": [...],
    "readyForInterview": true,
    "estimatedSuccessRate": 75
  }
}
```

## Browser Compatibility

### Web Speech API Support
- ✅ Google Chrome (Desktop & Android)
- ✅ Microsoft Edge
- ✅ Safari (macOS & iOS)
- ⚠️ Firefox (limited support)
- ❌ Internet Explorer (not supported)

The application includes automatic browser detection and displays a helpful error message if the browser doesn't support voice recognition.

## AI Models Used

### Gemini 2.5 Pro
- Used for: Complex feedback generation and comprehensive reports
- Temperature: 0.7 (balanced creativity and accuracy)
- Cost: $1.25/1M input tokens, $5.00/1M output tokens

### Token Approximation
Since Gemini doesn't expose exact token counts, the system approximates:
- Tokens ≈ character count / 4
- Tracked for cost monitoring and API usage analytics

## Usage Cost Estimation

Example cost for a 5-question voice interview:
- Question generation: ~$0.001
- 5 answer feedbacks: ~$0.015
- Final report: ~$0.005
- **Total: ~$0.021 per interview**

All costs are tracked in the `ApiUsage` table for analytics.

## User Flow

1. **Setup**
   - User navigates to /dashboard/voice-interview
   - Enters job title and number of questions
   - Optionally enables/disables text-to-speech

2. **Interview**
   - AI speaks first question (if TTS enabled)
   - User clicks "Start Speaking" and answers
   - Real-time transcription appears
   - User clicks "Stop & Submit" when done

3. **Immediate Feedback**
   - Voice metrics displayed instantly
   - Content and delivery scores shown
   - Detailed coaching provided
   - Resources recommended
   - User clicks "Continue" for next question

4. **Final Report**
   - After last question, comprehensive report generated
   - Overall scores and voice profile displayed
   - Action plan with week-by-week improvement steps
   - Curated resources for improvement
   - Interview readiness assessment

## Future Enhancements

Potential improvements for future versions:

1. **Advanced Voice Analysis**
   - Tone and emotion detection
   - Vocal variety analysis
   - Pitch and volume tracking

2. **Comparison Features**
   - Compare with industry benchmarks
   - Track improvement over multiple interviews
   - Side-by-side comparison of attempts

3. **Additional TTS Options**
   - Multiple voice personas
   - Different accents and languages
   - Adjustable speaking speed

4. **Recording Playback**
   - Save and replay your answers
   - Visual waveform display
   - Highlighted problem areas

5. **Collaborative Features**
   - Share reports with mentors
   - Get feedback from human coaches
   - Peer review system

## Troubleshooting

### Microphone Not Working
- Ensure browser has microphone permissions
- Check system microphone settings
- Try a different browser (Chrome recommended)

### TTS Not Speaking
- Verify browser supports SpeechSynthesis API
- Check system volume settings
- Try refreshing the page

### Transcription Inaccurate
- Speak clearly and at moderate pace
- Reduce background noise
- Use a quality microphone
- Check internet connection (some browsers use cloud-based recognition)

### Interview Not Starting
- Ensure you're logged in
- Check GEMINI_API_KEY is configured
- Verify database connection
- Check browser console for errors

## Best Practices for Users

1. **Environment Setup**
   - Find a quiet space
   - Use a quality microphone
   - Test your equipment first

2. **During Interview**
   - Speak clearly and naturally
   - Don't rush - take your time
   - Use the repeat button if needed
   - Review your transcript before submitting

3. **After Interview**
   - Read all feedback carefully
   - Note your scores and trends
   - Follow the action plan
   - Access recommended resources
   - Practice regularly for improvement

## Privacy & Data

- Voice recordings are NOT stored
- Only transcripts and metrics are saved
- All data belongs to the user
- Can be deleted anytime from profile settings
- No third-party sharing of interview data
