import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">AI Resume Builder</h1>
          <div className="space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6 text-gray-900">
          Build Your Perfect Resume with AI
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create ATS-friendly resumes, cover letters, and portfolios in minutes.
          Optimize for any job description with AI-powered suggestions.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="text-lg px-8 py-6">
            Start Building Free
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Parsing</CardTitle>
              <CardDescription>
                Upload your existing resume and let AI extract all the important information automatically
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Match Optimization</CardTitle>
              <CardDescription>
                Get personalized suggestions to optimize your resume for specific job descriptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ATS-Friendly Templates</CardTitle>
              <CardDescription>
                Generate professional resumes that pass Applicant Tracking Systems
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Generation</CardTitle>
              <CardDescription>
                Create a beautiful online portfolio to showcase your work
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cover Letter Writer</CardTitle>
              <CardDescription>
                AI generates tailored cover letters for each job application
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mock Interviews</CardTitle>
              <CardDescription>
                Practice interviews with AI and get detailed feedback
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-4xl font-bold mb-6">Ready to Get Started?</h3>
        <p className="text-xl text-gray-600 mb-8">
          Join thousands of job seekers landing their dream jobs
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="text-lg px-8 py-6">
            Create Your Resume Now
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 AI Resume Builder. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
