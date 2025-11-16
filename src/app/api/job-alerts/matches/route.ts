import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - Get user's job matches
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const includeViewed = searchParams.get("includeViewed") === "true";

    const whereClause: any = {
      userId: user.id,
    };

    if (!includeViewed) {
      whereClause.viewedAt = null;
    }

    const matches = await prisma.jobMatch.findMany({
      where: whereClause,
      include: {
        job: true,
      },
      orderBy: [
        { matchScore: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    // Mark as viewed
    const matchIds = matches.filter(m => !m.viewedAt).map(m => m.id);
    if (matchIds.length > 0) {
      await prisma.jobMatch.updateMany({
        where: {
          id: { in: matchIds },
        },
        data: {
          viewedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      total: matches.length,
      matches: matches.map(m => ({
        id: m.id,
        matchScore: m.matchScore,
        matchReason: m.matchReason,
        sentAt: m.sentAt,
        viewedAt: m.viewedAt,
        appliedAt: m.appliedAt,
        createdAt: m.createdAt,
        job: {
          id: m.job.id,
          title: m.job.title,
          company: m.job.company,
          location: m.job.location,
          jobType: m.job.jobType,
          experienceLevel: m.job.experienceLevel,
          description: m.job.description,
          requirements: m.job.requirements,
          salary: m.job.salary,
          source: m.job.source,
          jobUrl: m.job.jobUrl,
          postedAt: m.job.postedAt,
        },
      })),
    });
  } catch (error) {
    console.error("Get matches error:", error);
    return NextResponse.json(
      { error: "Failed to get matches" },
      { status: 500 }
    );
  }
}
