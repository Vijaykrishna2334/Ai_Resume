import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { JobAggregationService } from "@/lib/services/job-aggregation";
import { JobMatchingService } from "@/lib/services/job-matching";
import { EmailNotificationService } from "@/lib/services/email-notification";

// POST - Manually trigger job matching and notification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        jobAlertPreferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.jobAlertPreferences) {
      return NextResponse.json(
        { error: "Job alert preferences not configured" },
        { status: 400 }
      );
    }

    if (!user.jobAlertPreferences.enabled) {
      return NextResponse.json(
        { error: "Job alerts are disabled" },
        { status: 400 }
      );
    }

    if (!user.profile) {
      return NextResponse.json(
        { error: "Profile not found. Please complete your profile first." },
        { status: 400 }
      );
    }

    // Initialize services
    const jobAggregation = new JobAggregationService();
    const jobMatching = new JobMatchingService();
    const emailService = new EmailNotificationService();

    const preferences = user.jobAlertPreferences;

    // Build user profile for matching
    const userProfile = {
      summary: user.profile.summary || "",
      skills: user.profile.skills || [],
      experience: (user.profile.experience as any[]) || [],
      education: (user.profile.education as any[]) || [],
      desiredRoles: preferences.desiredRoles || [],
      locations: preferences.locations || [],
      jobTypes: preferences.jobTypes || [],
    };

    // Build search parameters
    const searchParams = jobMatching.buildSearchParams(userProfile, preferences);

    // 1. Fetch jobs from aggregators
    console.log("Fetching jobs...", searchParams);
    const jobs = await jobAggregation.fetchJobs(searchParams);

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No jobs found matching your criteria",
        jobsFetched: 0,
        jobsMatched: 0,
        emailSent: false,
      });
    }

    // 2. Save jobs to database
    await jobAggregation.saveJobs(jobs);

    // 3. Get saved jobs from database
    const savedJobs = await prisma.job.findMany({
      where: {
        isActive: true,
        OR: jobs.map(j => ({
          source: j.source,
          externalId: j.externalId,
        })),
      },
      take: 50,
    });

    // 4. Match jobs against user profile
    console.log(`Matching ${savedJobs.length} jobs against user profile...`);
    const matches = await jobMatching.matchUserToJobs(
      user.id,
      userProfile,
      savedJobs,
      preferences.minMatchScore
    );

    // 5. Save matches to database
    await jobMatching.saveJobMatches(user.id, matches);

    // 6. Get top matches
    const topMatches = matches.slice(0, preferences.maxJobsPerDay);

    if (topMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No jobs met the minimum match score threshold",
        jobsFetched: jobs.length,
        jobsMatched: 0,
        emailSent: false,
      });
    }

    // 7. Prepare email data
    const matchesWithJobs = await Promise.all(
      topMatches.map(async (match) => {
        const job = await prisma.job.findUnique({
          where: { id: match.jobId },
        });

        return {
          job: job!,
          matchScore: match.matchScore,
          matchReason: match.matchReason,
          strengths: match.strengths,
          gaps: match.gaps,
        };
      })
    );

    // 8. Send email
    const emailSuccess = await emailService.sendJobMatchesEmail({
      userEmail: preferences.notificationEmail,
      userName: user.name || "there",
      matches: matchesWithJobs,
    });

    // 9. Mark matches as sent if email was successful
    if (emailSuccess) {
      const matchIds = topMatches.map(m => m.jobId);
      const dbMatches = await prisma.jobMatch.findMany({
        where: {
          userId: user.id,
          jobId: { in: matchIds },
        },
      });

      await jobMatching.markMatchesAsSent(dbMatches.map(m => m.id));

      // Update last sent timestamp
      await prisma.jobAlertPreferences.update({
        where: { userId: user.id },
        data: { lastSentAt: new Date() },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Job matching completed successfully",
      jobsFetched: jobs.length,
      jobsMatched: matches.length,
      topMatches: topMatches.length,
      emailSent: emailSuccess,
      matches: topMatches.map(m => ({
        jobId: m.jobId,
        matchScore: m.matchScore,
        matchReason: m.matchReason,
      })),
    });
  } catch (error) {
    console.error("Trigger job alerts error:", error);
    return NextResponse.json(
      {
        error: "Failed to process job alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
