"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Clock, Target, MapPin, Briefcase, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";

export default function JobAlertsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [enabled, setEnabled] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationTime, setNotificationTime] = useState("09:00");
  const [timezone, setTimezone] = useState("UTC");
  const [maxJobsPerDay, setMaxJobsPerDay] = useState(10);
  const [minMatchScore, setMinMatchScore] = useState(70);

  // Job preferences
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [experienceLevels, setExperienceLevels] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState<number | undefined>();
  const [salaryMax, setSalaryMax] = useState<number | undefined>();

  // Input states for adding items
  const [roleInput, setRoleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");

  // Stats
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);

  useEffect(() => {
    if (session) {
      fetchPreferences();
      fetchRecentMatches();
    }
  }, [session]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/job-alerts/preferences");
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          const prefs = data.preferences;
          setEnabled(prefs.enabled);
          setNotificationEmail(prefs.notificationEmail || session?.user?.email || "");
          setNotificationTime(prefs.notificationTime || "09:00");
          setTimezone(prefs.timezone || "UTC");
          setMaxJobsPerDay(prefs.maxJobsPerDay || 10);
          setMinMatchScore(prefs.minMatchScore || 70);
          setDesiredRoles(prefs.desiredRoles || []);
          setLocations(prefs.locations || []);
          setJobTypes(prefs.jobTypes || []);
          setExperienceLevels(prefs.experienceLevels || []);
          setSalaryMin(prefs.salaryMin);
          setSalaryMax(prefs.salaryMax);
          setLastSentAt(prefs.lastSentAt ? new Date(prefs.lastSentAt) : null);
        } else {
          // No preferences yet, use defaults
          setNotificationEmail(session?.user?.email || "");
        }
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMatches = async () => {
    try {
      const res = await fetch("/api/job-alerts/matches?limit=5");
      if (res.ok) {
        const data = await res.json();
        setRecentMatches(data.matches || []);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/job-alerts/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          notificationEmail,
          notificationTime,
          timezone,
          maxJobsPerDay,
          minMatchScore,
          desiredRoles,
          locations,
          jobTypes,
          experienceLevels,
          salaryMin,
          salaryMax,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Preferences saved successfully!" });
        const data = await res.json();
        if (data.preferences.lastSentAt) {
          setLastSentAt(new Date(data.preferences.lastSentAt));
        }
      } else {
        const error = await res.json();
        setMessage({ type: "error", text: error.error || "Failed to save preferences" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save preferences" });
    } finally {
      setSaving(false);
    }
  };

  const triggerNow = async () => {
    setTriggering(true);
    setMessage(null);

    try {
      const res = await fetch("/api/job-alerts/trigger", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Found ${data.jobsMatched} matching jobs! ${data.emailSent ? "Email sent successfully." : "Email not sent (check configuration)."}`,
        });
        fetchRecentMatches();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to trigger job matching" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to trigger job matching" });
    } finally {
      setTriggering(false);
    }
  };

  const addRole = () => {
    if (roleInput.trim() && !desiredRoles.includes(roleInput.trim())) {
      setDesiredRoles([...desiredRoles, roleInput.trim()]);
      setRoleInput("");
    }
  };

  const removeRole = (role: string) => {
    setDesiredRoles(desiredRoles.filter((r) => r !== role));
  };

  const addLocation = () => {
    if (locationInput.trim() && !locations.includes(locationInput.trim())) {
      setLocations([...locations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const removeLocation = (location: string) => {
    setLocations(locations.filter((l) => l !== location));
  };

  const toggleJobType = (type: string) => {
    if (jobTypes.includes(type)) {
      setJobTypes(jobTypes.filter((t) => t !== type));
    } else {
      setJobTypes([...jobTypes, type]);
    }
  };

  const toggleExperienceLevel = (level: string) => {
    if (experienceLevels.includes(level)) {
      setExperienceLevels(experienceLevels.filter((l) => l !== level));
    } else {
      setExperienceLevels([...experienceLevels, level]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Job Alerts Settings</h1>
        <p className="text-gray-600">
          Automatically receive personalized job matches via email daily
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center">
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email & Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2" />
                Email & Notification
              </CardTitle>
              <CardDescription>Configure when and where to receive job alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="enabled" className="font-normal cursor-pointer">
                  Enable job alerts
                </Label>
              </div>

              <div>
                <Label htmlFor="notificationEmail">Email Address</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notificationTime">Notification Time</Label>
                  <Input
                    id="notificationTime"
                    type="time"
                    value={notificationTime}
                    onChange={(e) => setNotificationTime(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">24-hour format (HH:MM)</p>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern (US)</option>
                    <option value="America/Chicago">Central (US)</option>
                    <option value="America/Denver">Mountain (US)</option>
                    <option value="America/Los_Angeles">Pacific (US)</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                    <option value="Asia/Kolkata">India</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxJobsPerDay">Max Jobs Per Day</Label>
                  <Input
                    id="maxJobsPerDay"
                    type="number"
                    min="1"
                    max="50"
                    value={maxJobsPerDay}
                    onChange={(e) => setMaxJobsPerDay(parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="minMatchScore">Min Match Score (%)</Label>
                  <Input
                    id="minMatchScore"
                    type="number"
                    min="50"
                    max="100"
                    value={minMatchScore}
                    onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Job Preferences
              </CardTitle>
              <CardDescription>What kind of jobs are you looking for?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Desired Roles */}
              <div>
                <Label>Desired Job Titles</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRole())}
                    placeholder="e.g., Software Engineer"
                  />
                  <Button type="button" onClick={addRole}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {desiredRoles.map((role) => (
                    <span
                      key={role}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {role}
                      <button
                        onClick={() => removeRole(role)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <Label>Preferred Locations</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addLocation())}
                    placeholder="e.g., Remote, New York, San Francisco"
                  />
                  <Button type="button" onClick={addLocation}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {locations.map((location) => (
                    <span
                      key={location}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      {location}
                      <button
                        onClick={() => removeLocation(location)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Job Types */}
              <div>
                <Label>Job Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Full-time", "Part-time", "Contract", "Remote", "Hybrid"].map((type) => (
                    <button
                      key={type}
                      onClick={() => toggleJobType(type)}
                      className={`px-4 py-2 rounded-lg border ${
                        jobTypes.includes(type)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Levels */}
              <div>
                <Label>Experience Levels</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Entry", "Mid-level", "Senior", "Lead"].map((level) => (
                    <button
                      key={level}
                      onClick={() => toggleExperienceLevel(level)}
                      className={`px-4 py-2 rounded-lg border ${
                        experienceLevels.includes(level)
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <Label>Salary Range (Optional)</Label>
                <div className="grid md:grid-cols-2 gap-4 mt-1">
                  <div>
                    <Input
                      type="number"
                      placeholder="Min (e.g., 80000)"
                      value={salaryMin || ""}
                      onChange={(e) => setSalaryMin(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div>
                    <Input
                      type="number"
                      placeholder="Max (e.g., 150000)"
                      value={salaryMax || ""}
                      onChange={(e) => setSalaryMax(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button onClick={savePreferences} disabled={saving} className="flex-1">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>

            <Button onClick={triggerNow} disabled={triggering || !enabled} variant="outline" className="flex-1">
              {triggering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Find Jobs Now
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Alerts</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {enabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              {lastSentAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Sent</span>
                  <span className="text-sm font-medium">
                    {lastSentAt.toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Next Alert</span>
                <span className="text-sm font-medium">
                  {enabled ? `Daily at ${notificationTime}` : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Matches */}
          {recentMatches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Matches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentMatches.slice(0, 5).map((match) => (
                  <div key={match.id} className="border-b border-gray-100 pb-2 last:border-0">
                    <div className="font-medium text-sm">{match.job.title}</div>
                    <div className="text-xs text-gray-600">{match.job.company}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                        {match.matchScore}% match
                      </span>
                      <a
                        href={match.job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 space-y-2">
              <p>1. We search top job portals daily</p>
              <p>2. AI matches jobs to your resume</p>
              <p>3. Top matches sent to your email</p>
              <p>4. Track and apply directly</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
