import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResumeParser } from "@/lib/services/resume-parser";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Please upload PDF or DOCX." }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max size is 5MB." }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Save file
    const fileName = `${(session.user as any).id}-${Date.now()}-${file.name}`;
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Parse resume
    const parser = new ResumeParser();
    const parsed = await parser.parseFile(buffer, file.type, (session.user as any).id);

    // Save document record
    const document = await prisma.document.create({
      data: {
        userId: (session.user as any).id,
        type: "UPLOADED_RESUME",
        fileName: file.name,
        fileUrl: `/uploads/${fileName}`,
        filePath,
        mimeType: file.type,
      }
    });

    // Update or create profile with parsed data
    await prisma.profile.upsert({
      where: { userId: (session.user as any).id },
      update: {
        skills: parsed.skills,
        experience: parsed.experience as any,
        education: parsed.education as any,
        projects: parsed.projects as any,
        summary: parsed.summary,
        rawResumeData: parsed as any,
      },
      create: {
        userId: (session.user as any).id,
        skills: parsed.skills,
        experience: parsed.experience as any,
        education: parsed.education as any,
        projects: parsed.projects as any,
        summary: parsed.summary,
        rawResumeData: parsed as any,
      }
    });

    return NextResponse.json({
      document,
      parsed,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process resume: " + error.message },
      { status: 500 }
    );
  }
}
