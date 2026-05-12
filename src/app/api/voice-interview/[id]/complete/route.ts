import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { VoiceInterviewBot, VoiceInterviewQuestion } from "@/lib/services/voice-interview-bot";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the interview
    const interview = await prisma.mockInterview.findUnique({
      where: { id: params.id },
    });

    if (!interview || interview.userId !== user.id) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    if (interview.completed) {
      return NextResponse.json(
        { error: "Interview already completed" },
        { status: 400 }
      );
    }

    const questions = interview.questions as any[];

    // Ensure all questions have been answered
    const unanswered = questions.filter((q) => !q.answer);
    if (unanswered.length > 0) {
      return NextResponse.json(
        {
          error: "Not all questions have been answered",
          unansweredCount: unanswered.length
        },
        { status: 400 }
      );
    }

    // Generate comprehensive voice interview report
    const voiceBot = new VoiceInterviewBot();
    const report = await voiceBot.generateVoiceInterviewReport(
      questions as VoiceInterviewQuestion[],
      interview.jobTitle,
      user.id
    );

    // Update interview with final report and mark as completed
    await prisma.mockInterview.update({
      where: { id: params.id },
      data: {
        feedback: report,
        completed: true,
      },
    });

    return NextResponse.json({
      success: true,
      interviewId: interview.id,
      jobTitle: interview.jobTitle,
      questionsAnswered: questions.length,
      report,
    });
  } catch (error) {
    console.error("Voice interview complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete interview" },
      { status: 500 }
    );
  }
}
