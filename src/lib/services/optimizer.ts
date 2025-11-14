import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    await this.trackUsage(userId, "analyze_jd", completion);

    return JSON.parse(completion.choices[0].message.content || "{}");
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

Return JSON:
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a resume expert. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    await this.trackUsage(userId, "generate_suggestions", completion);

    const result = JSON.parse(completion.choices[0].message.content || "{ \"suggestions\": [] }");
    return result.suggestions || [];
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a professional cover letter writer." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
    });

    await this.trackUsage(userId, "generate_cover_letter", completion);

    return completion.choices[0].message.content || "";
  }

  private async trackUsage(userId: string, endpoint: string, completion: any) {
    const costPer1kTokens = 0.01;
    const totalTokens = (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0);
    const cost = (totalTokens / 1000) * costPer1kTokens;

    await prisma.apiUsage.create({
      data: {
        userId,
        endpoint,
        provider: "openai",
        model: "gpt-4-turbo",
        tokensIn: completion.usage?.prompt_tokens || 0,
        tokensOut: completion.usage?.completion_tokens || 0,
        cost,
      }
    });
  }
}
