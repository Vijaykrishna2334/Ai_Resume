import { generateSlug } from "@/lib/utils";

export class PortfolioGenerator {
  generateHTML(profile: any, template: string = "minimalist"): string {
    const templates: Record<string, (p: any) => string> = {
      minimalist: this.minimalistTemplate,
      modern: this.modernTemplate,
      creative: this.creativeTemplate,
    };

    const renderer = templates[template] || templates.minimalist;
    return renderer(profile);
  }

  private minimalistTemplate(profile: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.user?.name || 'Portfolio'} - Portfolio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f9fafb;
    }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    .hero { text-align: center; padding: 60px 0; background: white; border-radius: 12px; margin-bottom: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .hero h1 { font-size: 3rem; margin-bottom: 10px; }
    .hero p { font-size: 1.2rem; color: #666; }
    .section { background: white; border-radius: 12px; padding: 40px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .section h2 { font-size: 2rem; margin-bottom: 20px; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
    .skills { display: flex; flex-wrap: wrap; gap: 10px; }
    .skill { background: #3b82f6; color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; }
    .experience-item, .project-item, .education-item { margin-bottom: 30px; }
    .experience-item h3, .project-item h3 { font-size: 1.3rem; margin-bottom: 5px; }
    .company, .tech { color: #666; font-style: italic; }
    .date { color: #999; font-size: 0.9rem; }
    ul { margin-left: 20px; margin-top: 10px; }
    li { margin-bottom: 8px; }
    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .section { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>${profile.user?.name || 'Your Name'}</h1>
      <p>${profile.summary || 'Professional Portfolio'}</p>
      <p style="margin-top: 10px; color: #3b82f6;">${profile.user?.email || ''}</p>
    </div>

    ${profile.skills && profile.skills.length > 0 ? `
    <div class="section">
      <h2>Skills</h2>
      <div class="skills">
        ${profile.skills.map((skill: string) => `<span class="skill">${skill}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${profile.experience && profile.experience.length > 0 ? `
    <div class="section">
      <h2>Experience</h2>
      ${profile.experience.map((exp: any) => `
        <div class="experience-item">
          <h3>${exp.title}</h3>
          <div class="company">${exp.company}</div>
          <div class="date">${exp.startDate} - ${exp.endDate || 'Present'}</div>
          <ul>
            ${exp.bullets.map((bullet: string) => `<li>${bullet}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.projects && profile.projects.length > 0 ? `
    <div class="section">
      <h2>Projects</h2>
      ${profile.projects.map((proj: any) => `
        <div class="project-item">
          <h3>${proj.name}</h3>
          <p>${proj.description}</p>
          <div class="tech">Tech: ${proj.tech.join(', ')}</div>
          ${proj.url ? `<a href="${proj.url}" target="_blank" style="color: #3b82f6; margin-top: 5px; display: inline-block;">View Project →</a>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    ${profile.education && profile.education.length > 0 ? `
    <div class="section">
      <h2>Education</h2>
      ${profile.education.map((edu: any) => `
        <div class="education-item">
          <h3>${edu.degree} in ${edu.field}</h3>
          <div class="company">${edu.institution}</div>
          <div class="date">${edu.year}</div>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 40px; color: #999;">
      <p>Built with AI Resume Builder</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private modernTemplate(profile: any): string {
    return this.minimalistTemplate(profile); // Simplified for now
  }

  private creativeTemplate(profile: any): string {
    return this.minimalistTemplate(profile); // Simplified for now
  }
}
