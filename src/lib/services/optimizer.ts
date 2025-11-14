import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

export class ResumeOptimizer {
  async analyzeJobDescription(jd: string, userId: string): Promise<JDAnalysis> {
    const prompt = `Analyze this job description and extract key information. Return ONLY valid JSON with no markdown formatting or code blocks.

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

    // Use Gemini 2.0 Flash for fast analysis
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text_response = response.text();

    // Parse JSON response
    let parsed;
    try {
      const cleanText = text_response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch (error) {
      console.error("Failed to parse Gemini response:", text_response);
      throw new Error("Failed to analyze job description");
    }

    await this.trackUsage(userId, "analyze_jd", "gemini-2.0-flash-exp", prompt, text_response);

    return parsed;
  }

  calculateMatchScore(profile: any, jdAnalysis: JDAnalysis): number {
    const userSkills = new Set(profile.skills.map((s: string) => s.toLowerCase()));
    const requiredSkills = new Set(jdAnalysis.requiredSkills.map(s => s.toLowerCase()));
    const allJobSkills = new Set([
      ...jdAnalysis.requiredSkills,
      ...jdAnalysis.preferredSkills
    ].map(s => s.toLowerCase()));

    let requiredMatches = 0;
    requiredSkills.forEach(skill => {
      if (userSkills.has(skill)) requiredMatches++;
    });

    const requiredScore = (requiredMatches / requiredSkills.size) * 70;

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
    matchScore: number,
    userId: string
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

Return ONLY valid JSON with no markdown formatting:
{
  "suggestions": [
    {
      "type": "skill|experience|keyword|summary",
      "priority": "high|medium|low",
      "title": "Brief title",
      "description": "Detailed suggestion",
      "example": "Specific example if applicable"
    }
  ]
}`;

    // Use Gemini Pro 1.5 for more complex reasoning
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
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
      return [];
    }

    await this.trackUsage(userId, "generate_suggestions", "gemini-1.5-pro", prompt, text_response);

    return parsed.suggestions || [];
  }

  async generateCoverLetter(
    profile: any,
    jdAnalysis: JDAnalysis,
    company: string,
    position: string,
    userId: string
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

    // Use Gemini Pro 1.5 for creative writing
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.8,
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text_response = response.text();

    await this.trackUsage(userId, "generate_cover_letter", "gemini-1.5-pro", prompt, text_response);

    return text_response || "";
  }

  private async trackUsage(userId: string, endpoint: string, model: string, prompt: string, response: string) {
    const tokensIn = Math.ceil(prompt.length / 4); // Approximate
    const tokensOut = Math.ceil(response.length / 4); // Approximate

    // Pricing varies by model
    let inputCostPer1M, outputCostPer1M;

    if (model === "gemini-2.0-flash-exp") {
      // Gemini 2.0 Flash pricing
      inputCostPer1M = 0.075;
      outputCostPer1M = 0.30;
    } else {
      // Gemini 1.5 Pro pricing
      inputCostPer1M = 1.25;
      outputCostPer1M = 5.00;
    }

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
