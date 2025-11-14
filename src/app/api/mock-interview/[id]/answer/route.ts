import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InterviewBot } from "@/lib/services/interview-bot";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const answerSchema = z.object({
  questionIndex: z.number().min(0),
  answer: z.string().min(10),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = answerSchema.parse(body);

    const interview = await prisma.mockInterview.findUnique({
      where: { id: params.id }
    });

    if (!interview || interview.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Update questions with answer
    const questions = interview.questions as any[];
    if (validated.questionIndex >= questions.length) {
      return NextResponse.json({ error: "Invalid question index" }, { status: 400 });
    }

    questions[validated.questionIndex].answer = validated.answer;

    // Get feedback for this answer
    const bot = new InterviewBot();
    const feedback = await bot.evaluateAnswer(
      questions[validated.questionIndex].question,
      validated.answer,
      interview.jobTitle || "this position",
      (session.user as any).id
    );

    questions[validated.questionIndex].feedback = feedback;

    // Update interview
    await prisma.mockInterview.update({
      where: { id: params.id },
      data: { questions: questions as any }
    });

    return NextResponse.json({
      feedback,
      nextQuestion: validated.questionIndex + 1 < questions.length
        ? questions[validated.questionIndex + 1].question
        : null,
    });
  } catch (error: any) {
    console.error("Answer error:", error);
    return NextResponse.json(
      { error: "Failed to process answer: " + error.message },
      { status: 500 }
    );
  }
}
