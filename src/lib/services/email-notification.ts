export interface JobMatchEmail {
  userEmail: string;
  userName: string;
  matches: Array<{
    job: {
      title: string;
      company: string;
      location?: string;
      jobType?: string;
      salary?: string;
      jobUrl: string;
      description: string;
    };
    matchScore: number;
    matchReason: string;
    strengths: string[];
    gaps: string[];
  }>;
}

export class EmailNotificationService {
  /**
   * Send job matches email to user
   * Uses Resend if configured, otherwise falls back to console logging for development
   */
  async sendJobMatchesEmail(data: JobMatchEmail): Promise<boolean> {
    try {
      if (process.env.RESEND_API_KEY) {
        return await this.sendViaResend(data);
      } else if (process.env.SENDGRID_API_KEY) {
        return await this.sendViaSendGrid(data);
      } else {
        // Development fallback - log to console
        console.log("📧 EMAIL WOULD BE SENT:");
        console.log("To:", data.userEmail);
        console.log("Subject: Your Daily Job Matches - AI Resume Builder");
        console.log("Matches:", data.matches.length);
        data.matches.forEach((match, i) => {
          console.log(`\n${i + 1}. ${match.job.title} at ${match.job.company}`);
          console.log(`   Score: ${match.matchScore}%`);
          console.log(`   URL: ${match.job.jobUrl}`);
        });
        return true;
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  /**
   * Send email using Resend API
   */
  private async sendViaResend(data: JobMatchEmail): Promise<boolean> {
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@airesume.com";

      const htmlContent = this.generateEmailHTML(data);

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: data.userEmail,
          subject: `Your Daily Job Matches - ${data.matches.length} Opportunities Found`,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Resend API error:", errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending via Resend:", error);
      return false;
    }
  }

  /**
   * Send email using SendGrid API
   */
  private async sendViaSendGrid(data: JobMatchEmail): Promise<boolean> {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      const fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@airesume.com";

      const htmlContent = this.generateEmailHTML(data);

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: data.userEmail }],
            },
          ],
          from: { email: fromEmail },
          subject: `Your Daily Job Matches - ${data.matches.length} Opportunities Found`,
          content: [
            {
              type: "text/html",
              value: htmlContent,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error("SendGrid API error:", response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error sending via SendGrid:", error);
      return false;
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHTML(data: JobMatchEmail): string {
    const topMatch = data.matches[0];

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Daily Job Matches</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .job-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      background-color: #f9f9f9;
    }
    .job-card.featured {
      border: 2px solid #667eea;
      background: linear-gradient(to right, #f8f9ff, #ffffff);
    }
    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 12px;
    }
    .job-title {
      font-size: 20px;
      font-weight: bold;
      color: #2d3748;
      margin: 0 0 5px 0;
    }
    .job-company {
      font-size: 16px;
      color: #4a5568;
      margin: 0;
    }
    .match-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
      white-space: nowrap;
    }
    .job-meta {
      display: flex;
      gap: 15px;
      margin: 12px 0;
      flex-wrap: wrap;
    }
    .job-meta-item {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #666;
    }
    .job-meta-icon {
      margin-right: 5px;
    }
    .job-description {
      font-size: 14px;
      color: #555;
      margin: 12px 0;
      line-height: 1.5;
    }
    .match-details {
      background-color: #f0f4ff;
      border-left: 3px solid #667eea;
      padding: 12px;
      margin: 12px 0;
      font-size: 14px;
    }
    .match-details strong {
      color: #667eea;
    }
    .strengths {
      margin: 10px 0;
    }
    .strength-item {
      display: flex;
      align-items: start;
      margin: 5px 0;
      font-size: 13px;
    }
    .strength-item::before {
      content: "✓";
      color: #48bb78;
      font-weight: bold;
      margin-right: 8px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: bold;
      margin-top: 10px;
    }
    .cta-button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎯 Your Daily Job Matches</h1>
      <p>AI-powered job recommendations based on your profile</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="greeting">
        Hi ${data.userName},
      </div>

      <p>We found <strong>${data.matches.length} job opportunities</strong> that match your skills and preferences. Here are your top matches:</p>

      ${data.matches
        .map(
          (match, index) => `
      <!-- Job Card ${index + 1} -->
      <div class="job-card ${index === 0 ? "featured" : ""}">
        <div class="job-header">
          <div>
            <h2 class="job-title">${match.job.title}</h2>
            <p class="job-company">${match.job.company}</p>
          </div>
          <div class="match-badge">${match.matchScore}% Match</div>
        </div>

        <div class="job-meta">
          ${
            match.job.location
              ? `<span class="job-meta-item">
                  <span class="job-meta-icon">📍</span>
                  ${match.job.location}
                </span>`
              : ""
          }
          ${
            match.job.jobType
              ? `<span class="job-meta-item">
                  <span class="job-meta-icon">💼</span>
                  ${match.job.jobType}
                </span>`
              : ""
          }
          ${
            match.job.salary
              ? `<span class="job-meta-item">
                  <span class="job-meta-icon">💰</span>
                  ${match.job.salary}
                </span>`
              : ""
          }
        </div>

        <div class="job-description">
          ${match.job.description.substring(0, 200)}${match.job.description.length > 200 ? "..." : ""}
        </div>

        <div class="match-details">
          <strong>Why this is a great match:</strong>
          <p>${match.matchReason}</p>

          ${
            match.strengths.length > 0
              ? `
            <div class="strengths">
              <strong>Your strengths for this role:</strong>
              ${match.strengths
                .slice(0, 3)
                .map((strength) => `<div class="strength-item">${strength}</div>`)
                .join("")}
            </div>
          `
              : ""
          }
        </div>

        <a href="${match.job.jobUrl}" class="cta-button">View Job Details →</a>
      </div>
      `
        )
        .join("")}

      <div style="margin-top: 30px; padding: 20px; background-color: #f8f9ff; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px;">
          <strong>💡 Tip:</strong> Apply early to increase your chances. Jobs with high match scores are great opportunities!
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>These matches were generated by AI based on your resume and preferences.</p>
      <p>
        <a href="${process.env.NEXTAUTH_URL}/dashboard/job-alerts">Update your job alert preferences</a>
        •
        <a href="${process.env.NEXTAUTH_URL}/dashboard/profile">Edit your profile</a>
      </p>
      <p style="margin-top: 15px; color: #999; font-size: 12px;">
        AI Resume Builder • Helping you find your dream job
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send a test email
   */
  async sendTestEmail(userEmail: string): Promise<boolean> {
    return await this.sendJobMatchesEmail({
      userEmail,
      userName: "Test User",
      matches: [
        {
          job: {
            title: "Senior Software Engineer",
            company: "Test Company Inc",
            location: "San Francisco, CA",
            jobType: "Full-time",
            salary: "$140,000 - $180,000",
            jobUrl: "https://example.com/job/test",
            description:
              "This is a test job posting to verify email delivery is working correctly.",
          },
          matchScore: 92,
          matchReason:
            "Your extensive experience with React and Node.js aligns perfectly with the role requirements.",
          strengths: [
            "5+ years of full-stack development experience",
            "Strong proficiency in React and TypeScript",
            "Previous experience at similar-sized companies",
          ],
          gaps: [],
        },
      ],
    });
  }
}
