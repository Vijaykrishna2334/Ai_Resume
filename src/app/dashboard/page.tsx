"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [profileRes, appsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/applications"),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }

      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">AI Resume Builder</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {session?.user?.name}
            </span>
            <Link href="/api/auth/signout">
              <Button variant="outline" size="sm">Sign Out</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {session?.user?.name}!</h2>
          <p className="text-gray-600">Here&apos;s your resume building dashboard</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Link href="/dashboard/upload">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Upload Resume</CardTitle>
                <CardDescription>Parse your existing resume with AI</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/optimize">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Optimize Resume</CardTitle>
                <CardDescription>Match to a job description</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/profile">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Edit Profile</CardTitle>
                <CardDescription>Manage your information</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/interview">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-lg">Mock Interview</CardTitle>
                <CardDescription>Practice with AI (Text)</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/voice-interview">
            <Card className="hover:shadow-lg transition cursor-pointer bg-gradient-to-br from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 715 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                  Voice Interview
                </CardTitle>
                <CardDescription>Practice with voice & get coaching</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/job-alerts">
            <Card className="hover:shadow-lg transition cursor-pointer bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  Job Alerts
                </CardTitle>
                <CardDescription>Get daily job matches via email</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl">{applications.length}</CardTitle>
              <CardDescription>Total Applications</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl">
                {profile?.skills?.length || 0}
              </CardTitle>
              <CardDescription>Skills Listed</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-4xl">
                {profile?.experience?.length || 0}
              </CardTitle>
              <CardDescription>Work Experiences</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No applications yet</p>
                <Link href="/dashboard/optimize">
                  <Button>Create Your First Application</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.slice(0, 5).map((app: any) => (
                  <div key={app.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{app.position}</h4>
                      <p className="text-sm text-gray-600">{app.company}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Match: {app.matchScore}%
                      </div>
                      <div className="text-xs text-gray-500">{app.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
