import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobAggregationService } from "@/lib/services/job-aggregation";
import { JobMatchingService } from "@/lib/services/job-matching";
import { EmailNotificationService } from "@/lib/services/email-notification";

/**
 * Cron job endpoint for processing job alerts
 *
 * This endpoint should be called by a cron scheduler (Vercel Cron, GitHub Actions, etc.)
 * to process job alerts for all users who have them enabled.
 *
 * Security: Verify the request is from a trusted source using CRON_SECRET
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[CRON] Starting job alerts processing...");

    // Get current UTC time
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;

    console.log(`[CRON] Current UTC time: ${currentTime}`);

    // Find all users who should receive alerts at this time
    // For simplicity, we'll check within a 1-hour window
    const users = await prisma.user.findMany({
      where: {
        jobAlertPreferences: {
          enabled: true,
          // We'll filter by time in code since Prisma doesn't support time comparison directly
        },
      },
      include: {
        profile: true,
        jobAlertPreferences: true,
      },
    });

    console.log(`[CRON] Found ${users.length} users with job alerts enabled`);

    const processedUsers: string[] = [];
    const errors: string[] = [];

    for (const user of users) {
      try {
        const prefs = user.jobAlertPreferences!;

        // Check if it's time to send alerts for this user
        // Convert user's preferred time to their timezone and check if it matches current time
        // For MVP, we'll just use UTC time comparison
        const userTime = prefs.notificationTime;

        // Simple time matching (within 1 hour window)
        const [userHour, userMinute] = userTime.split(":").map(Number);
        const timeDiff = Math.abs(currentHour - userHour) * 60 + (currentMinute - userMinute);

        // Skip if not within 60-minute window
        if (timeDiff > 60) {
          continue;
        }

        // Check if we already sent alerts today
        if (prefs.lastSentAt) {
          const lastSent = new Date(prefs.lastSentAt);
          const hoursSinceLastSent = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);

          // Skip if sent within last 20 hours (to avoid duplicate sends)
          if (hoursSinceLastSent < 20) {
            console.log(`[CRON] Skipping user ${user.email} - already sent ${hoursSinceLastSent.toFixed(1)}h ago`);
            continue;
          }
        }

        console.log(`[CRON] Processing user: ${user.email}`);

        // Initialize services
        const jobAggregation = new JobAggregationService();
        const jobMatching = new JobMatchingService();
        const emailService = new EmailNotificationService();

        // Build user profile
        const userProfile = {
          summary: user.profile?.summary || "",
          skills: user.profile?.skills || [],
          experience: (user.profile?.experience as any[]) || [],
          education: (user.profile?.education as any[]) || [],
          desiredRoles: prefs.desiredRoles || [],
          locations: prefs.locations || [],
          jobTypes: prefs.jobTypes || [],
        };

        // Build search parameters
        const searchParams = jobMatching.buildSearchParams(userProfile, prefs);

        // Fetch jobs
        const jobs = await jobAggregation.fetchJobs(searchParams);

        if (jobs.length === 0) {
          console.log(`[CRON] No jobs found for ${user.email}`);
          continue;
        }

        // Save jobs to database
        await jobAggregation.saveJobs(jobs);

        // Get saved jobs
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

        // Match jobs
        const matches = await jobMatching.matchUserToJobs(
          user.id,
          userProfile,
          savedJobs,
          prefs.minMatchScore
        );

        // Save matches
        await jobMatching.saveJobMatches(user.id, matches);

        // Get top matches
        const topMatches = matches.slice(0, prefs.maxJobsPerDay);

        if (topMatches.length === 0) {
          console.log(`[CRON] No matches above threshold for ${user.email}`);
          continue;
        }

        // Prepare email data
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

        // Send email
        const emailSuccess = await emailService.sendJobMatchesEmail({
          userEmail: prefs.notificationEmail,
          userName: user.name || "there",
          matches: matchesWithJobs,
        });

        if (emailSuccess) {
          // Mark matches as sent
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
            data: { lastSentAt: now },
          });

          processedUsers.push(user.email);
          console.log(`[CRON] ✓ Successfully processed ${user.email} - sent ${topMatches.length} matches`);
        } else {
          errors.push(`Failed to send email to ${user.email}`);
          console.error(`[CRON] ✗ Failed to send email to ${user.email}`);
        }
      } catch (userError) {
        const errorMsg = `Error processing user ${user.email}: ${userError}`;
        errors.push(errorMsg);
        console.error(`[CRON] ${errorMsg}`);
      }
    }

    const summary = {
      success: true,
      timestamp: now.toISOString(),
      totalUsersWithAlerts: users.length,
      usersProcessed: processedUsers.length,
      processedUsers,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("[CRON] Job alerts processing completed:", summary);

    return NextResponse.json(summary);
  } catch (error) {
    console.error("[CRON] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process job alerts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Allow POST as well for manual triggering
export async function POST(req: NextRequest) {
  return GET(req);
}
