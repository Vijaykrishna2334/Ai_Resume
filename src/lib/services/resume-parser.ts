import pdf from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface ParsedResume {
  name: string;
  email: string;
  phone?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate?: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    tech: string[];
  }>;
}

export class ResumeParser {
  async parseFile(file: Buffer, mimeType: string, userId: string): Promise<ParsedResume> {
    const rawText = await this.extractText(file, mimeType);
    const structured = await this.structureWithAI(rawText, userId);
    return structured;
  }

  private async extractText(file: Buffer, mimeType: string): Promise<string> {
    if (mimeType === "application/pdf") {
      const data = await pdf(file);
      return data.text;
    } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer: file });
      return result.value;
    } else {
      throw new Error("Unsupported file type");
    }
  }

  private async structureWithAI(text: string, userId: string): Promise<ParsedResume> {
    const prompt = `Extract structured information from this resume. Return ONLY valid JSON with no markdown formatting or code blocks.

Resume text:
${text}

Return format:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "summary": "professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "startDate": "YYYY-MM",
      "endDate": "YYYY-MM or null if current",
      "bullets": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University",
      "degree": "Degree",
      "field": "Field of Study",
      "year": "YYYY"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Description",
      "tech": ["tech1", "tech2"]
    }
  ]
}`;

    // Use Gemini 2.0 Flash for fast, cost-effective parsing
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
      // Remove markdown code blocks if present
      const cleanText = text_response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanText);
    } catch (error) {
      console.error("Failed to parse Gemini response:", text_response);
      throw new Error("Failed to parse resume data from AI response");
    }

    // Track API usage (Gemini doesn't provide token counts in same way)
    await this.trackUsage({
      userId,
      endpoint: "parse_resume",
      provider: "gemini",
      model: "gemini-2.0-flash-exp",
      tokensIn: Math.ceil(prompt.length / 4), // Approximate
      tokensOut: Math.ceil(text_response.length / 4), // Approximate
    });

    return parsed;
  }

  private async trackUsage(usage: any) {
    // Gemini Flash pricing: $0.075 per 1M input tokens, $0.30 per 1M output tokens
    const inputCostPer1M = 0.075;
    const outputCostPer1M = 0.30;
    const cost = (usage.tokensIn / 1000000) * inputCostPer1M + (usage.tokensOut / 1000000) * outputCostPer1M;

    await prisma.apiUsage.create({
      data: {
        ...usage,
        cost,
      }
    });
  }
}
