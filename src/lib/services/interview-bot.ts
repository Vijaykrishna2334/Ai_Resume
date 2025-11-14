import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class InterviewBot {
  async generateQuestions(jobTitle: string, count: number = 5, userId: string): Promise<string[]> {
    const prompt = `Generate ${count} common interview questions for a ${jobTitle} position.
Return JSON array of questions only.

Format: { "questions": ["Question 1?", "Question 2?", ...] }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an interview preparation expert. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    await this.trackUsage(userId, "generate_questions", completion);

    const result = JSON.parse(completion.choices[0].message.content || "{ \"questions\": [] }");
    return result.questions || [];
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an experienced interview coach providing helpful feedback." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    await this.trackUsage(userId, "evaluate_answer", completion);

    return completion.choices[0].message.content || "";
  }

  async generateFeedback(interview: any, userId: string): Promise<any> {
    const prompt = `Analyze this mock interview and provide comprehensive feedback.

Job Title: ${interview.jobTitle}
Questions and Answers:
${JSON.stringify(interview.questions, null, 2)}

Provide feedback in JSON format:
{
  "overall": "Overall assessment (2-3 sentences)",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "improvements": ["Area 1", "Area 2", "Area 3"],
  "score": 75,
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an interview expert providing detailed feedback. Always return valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    await this.trackUsage(userId, "generate_feedback", completion);

    return JSON.parse(completion.choices[0].message.content || "{}");
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
