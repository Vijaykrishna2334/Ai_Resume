import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST - Mark a job match as applied
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

    const match = await prisma.jobMatch.findUnique({
      where: { id: params.id },
      include: { job: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update match
    await prisma.jobMatch.update({
      where: { id: params.id },
      data: { appliedAt: new Date() },
    });

    // Optionally create an application record
    const body = await req.json();
    if (body.createApplication) {
      await prisma.application.create({
        data: {
          userId: user.id,
          company: match.job.company,
          position: match.job.title,
          jobUrl: match.job.jobUrl,
          jobDescription: match.job.description,
          status: "APPLIED",
          matchScore: match.matchScore,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Marked as applied",
    });
  } catch (error) {
    console.error("Mark as applied error:", error);
    return NextResponse.json(
      { error: "Failed to mark as applied" },
      { status: 500 }
    );
  }
}
