import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PortfolioGenerator } from "@/lib/services/portfolio-generator";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { z } from "zod";

const portfolioSchema = z.object({
  template: z.enum(["minimalist", "modern", "creative"]).optional(),
  publish: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: (session.user as any).id }
  });

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  return NextResponse.json(portfolio);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = portfolioSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: (session.user as any).id },
      include: { user: { select: { name: true, email: true } } }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id }
    });

    // Generate unique slug
    const baseSlug = generateSlug(user?.name || 'user');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomSuffix}`;

    // Generate HTML
    const generator = new PortfolioGenerator();
    const html = generator.generateHTML(profile, validated.template || "minimalist");

    // Save HTML file
    const portfolioDir = join(process.cwd(), "public", "portfolios");
    if (!existsSync(portfolioDir)) {
      await mkdir(portfolioDir, { recursive: true });
    }

    const filePath = join(portfolioDir, `${slug}.html`);
    await writeFile(filePath, html);

    // Create or update portfolio record
    const portfolio = await prisma.portfolio.upsert({
      where: { userId: (session.user as any).id },
      update: {
        slug,
        template: validated.template || "minimalist",
        isPublished: validated.publish || false,
        publishedAt: validated.publish ? new Date() : null,
      },
      create: {
        userId: (session.user as any).id,
        slug,
        template: validated.template || "minimalist",
        isPublished: validated.publish || false,
        publishedAt: validated.publish ? new Date() : null,
      }
    });

    return NextResponse.json({
      portfolio,
      url: `/portfolios/${slug}.html`,
      publicUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/portfolios/${slug}.html`,
    });
  } catch (error: any) {
    console.error("Portfolio error:", error);
    return NextResponse.json(
      { error: "Failed to generate portfolio: " + error.message },
      { status: 500 }
    );
  }
}
