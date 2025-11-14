import puppeteer from "puppeteer";

export interface ResumeTemplate {
  name: string;
  html: string;
}

export class PDFGenerator {
  async generateResume(profile: any, template: string = "minimalist"): Promise<Buffer> {
    const html = this.renderTemplate(profile, template);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  async generateCoverLetter(content: string, profile: any): Promise<Buffer> {
    const html = this.renderCoverLetterTemplate(content, profile);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();
    return Buffer.from(pdf);
  }

  private renderTemplate(profile: any, template: string): string {
    const templates: Record<string, (p: any) => string> = {
      minimalist: this.minimalistTemplate,
      technical: this.technicalTemplate,
      creative: this.creativeTemplate,
    };

    const renderer = templates[template] || templates.minimalist;
    return renderer(profile);
  }

  private minimalistTemplate(profile: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #333; }
    .header { margin-bottom: 20px; }
    .name { font-size: 24pt; font-weight: bold; margin-bottom: 5px; }
    .contact { font-size: 10pt; color: #666; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 14pt; font-weight: bold; border-bottom: 2px solid #333; margin-bottom: 10px; padding-bottom: 3px; }
    .job-title { font-weight: bold; }
    .company { font-style: italic; }
    .date { float: right; font-size: 10pt; color: #666; }
    .skills { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill { background: #f0f0f0; padding: 4px 10px; border-radius: 3px; font-size: 10pt; }
    ul { margin-left: 20px; margin-top: 5px; }
    li { margin-bottom: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${profile.user?.name || 'Your Name'}</div>
    <div class="contact">${profile.user?.email || ''}</div>
  </div>

  ${profile.summary ? `
  <div class="section">
    <div class="section-title">PROFESSIONAL SUMMARY</div>
    <p>${profile.summary}</p>
  </div>
  ` : ''}

  ${profile.skills && profile.skills.length > 0 ? `
  <div class="section">
    <div class="section-title">SKILLS</div>
    <div class="skills">
      ${profile.skills.map((skill: string) => `<span class="skill">${skill}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${profile.experience && profile.experience.length > 0 ? `
  <div class="section">
    <div class="section-title">EXPERIENCE</div>
    ${profile.experience.map((exp: any) => `
      <div style="margin-bottom: 15px;">
        <div>
          <span class="job-title">${exp.title}</span> at <span class="company">${exp.company}</span>
          <span class="date">${exp.startDate} - ${exp.endDate || 'Present'}</span>
        </div>
        <ul>
          ${exp.bullets.map((bullet: string) => `<li>${bullet}</li>`).join('')}
        </ul>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${profile.projects && profile.projects.length > 0 ? `
  <div class="section">
    <div class="section-title">PROJECTS</div>
    ${profile.projects.map((proj: any) => `
      <div style="margin-bottom: 15px;">
        <div class="job-title">${proj.name}</div>
        <p>${proj.description}</p>
        <div style="font-size: 10pt; color: #666; margin-top: 3px;">
          Tech: ${proj.tech.join(', ')}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${profile.education && profile.education.length > 0 ? `
  <div class="section">
    <div class="section-title">EDUCATION</div>
    ${profile.education.map((edu: any) => `
      <div style="margin-bottom: 10px;">
        <div>
          <span class="job-title">${edu.degree} in ${edu.field}</span>
          <span class="date">${edu.year}</span>
        </div>
        <div class="company">${edu.institution}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}
</body>
</html>
    `;
  }

  private technicalTemplate(profile: any): string {
    return this.minimalistTemplate(profile); // Simplified for now
  }

  private creativeTemplate(profile: any): string {
    return this.minimalistTemplate(profile); // Simplified for now
  }

  private renderCoverLetterTemplate(content: string, profile: any): string {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12pt; line-height: 1.6; color: #333; }
    .header { margin-bottom: 30px; }
    .name { font-size: 18pt; font-weight: bold; margin-bottom: 5px; }
    .contact { font-size: 11pt; color: #666; }
    .date { margin-bottom: 30px; }
    .content { text-align: justify; }
    .content p { margin-bottom: 15px; }
    .signature { margin-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${profile.user?.name || 'Your Name'}</div>
    <div class="contact">${profile.user?.email || ''}</div>
  </div>

  <div class="date">${today}</div>

  <div class="content">
    ${content.split('\n\n').map(para => `<p>${para}</p>`).join('')}
  </div>

  <div class="signature">
    <p>Sincerely,</p>
    <p><strong>${profile.user?.name || 'Your Name'}</strong></p>
  </div>
</body>
</html>
    `;
  }
}
