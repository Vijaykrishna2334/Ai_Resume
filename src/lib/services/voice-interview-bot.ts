import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface VoiceAnalysis {
  wordsPerMinute: number;
  pauseCount: number;
  avgPauseDuration: number;
  confidenceLevel: "low" | "medium" | "high";
  clarity: "poor" | "fair" | "good" | "excellent";
  energyLevel: "low" | "medium" | "high";
  fillerWords: number;
  totalDuration: number;
}

export interface VoiceInterviewQuestion {
  question: string;
  transcript: string;
  voiceAnalysis: VoiceAnalysis;
  feedback: string;
}

export class VoiceInterviewBot {
  /**
   * Analyzes voice characteristics from speech transcript and timing data
   */
  analyzeVoice(
    transcript: string,
    duration: number, // in seconds
    pauseData?: number[] // array of pause durations in ms
  ): VoiceAnalysis {
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const wordsPerMinute = Math.round((wordCount / duration) * 60);

    // Detect filler words
    const fillerWords = ["um", "uh", "like", "you know", "actually", "basically", "literally"];
    const fillerCount = words.filter(w =>
      fillerWords.includes(w.toLowerCase())
    ).length;

    // Analyze pauses
    const pauseCount = pauseData?.length || 0;
    const avgPauseDuration = pauseCount > 0
      ? pauseData!.reduce((a, b) => a + b, 0) / pauseCount
      : 0;

    // Determine confidence level based on metrics
    let confidenceLevel: "low" | "medium" | "high" = "medium";
    if (wordsPerMinute < 100 || fillerCount > 5 || avgPauseDuration > 2000) {
      confidenceLevel = "low";
    } else if (wordsPerMinute >= 130 && wordsPerMinute <= 160 && fillerCount <= 2) {
      confidenceLevel = "high";
    }

    // Determine clarity based on speech rate
    let clarity: "poor" | "fair" | "good" | "excellent" = "fair";
    if (wordsPerMinute >= 120 && wordsPerMinute <= 150 && fillerCount <= 2) {
      clarity = "excellent";
    } else if (wordsPerMinute >= 110 && wordsPerMinute <= 170 && fillerCount <= 4) {
      clarity = "good";
    } else if (wordsPerMinute < 90 || wordsPerMinute > 180 || fillerCount > 6) {
      clarity = "poor";
    }

    // Energy level based on speaking rate and pauses
    let energyLevel: "low" | "medium" | "high" = "medium";
    if (wordsPerMinute > 150 && avgPauseDuration < 1000) {
      energyLevel = "high";
    } else if (wordsPerMinute < 100 || avgPauseDuration > 2000) {
      energyLevel = "low";
    }

    return {
      wordsPerMinute,
      pauseCount,
      avgPauseDuration: Math.round(avgPauseDuration),
      confidenceLevel,
      clarity,
      energyLevel,
      fillerWords: fillerCount,
      totalDuration: duration,
    };
  }

