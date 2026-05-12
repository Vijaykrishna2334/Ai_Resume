import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResumeOptimizer } from "@/lib/services/optimizer";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const optimizeSchema = z.object({
  jobDescription: z.string().min(50),
  company: z.string().optional(),
  position: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = optimizeSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: (session.user as any).id },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found. Please upload a resume first." },
        { status: 404 }
      );
    }

    const optimizer = new ResumeOptimizer();

    // Analyze JD
    const jdAnalysis = await optimizer.analyzeJobDescription(
      validated.jobDescription,
      (session.user as any).id
    );

    // Calculate match score
    const matchScore = optimizer.calculateMatchScore(profile, jdAnalysis);

    // Generate suggestions
    const suggestions = await optimizer.generateSuggestions(
      profile,
      jdAnalysis,
      matchScore,
      (session.user as any).id
    );

    // Save as application if company and position provided
    let application;
    if (validated.company && validated.position) {
      application = await prisma.application.create({
        data: {
          userId: (session.user as any).id,
          company: validated.company,
          position: validated.position,
          jobDescription: validated.jobDescription,
          matchScore,
          status: "SAVED",
        }
      });
    }

    return NextResponse.json({
      matchScore,
      analysis: jdAnalysis,
      suggestions,
      applicationId: application?.id,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Optimize error:", error);
    return NextResponse.json(
      { error: "Failed to optimize resume: " + error.message },
      { status: 500 }
    );
  }
}
