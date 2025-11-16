import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { VoiceInterviewBot } from "@/lib/services/voice-interview-bot";

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

    const { transcript, duration, pauseData, questionIndex } = await req.json();

    if (!transcript || duration === undefined || questionIndex === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
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

    const questions = interview.questions as any[];

    if (questionIndex >= questions.length) {
      return NextResponse.json(
        { error: "Invalid question index" },
        { status: 400 }
      );
    }

    // Analyze voice
    const voiceBot = new VoiceInterviewBot();
    const voiceAnalysis = voiceBot.analyzeVoice(transcript, duration, pauseData);

    // Generate feedback for this answer
    const feedback = await voiceBot.generateVoiceFeedback(
      questions[questionIndex].question,
      transcript,
      voiceAnalysis,
      interview.jobTitle,
      user.id
    );

    // Update the question with answer, voice analysis, and feedback
    questions[questionIndex] = {
      ...questions[questionIndex],
      answer: transcript,
      voiceAnalysis,
      feedback,
    };

    // Update interview
    await prisma.mockInterview.update({
      where: { id: params.id },
      data: {
        questions,
      },
    });

    // Check if there are more questions
    const nextIndex = questionIndex + 1;
    const hasMore = nextIndex < questions.length;

    return NextResponse.json({
      success: true,
      voiceAnalysis,
      feedback,
      hasMore,
      nextQuestion: hasMore ? questions[nextIndex].question : null,
      currentQuestion: nextIndex,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error("Voice interview answer error:", error);
    return NextResponse.json(
      { error: "Failed to process answer" },
      { status: 500 }
    );
  }
}