  /**
   * Generates voice-specific feedback and improvement resources
   */
  async generateVoiceFeedback(
    question: string,
    transcript: string,
    voiceAnalysis: VoiceAnalysis,
    jobTitle: string,
    userId: string
  ): Promise<any> {
    const prompt = `As a professional interview coach, evaluate this voice interview answer.

Question: ${question}
Answer (Transcript): ${transcript}

Voice Metrics:
- Speaking Speed: ${voiceAnalysis.wordsPerMinute} words/minute
- Pauses: ${voiceAnalysis.pauseCount} pauses (avg ${voiceAnalysis.avgPauseDuration}ms)
- Confidence Level: ${voiceAnalysis.confidenceLevel}
- Clarity: ${voiceAnalysis.clarity}
- Energy: ${voiceAnalysis.energyLevel}
- Filler Words: ${voiceAnalysis.fillerWords}

Provide detailed feedback in JSON format:
{
  "contentScore": 85,
  "contentFeedback": "Your answer covered the main points well...",
  "deliveryScore": 75,
  "deliveryFeedback": "Your speaking pace was good, but reduce filler words...",
  "strengths": ["Good structure", "Clear examples"],
  "improvements": ["Reduce 'um' and 'uh'", "Speak slightly slower"],
  "voiceCoaching": {
    "paceAdvice": "Your current pace of ${voiceAnalysis.wordsPerMinute} WPM is...",
    "pauseAdvice": "Try to use intentional pauses for emphasis...",
    "confidenceAdvice": "To sound more confident, reduce filler words...",
    "energyAdvice": "Your energy level is ${voiceAnalysis.energyLevel}..."
  },
  "resources": [
    {
      "title": "Reducing Filler Words",
      "type": "video",
      "url": "https://www.youtube.com/watch?v=example",
      "description": "Techniques to eliminate 'um' and 'uh'"
    },
    {
      "title": "Speaking Pace Training",
      "type": "article",
      "url": "https://example.com/speaking-pace",
      "description": "How to find your optimal speaking speed"
    }
  ],
  "exerciseSuggestions": [
    "Practice answering this question 3 more times, focusing on reducing pauses",
    "Record yourself speaking for 2 minutes without any filler words",
    "Try the 'power pause' technique: pause 2-3 seconds before key points"
  ]
}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text_response = response.text();

    let parsed;
    try {
      const cleanText = text_response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch (error) {
      console.error("Failed to parse Gemini response:", text_response);
      return this.getDefaultFeedback(voiceAnalysis);
    }

    await this.trackUsage(userId, "voice_feedback", "gemini-2.5-pro", prompt, text_response);

    return parsed;
  }

  /**
   * Generates comprehensive voice interview report
   */
  async generateVoiceInterviewReport(
    questions: VoiceInterviewQuestion[],
    jobTitle: string,
    userId: string
  ): Promise<any> {
    const avgWPM = questions.reduce((sum, q) => sum + q.voiceAnalysis.wordsPerMinute, 0) / questions.length;
    const totalFillers = questions.reduce((sum, q) => sum + q.voiceAnalysis.fillerWords, 0);

    const prompt = `Analyze this complete voice mock interview and provide a comprehensive report.

Job Title: ${jobTitle}
Number of Questions: ${questions.length}
Average Speaking Speed: ${Math.round(avgWPM)} WPM
Total Filler Words: ${totalFillers}

Questions & Answers:
${JSON.stringify(questions.map(q => ({
  question: q.question,
  transcript: q.transcript,
  voiceMetrics: q.voiceAnalysis
})), null, 2)}

Provide a comprehensive report in JSON format:
{
  "overallScore": 78,
  "contentScore": 82,
  "deliveryScore": 74,
  "summary": "Overall strong performance with room for improvement in delivery...",
  "keyStrengths": [
    "Consistent speaking pace across all answers",
    "Good use of examples and structure"
  ],
  "keyImprovements": [
    "Reduce filler words (${totalFillers} total)",
    "Work on confidence - detected nervous pauses"
  ],
  "voiceProfile": {
    "averageWPM": ${Math.round(avgWPM)},
    "optimalWPM": "130-150",
    "paceConsistency": "good|fair|poor",
    "confidenceTrend": "Your confidence improved|decreased|stayed steady throughout"
  },
  "actionPlan": [
    "Week 1: Practice reducing filler words - aim for max 2 per answer",
    "Week 2: Work on intentional pausing for emphasis",
    "Week 3: Speed drills - practice at 140 WPM"
  ],
  "recommendedResources": [
    {
      "title": "Resource title",
      "type": "video|article|course",
      "url": "https://...",
      "description": "Why this helps you",
      "priority": "high|medium|low"
    }
  ],
  "readyForInterview": true,
  "estimatedSuccessRate": 75
}`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text_response = response.text();

    let parsed;
    try {
      const cleanText = text_response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch (error) {
      console.error("Failed to parse Gemini response:", text_response);
      return {};
    }

    await this.trackUsage(userId, "voice_report", "gemini-2.5-pro", prompt, text_response);

    return parsed;
  }

  private getDefaultFeedback(voiceAnalysis: VoiceAnalysis): any {
    return {
      contentScore: 70,
      contentFeedback: "Good answer with room for improvement",
      deliveryScore: 65,
      deliveryFeedback: `Your speaking pace is ${voiceAnalysis.wordsPerMinute} WPM. Aim for 130-150 WPM.`,
      strengths: ["Completed the answer"],
      improvements: ["Reduce filler words", "Improve pacing"],
      voiceCoaching: {
        paceAdvice: `Your pace of ${voiceAnalysis.wordsPerMinute} WPM needs adjustment. Aim for 130-150 WPM.`,
        pauseAdvice: "Use intentional pauses for emphasis.",
        confidenceAdvice: "Reduce filler words to sound more confident.",
        energyAdvice: `Your energy level is ${voiceAnalysis.energyLevel}.`
      },
      resources: [],
      exerciseSuggestions: ["Practice your answer again focusing on clarity"]
    };
  }

  private async trackUsage(userId: string, endpoint: string, model: string, prompt: string, response: string) {
    const tokensIn = Math.ceil(prompt.length / 4);
    const tokensOut = Math.ceil(response.length / 4);

    const inputCostPer1M = 1.25;
    const outputCostPer1M = 5.00;
    const cost = (tokensIn / 1000000) * inputCostPer1M + (tokensOut / 1000000) * outputCostPer1M;

    await prisma.apiUsage.create({
      data: {
        userId,
        endpoint,
        provider: "gemini",
        model,
        tokensIn,
        tokensOut,
        cost,
      }
    });
  }
}
