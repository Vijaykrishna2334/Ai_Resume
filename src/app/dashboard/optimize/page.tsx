"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function OptimizePage() {
  const [jobDescription, setJobDescription] = useState("");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleOptimize = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          company: company.trim() || undefined,
          position: position.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Optimization failed");
        setLoading(false);
        return;
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">AI Resume Builder</h1>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
                <CardDescription>
                  Paste the job description you want to optimize your resume for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input
                    id="company"
                    placeholder="Company Name"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position (Optional)</Label>
                  <Input
                    id="position"
                    placeholder="Job Title"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jd">Job Description</Label>
                  <textarea
                    id="jd"
                    className="w-full min-h-[300px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste the full job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleOptimize}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Analyzing..." : "Analyze & Get Suggestions"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div>
            {result ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Match Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-6xl font-bold text-blue-600">
                        {result.matchScore}%
                      </div>
                      <p className="text-gray-600 mt-2">
                        {result.matchScore >= 80 ? "Excellent match!" :
                         result.matchScore >= 60 ? "Good match" :
                         "Needs improvement"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {result.suggestions?.map((suggestion: any, index: number) => (
                        <div
                          key={index}
                          className="border-l-4 border-blue-500 pl-4 py-2"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded ${
                              suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                              suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {suggestion.priority}
                            </span>
                            <span className="text-xs text-gray-500">{suggestion.type}</span>
                          </div>
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <p className="text-sm text-gray-600">{suggestion.description}</p>
                          {suggestion.example && (
                            <p className="text-sm text-gray-500 italic mt-1">
                              Example: {suggestion.example}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button className="flex-1">Generate Optimized Resume</Button>
                  <Button variant="outline" className="flex-1">Generate Cover Letter</Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500">
                    <p>Enter a job description to see your match score and optimization suggestions</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
