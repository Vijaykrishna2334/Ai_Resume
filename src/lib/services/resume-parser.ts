import pdf from "pdf-parse";
import mammoth from "mammoth";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
    const prompt = `Extract structured information from this resume. Return JSON only.

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are a resume parser. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    // Track API usage
    await this.trackUsage({
      userId,
      endpoint: "parse_resume",
      provider: "openai",
      model: "gpt-4-turbo",
      tokensIn: completion.usage?.prompt_tokens || 0,
      tokensOut: completion.usage?.completion_tokens || 0,
    });

    return result;
  }

  private async trackUsage(usage: any) {
    const costPer1kTokens = 0.01;
    const totalTokens = usage.tokensIn + usage.tokensOut;
    const cost = (totalTokens / 1000) * costPer1kTokens;

    await prisma.apiUsage.create({
      data: {
        ...usage,
        cost,
      }
    });
  }
}
