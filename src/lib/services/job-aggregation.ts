import { prisma } from "../prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface JobSearchParams {
  keywords?: string[];
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  maxResults?: number;
}

export interface JobListing {
  title: string;
  company: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  description: string;
  requirements?: string;
  salary?: string;
  source: string;
  externalId: string;
  jobUrl: string;
  postedAt?: Date;
}

export class JobAggregationService {
  /**
   * Fetch jobs from multiple sources based on search parameters
   */
  async fetchJobs(params: JobSearchParams): Promise<JobListing[]> {
    const jobs: JobListing[] = [];

    try {
      // Try fetching from Adzuna API if configured
      if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_API_KEY) {
        const adzunaJobs = await this.fetchFromAdzuna(params);
        jobs.push(...adzunaJobs);
      }

      // Try fetching from RapidAPI job search if configured
      if (process.env.RAPIDAPI_KEY) {
        const rapidApiJobs = await this.fetchFromRapidAPI(params);
        jobs.push(...rapidApiJobs);
      }

      // If no API keys configured, use demo/test jobs
      if (jobs.length === 0) {
        console.warn("No job API keys configured, using demo jobs");
        const demoJobs = this.getDemoJobs(params);
        jobs.push(...demoJobs);
      }

      // Deduplicate jobs
      const uniqueJobs = this.deduplicateJobs(jobs);

      return uniqueJobs.slice(0, params.maxResults || 50);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }
  }

  /**
   * Fetch jobs from Adzuna API
   * Documentation: https://developer.adzuna.com/overview
   */
  private async fetchFromAdzuna(params: JobSearchParams): Promise<JobListing[]> {
    try {
      const appId = process.env.ADZUNA_APP_ID;
      const apiKey = process.env.ADZUNA_API_KEY;
      const country = process.env.ADZUNA_COUNTRY || "us";

      const keywords = params.keywords?.join(" ") || "";
      const location = params.location || "";
      const resultsPerPage = Math.min(params.maxResults || 20, 50);

      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${apiKey}&results_per_page=${resultsPerPage}&what=${encodeURIComponent(
        keywords
      )}&where=${encodeURIComponent(location)}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error("Adzuna API error:", response.statusText);
        return [];
      }

      const data = await response.json();

      return data.results.map((job: any) => ({
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        jobType: job.contract_type || "Full-time",
        experienceLevel: this.extractExperienceLevel(job.title + " " + job.description),
        description: job.description,
        requirements: "",
        salary: job.salary_min && job.salary_max
          ? `$${job.salary_min.toLocaleString()} - $${job.salary_max.toLocaleString()}`
          : "",
        source: "Adzuna",
        externalId: job.id,
        jobUrl: job.redirect_url,
        postedAt: job.created ? new Date(job.created) : undefined,
      }));
    } catch (error) {
      console.error("Error fetching from Adzuna:", error);
      return [];
    }
  }

  /**
   * Fetch jobs from RapidAPI job search endpoints
   * Example: JSearch API on RapidAPI
   */
  private async fetchFromRapidAPI(params: JobSearchParams): Promise<JobListing[]> {
    try {
      const apiKey = process.env.RAPIDAPI_KEY;
      const keywords = params.keywords?.join(" ") || "";
      const location = params.location || "United States";

      // Using JSearch API as an example
      const url = `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(
        keywords + " in " + location
      )}&page=1&num_pages=1`;

      const response = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": apiKey!,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      });

      if (!response.ok) {
        console.error("RapidAPI error:", response.statusText);
        return [];
      }

      const data = await response.json();

      return (data.data || []).map((job: any) => ({
        title: job.job_title,
        company: job.employer_name,
        location: job.job_city && job.job_state
          ? `${job.job_city}, ${job.job_state}`
          : job.job_country,
        jobType: job.job_employment_type || "Full-time",
        experienceLevel: job.job_required_experience?.required_experience_in_months
          ? this.monthsToExperienceLevel(job.job_required_experience.required_experience_in_months)
          : "",
        description: job.job_description,
        requirements: job.job_highlights?.Qualifications?.join("\n") || "",
        salary: job.job_min_salary && job.job_max_salary
          ? `$${job.job_min_salary.toLocaleString()} - $${job.job_max_salary.toLocaleString()}`
          : "",
        source: "JSearch",
        externalId: job.job_id,
        jobUrl: job.job_apply_link || job.job_google_link,
        postedAt: job.job_posted_at_datetime_utc
          ? new Date(job.job_posted_at_datetime_utc * 1000)
          : undefined,
      }));
    } catch (error) {
      console.error("Error fetching from RapidAPI:", error);
      return [];
    }
  }

  /**
   * Generate demo/test jobs for development and testing
   */
  private getDemoJobs(params: JobSearchParams): JobListing[] {
    const demoJobs: JobListing[] = [
      {
        title: "Senior Software Engineer",
        company: "Tech Innovations Inc",
        location: "San Francisco, CA (Remote)",
        jobType: "Full-time",
        experienceLevel: "Senior",
        description: "We are seeking a Senior Software Engineer to join our dynamic team. You will work on cutting-edge projects using modern technologies including React, Node.js, and cloud infrastructure.",
        requirements: "5+ years of software development experience\nProficiency in JavaScript/TypeScript\nExperience with React and Node.js\nStrong problem-solving skills",
        salary: "$140,000 - $180,000",
        source: "Demo",
        externalId: "demo-1",
        jobUrl: "https://example.com/jobs/demo-1",
        postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Full Stack Developer",
        company: "StartupXYZ",
        location: "New York, NY",
        jobType: "Full-time",
        experienceLevel: "Mid-level",
        description: "Join our fast-growing startup as a Full Stack Developer. Build scalable web applications and work with the latest technologies.",
        requirements: "3+ years of full-stack development\nExperience with React, Node.js, and databases\nFamiliarity with cloud platforms (AWS/GCP)\nExcellent communication skills",
        salary: "$110,000 - $140,000",
        source: "Demo",
        externalId: "demo-2",
        jobUrl: "https://example.com/jobs/demo-2",
        postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Frontend Engineer",
        company: "Digital Solutions Co",
        location: "Remote",
        jobType: "Contract",
        experienceLevel: "Mid-level",
        description: "We need a talented Frontend Engineer to create beautiful, responsive user interfaces. You'll work closely with designers and backend developers.",
        requirements: "4+ years of frontend development\nExpert in React, TypeScript, and CSS\nExperience with state management (Redux/MobX)\nPortfolio of previous work",
        salary: "$60/hour",
        source: "Demo",
        externalId: "demo-3",
        jobUrl: "https://example.com/jobs/demo-3",
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Backend Software Engineer",
        company: "CloudTech Systems",
        location: "Austin, TX (Hybrid)",
        jobType: "Full-time",
        experienceLevel: "Senior",
        description: "Design and build scalable backend systems that power millions of users. Work with microservices, databases, and distributed systems.",
        requirements: "6+ years backend development experience\nProficiency in Python, Go, or Java\nExperience with microservices architecture\nKnowledge of databases (SQL and NoSQL)",
        salary: "$150,000 - $190,000",
        source: "Demo",
        externalId: "demo-4",
        jobUrl: "https://example.com/jobs/demo-4",
        postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        title: "DevOps Engineer",
        company: "Infrastructure Experts",
        location: "Seattle, WA",
        jobType: "Full-time",
        experienceLevel: "Mid-level",
        description: "Help us build and maintain robust CI/CD pipelines and cloud infrastructure. Automate everything!",
        requirements: "3+ years DevOps experience\nProficiency with Docker, Kubernetes\nExperience with AWS or Azure\nScripting skills (Python, Bash)",
        salary: "$120,000 - $155,000",
        source: "Demo",
        externalId: "demo-5",
        jobUrl: "https://example.com/jobs/demo-5",
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    // Filter demo jobs based on parameters
    return demoJobs.filter(job => {
      if (params.keywords && params.keywords.length > 0) {
        const matchesKeyword = params.keywords.some(keyword =>
          job.title.toLowerCase().includes(keyword.toLowerCase()) ||
          job.description.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!matchesKeyword) return false;
      }

      if (params.jobType && job.jobType !== params.jobType) {
        return false;
      }

      if (params.experienceLevel && job.experienceLevel !== params.experienceLevel) {
        return false;
      }

      return true;
    });
  }

  /**
   * Save or update jobs in the database
   */
  async saveJobs(jobs: JobListing[]): Promise<void> {
    for (const job of jobs) {
      try {
        await prisma.job.upsert({
          where: {
            source_externalId: {
              source: job.source,
              externalId: job.externalId,
            },
          },
          update: {
            title: job.title,
            company: job.company,
            location: job.location,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            description: job.description,
            requirements: job.requirements,
            salary: job.salary,
            jobUrl: job.jobUrl,
            postedAt: job.postedAt,
            isActive: true,
            updatedAt: new Date(),
          },
          create: {
            title: job.title,
            company: job.company,
            location: job.location,
            jobType: job.jobType,
            experienceLevel: job.experienceLevel,
            description: job.description,
            requirements: job.requirements,
            salary: job.salary,
            source: job.source,
            externalId: job.externalId,
            jobUrl: job.jobUrl,
            postedAt: job.postedAt,
            isActive: true,
          },
        });
      } catch (error) {
        console.error(`Error saving job ${job.externalId}:`, error);
      }
    }
  }

  /**
   * Deduplicate jobs based on title and company
   */
  private deduplicateJobs(jobs: JobListing[]): JobListing[] {
    const seen = new Set<string>();
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Extract experience level from text using simple heuristics
   */
  private extractExperienceLevel(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("senior") || lowerText.includes("lead") || lowerText.includes("principal")) {
      return "Senior";
    } else if (lowerText.includes("junior") || lowerText.includes("entry") || lowerText.includes("associate")) {
      return "Entry";
    } else if (lowerText.includes("mid") || lowerText.includes("intermediate")) {
      return "Mid-level";
    }

    return "Mid-level";
  }

  /**
   * Convert months to experience level
   */
  private monthsToExperienceLevel(months: number): string {
    if (months < 24) return "Entry";
    if (months < 60) return "Mid-level";
    return "Senior";
  }
}
