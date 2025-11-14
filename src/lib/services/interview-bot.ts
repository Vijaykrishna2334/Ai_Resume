import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export class InterviewBot {
  async generateQuestions(jobTitle: string, count: number = 5, userId: string): Promise<string[]> {
    const prompt = `Generate ${count} common interview questions for a ${jobTitle} position.
Return ONLY valid JSON with no markdown formatting or code blocks.

Format: { "questions": ["Question 1?", "Question 2?", ...] }`;

    // Use Gemini 2.0 Flash for fast question generation
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
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

    await this.trackUsage(userId, "generate_questions", "gemini-2.0-flash-exp", prompt, text_response);

    return parsed.questions || [];
  }

  async evaluateAnswer(question: string, answer: string, jobTitle: string, userId: string): Promise<string> {
    const prompt = `As an interview coach, evaluate this answer for a ${jobTitle} interview.

Question: ${question}
Answer: ${answer}

Provide constructive feedback focusing on:
1. Strength of the answer
2. Areas for improvement
3. Specific suggestions to enhance the response

Keep feedback concise and actionable.`;

    // Use Gemini 1.5 Pro for better evaluation reasoning
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.7,
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text_response = response.text();

    await this.trackUsage(userId, "evaluate_answer", "gemini-1.5-pro", prompt, text_response);

    return text_response || "";
  }

  async generateFeedback(interview: any, userId: string): Promise<any> {
    const prompt = `Analyze this mock interview and provide comprehensive feedback.

Job Title: ${interview.jobTitle}
Questions and Answers:
${JSON.stringify(interview.questions, null, 2)}

Provide feedback in ONLY valid JSON with no markdown formatting:
{
  "overall": "Overall assessment (2-3 sentences)",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Area 1", "Area 2", "Area 3"],
  "score": 75,
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    // Use Gemini 1.5 Pro for comprehensive analysis
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
      return {};
    }

    await this.trackUsage(userId, "generate_feedback", "gemini-1.5-pro", prompt, text_response);

    return parsed;
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
