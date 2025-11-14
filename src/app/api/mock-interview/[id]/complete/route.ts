import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InterviewBot } from "@/lib/services/interview-bot";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: params.id }
    });

    if (!interview || interview.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Generate overall feedback
    const bot = new InterviewBot();
    const feedback = await bot.generateFeedback(interview, (session.user as any).id);

    // Update interview with feedback and completion
    await prisma.mockInterview.update({
      where: { id: params.id },
      data: {
        feedback: feedback as any,
        completedAt: new Date(),
      }
    });

    return NextResponse.json({
      feedback,
      completedAt: new Date(),
    });
  } catch (error: any) {
    console.error("Complete interview error:", error);
    return NextResponse.json(
      { error: "Failed to complete interview: " + error.message },
      { status: 500 }
    );
  }
}
