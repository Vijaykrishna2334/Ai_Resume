import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InterviewBot } from "@/lib/services/interview-bot";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const startSchema = z.object({
  jobTitle: z.string().min(2),
  questionCount: z.number().min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = startSchema.parse(body);

    const bot = new InterviewBot();
    const questions = await bot.generateQuestions(
      validated.jobTitle,
      validated.questionCount || 5,
      (session.user as any).id
    );

    // Create mock interview record
    const interview = await prisma.mockInterview.create({
      data: {
        userId: (session.user as any).id,
        jobTitle: validated.jobTitle,
        questions: questions.map(q => ({ question: q, answer: null })) as any,
      }
    });

    return NextResponse.json({
      interviewId: interview.id,
      questions: questions,
    });
  } catch (error: any) {
    console.error("Start interview error:", error);
    return NextResponse.json(
      { error: "Failed to start interview: " + error.message },
      { status: 500 }
    );
  }
}
