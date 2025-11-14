import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const applicationSchema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  jobUrl: z.string().url().optional(),
  jobDescription: z.string().min(50),
  status: z.enum(["SAVED", "APPLIED", "INTERVIEWING", "OFFER", "REJECTED", "ACCEPTED", "DECLINED"]).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { userId: (session.user as any).id },
    include: {
      interviews: true,
      documents: {
        select: {
          id: true,
          type: true,
          fileName: true,
          fileUrl: true,
          createdAt: true,
        }
      }
    },
    orderBy: { appliedAt: 'desc' }
  });

  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = applicationSchema.parse(body);

    const application = await prisma.application.create({
      data: {
        userId: (session.user as any).id,
        ...validated,
        status: validated.status || "SAVED",
      }
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Application error:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
