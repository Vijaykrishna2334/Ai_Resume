import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - Get user's job alert preferences
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        jobAlertPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      preferences: user.jobAlertPreferences,
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

// POST - Create or update job alert preferences
export async function POST(req: NextRequest) {
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

    const body = await req.json();

    const {
      enabled,
      notificationEmail,
      notificationTime,
      timezone,
      maxJobsPerDay,
      minMatchScore,
      desiredRoles,
      locations,
      jobTypes,
      experienceLevels,
      salaryMin,
      salaryMax,
    } = body;

    // Validate required fields
    if (!notificationEmail) {
      return NextResponse.json(
        { error: "Notification email is required" },
        { status: 400 }
      );
    }

    if (!notificationTime) {
      return NextResponse.json(
        { error: "Notification time is required" },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(notificationTime)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM (24-hour format)" },
        { status: 400 }
      );
    }

    // Create or update preferences
    const preferences = await prisma.jobAlertPreferences.upsert({
      where: { userId: user.id },
      update: {
        enabled: enabled !== undefined ? enabled : true,
        notificationEmail,
        notificationTime,
        timezone: timezone || "UTC",
        maxJobsPerDay: maxJobsPerDay || 10,
        minMatchScore: minMatchScore || 70,
        desiredRoles: desiredRoles || [],
        locations: locations || [],
        jobTypes: jobTypes || [],
        experienceLevels: experienceLevels || [],
        salaryMin,
        salaryMax,
      },
      create: {
        userId: user.id,
        enabled: enabled !== undefined ? enabled : true,
        notificationEmail,
        notificationTime,
        timezone: timezone || "UTC",
        maxJobsPerDay: maxJobsPerDay || 10,
        minMatchScore: minMatchScore || 70,
        desiredRoles: desiredRoles || [],
        locations: locations || [],
        jobTypes: jobTypes || [],
        experienceLevels: experienceLevels || [],
        salaryMin,
        salaryMax,
      },
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

// PUT - Update specific preference fields
export async function PUT(req: NextRequest) {
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

    const body = await req.json();

    // Check if preferences exist
    const existing = await prisma.jobAlertPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Preferences not found. Create preferences first using POST." },
        { status: 404 }
      );
    }

    // Update only provided fields
    const preferences = await prisma.jobAlertPreferences.update({
      where: { userId: user.id },
      data: body,
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}

// DELETE - Delete job alert preferences
export async function DELETE(req: NextRequest) {
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

    await prisma.jobAlertPreferences.delete({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Preferences deleted successfully",
    });
  } catch (error) {
    console.error("Delete preferences error:", error);
    return NextResponse.json(
      { error: "Failed to delete preferences" },
      { status: 500 }
    );
  }
}
