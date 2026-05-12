import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { InterviewBot } from "@/lib/services/interview-bot";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { jobTitle, questionCount = 5 } = await req.json();

    if (!jobTitle) {
      return NextResponse.json(
        { error: "Job title is required" },
        { status: 400 }
      );
    }

    // Generate interview questions
    const interviewBot = new InterviewBot();
    const questions = await interviewBot.generateQuestions(
      jobTitle,
      questionCount,
      user.id
    );

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate questions" },
        { status: 500 }
      );
    }

    // Create mock interview session
    const interview = await prisma.mockInterview.create({
      data: {
        userId: user.id,
        jobTitle,
        questions: questions.map((q) => ({
          question: q,
          answer: null,
          voiceAnalysis: null,
          feedback: null,
        })),
        feedback: null,
        completed: false,
      },
    });

    return NextResponse.json({
      interviewId: interview.id,
      jobTitle: interview.jobTitle,
      totalQuestions: questions.length,
      currentQuestion: 0,
      question: questions[0],
    });
  } catch (error) {
    console.error("Voice interview start error:", error);
    return NextResponse.json(
      { error: "Failed to start voice interview" },
      { status: 500 }
    );
  }
}
