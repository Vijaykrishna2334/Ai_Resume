import { prisma } from "../prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface UserProfile {
  summary?: string;
  skills: string[];
  experience: any[];
  education: any[];
  desiredRoles?: string[];
  locations?: string[];
  jobTypes?: string[];
}

export interface JobMatchResult {
  jobId: string;
  matchScore: number;
  matchReason: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export class JobMatchingService {
  /**
   * Match user profile against multiple jobs and return ranked matches
   */
  async matchUserToJobs(
    userId: string,
    userProfile: UserProfile,
    jobs: any[],
    minMatchScore: number = 70
  ): Promise<JobMatchResult[]> {
    try {
      const matches: JobMatchResult[] = [];

      for (const job of jobs) {
        const match = await this.matchSingleJob(userProfile, job, userId);

        if (match.matchScore >= minMatchScore) {
          matches.push(match);
        }
      }

      // Sort by match score descending
      matches.sort((a, b) => b.matchScore - a.matchScore);

      return matches;
    } catch (error) {
      console.error("Error matching jobs:", error);
      throw error;
    }
  }

  /**
   * Match user profile against a single job using Gemini AI
   */
  private async matchSingleJob(
    userProfile: UserProfile,
    job: any,
    userId: string
  ): Promise<JobMatchResult> {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // Using Flash for cost efficiency
        generationConfig: {
          temperature: 0.3, // Lower temperature for more consistent scoring
          responseMimeType: "application/json",
        },
      });

      const prompt = `You are an expert technical recruiter analyzing job-candidate fit.

USER PROFILE:
Summary: ${userProfile.summary || "Not provided"}

Skills: ${userProfile.skills.join(", ")}

Experience:
${JSON.stringify(userProfile.experience, null, 2)}

Education:
${JSON.stringify(userProfile.education, null, 2)}

Desired Roles: ${userProfile.desiredRoles?.join(", ") || "Not specified"}
Preferred Locations: ${userProfile.locations?.join(", ") || "Not specified"}
Preferred Job Types: ${userProfile.jobTypes?.join(", ") || "Not specified"}

JOB POSTING:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || "Not specified"}
Job Type: ${job.jobType || "Not specified"}
Experience Level: ${job.experienceLevel || "Not specified"}

Description:
${job.description}

Requirements:
${job.requirements || "Not specified"}

TASK:
Analyze the match between this candidate and job posting. Return a JSON object with:

{
  "matchScore": <number 0-100>,
  "matchReason": "<2-3 sentence summary of why this is a match>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "gaps": ["<gap 1>", "<gap 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}

SCORING GUIDELINES:
- 90-100: Exceptional fit, highly qualified
- 80-89: Strong fit, very qualified
- 70-79: Good fit, qualified with minor gaps
- 60-69: Moderate fit, some significant gaps
- 50-59: Weak fit, major gaps
- 0-49: Poor fit, not recommended

Consider:
1. Skills match (technical and soft skills)
2. Experience level and years
3. Industry/domain experience
4. Education requirements
5. Location and job type preferences
6. Career trajectory alignment`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Remove markdown code blocks if present
      let jsonText = responseText;
      if (jsonText.includes("```json")) {
        jsonText = jsonText.split("```json")[1].split("```")[0].trim();
      } else if (jsonText.includes("```")) {
        jsonText = jsonText.split("```")[1].split("```")[0].trim();
      }

      const matchData = JSON.parse(jsonText);

      // Track API usage
      const charCount = prompt.length + responseText.length;
      const estimatedTokens = Math.ceil(charCount / 4);

      await prisma.apiUsage.create({
        data: {
          userId,
          endpoint: "/job-matching/match",
          provider: "Google",
          model: "gemini-2.5-flash",
          tokensIn: Math.ceil(prompt.length / 4),
          tokensOut: Math.ceil(responseText.length / 4),
          cost: (estimatedTokens / 1_000_000) * 0.075, // Flash pricing: $0.075/1M tokens
        },
      });

      return {
        jobId: job.id,
        matchScore: matchData.matchScore,
        matchReason: matchData.matchReason,
        strengths: matchData.strengths || [],
        gaps: matchData.gaps || [],
        recommendations: matchData.recommendations || [],
      };
    } catch (error) {
      console.error(`Error matching job ${job.id}:`, error);

      // Return a default low score on error
      return {
        jobId: job.id,
        matchScore: 0,
        matchReason: "Unable to analyze match due to an error",
        strengths: [],
        gaps: [],
        recommendations: [],
      };
    }
  }

  /**
   * Save job matches to the database
   */
  async saveJobMatches(
    userId: string,
    matches: JobMatchResult[]
  ): Promise<void> {
    for (const match of matches) {
      try {
        await prisma.jobMatch.upsert({
          where: {
            userId_jobId: {
              userId,
              jobId: match.jobId,
            },
          },
          update: {
            matchScore: match.matchScore,
            matchReason: match.matchReason,
          },
          create: {
            userId,
            jobId: match.jobId,
            matchScore: match.matchScore,
            matchReason: match.matchReason,
          },
        });
      } catch (error) {
        console.error(`Error saving match for job ${match.jobId}:`, error);
      }
    }
  }

  /**
   * Get top matches for a user from the database
   */
  async getTopMatches(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    const matches = await prisma.jobMatch.findMany({
      where: {
        userId,
        sentAt: null, // Only get unsent matches
      },
      include: {
        job: true,
      },
      orderBy: {
        matchScore: "desc",
      },
      take: limit,
    });

    return matches;
  }

  /**
   * Mark matches as sent
   */
  async markMatchesAsSent(matchIds: string[]): Promise<void> {
    await prisma.jobMatch.updateMany({
      where: {
        id: {
          in: matchIds,
        },
      },
      data: {
        sentAt: new Date(),
      },
    });
  }

  /**
   * Get user's job alert preferences
   */
  async getUserPreferences(userId: string) {
    return await prisma.jobAlertPreferences.findUnique({
      where: { userId },
    });
  }

  /**
   * Build search parameters from user preferences and profile
   */
  buildSearchParams(
    userProfile: UserProfile,
    preferences: any
  ): any {
    return {
      keywords: preferences.desiredRoles || userProfile.desiredRoles || [],
      location: preferences.locations?.[0] || userProfile.locations?.[0],
      jobType: preferences.jobTypes?.[0] || userProfile.jobTypes?.[0],
      experienceLevel: preferences.experienceLevels?.[0],
      salaryMin: preferences.salaryMin,
      salaryMax: preferences.salaryMax,
      maxResults: 50, // Fetch more than needed to filter down to top matches
    };
  }
}
