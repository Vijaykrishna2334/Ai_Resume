import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PDFGenerator } from "@/lib/services/pdf-generator";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { z } from "zod";

const generateSchema = z.object({
  template: z.enum(["minimalist", "technical", "creative"]).optional(),
  type: z.enum(["resume", "cover_letter"]),
  applicationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = generateSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: (session.user as any).id },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const generator = new PDFGenerator();
    let pdfBuffer: Buffer;
    let fileName: string;
    let documentType: "GENERATED_RESUME" | "COVER_LETTER";

    if (validated.type === "resume") {
      pdfBuffer = await generator.generateResume(profile, validated.template || "minimalist");
      fileName = `resume-${validated.template || "minimalist"}-${Date.now()}.pdf`;
      documentType = "GENERATED_RESUME";
    } else {
      // For cover letter, we need the application with the generated content
      if (!validated.applicationId) {
        return NextResponse.json({ error: "Application ID required for cover letter" }, { status: 400 });
      }

      const application = await prisma.application.findUnique({
        where: { id: validated.applicationId }
      });

      if (!application) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }

      // Generate cover letter content (placeholder - should come from optimizer)
      const coverLetterContent = `Dear Hiring Manager,

I am writing to express my strong interest in the ${application.position} position at ${application.company}.

With my background and skills, I am confident that I would be a valuable addition to your team.

Thank you for considering my application.`;

      pdfBuffer = await generator.generateCoverLetter(coverLetterContent, profile);
      fileName = `cover-letter-${application.company.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      documentType = "COVER_LETTER";
    }

    // Save PDF
    const uploadsDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, pdfBuffer);

    // Save document record
    const document = await prisma.document.create({
      data: {
        userId: (session.user as any).id,
        applicationId: validated.applicationId,
        type: documentType,
        fileName,
        fileUrl: `/uploads/${fileName}`,
        filePath,
        mimeType: "application/pdf",
        metadata: {
          template: validated.template || "minimalist",
          generated: true,
        },
      }
    });

    return NextResponse.json({
      documentId: document.id,
      downloadUrl: document.fileUrl,
      fileName: document.fileName,
    });
  } catch (error: any) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate document: " + error.message },
      { status: 500 }
    );
  }
}
