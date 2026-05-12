"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Loader2, Volume2, VolumeX, CheckCircle2, TrendingUp } from "lucide-react";

interface VoiceAnalysis {
  wordsPerMinute: number;
  pauseCount: number;
  avgPauseDuration: number;
  confidenceLevel: string;
  clarity: string;
  energyLevel: string;
  fillerWords: number;
  totalDuration: number;
}

interface QuestionFeedback {
  contentScore: number;
  contentFeedback: string;
  deliveryScore: number;
  deliveryFeedback: string;
  strengths: string[];
  improvements: string[];
  voiceCoaching: {
    paceAdvice: string;
    pauseAdvice: string;
    confidenceAdvice: string;
    energyAdvice: string;
  };
  resources: Array<{
    title: string;
    type: string;
    url: string;
    description: string;
  }>;
  exerciseSuggestions: string[];
}

export default function VoiceInterviewPage() {
  const { data: session } = useSession();
  const [step, setStep] = useState<"setup" | "interview" | "feedback" | "report">("setup");
  const [jobTitle, setJobTitle] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);

  // Interview state
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isListening, setIsListening] = useState(false);

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  // Feedback state
  const [currentVoiceAnalysis, setCurrentVoiceAnalysis] = useState<VoiceAnalysis | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<QuestionFeedback | null>(null);

  // Final report state
  const [finalReport, setFinalReport] = useState<any>(null);

  // Text-to-Speech function
  const speakQuestion = (text: string) => {
    if (!ttsEnabled || typeof window === "undefined") return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const startInterview = async () => {
    if (!jobTitle.trim()) {
      alert("Please enter a job title");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/voice-interview/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, questionCount }),
      });

      if (!res.ok) throw new Error("Failed to start interview");

      const data = await res.json();
      setInterviewId(data.interviewId);
      setCurrentQuestion(data.question);
      setCurrentQuestionIndex(0);
      setTotalQuestions(data.totalQuestions);
      setStep("interview");

      // Speak the first question
      setTimeout(() => speakQuestion(data.question), 500);
    } catch (error) {
      console.error(error);
      alert("Failed to start interview. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptComplete = async (transcript: string, duration: number, pauseData: number[]) => {
    setLoading(true);
    stopSpeaking();

    try {
      const res = await fetch(`/api/voice-interview/${interviewId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          duration,
          pauseData,
          questionIndex: currentQuestionIndex,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit answer");

      const data = await res.json();
      setCurrentVoiceAnalysis(data.voiceAnalysis);
      setCurrentFeedback(data.feedback);
      setStep("feedback");

      if (data.hasMore) {
        // Prepare next question
        setCurrentQuestion(data.nextQuestion);
        setCurrentQuestionIndex(data.currentQuestion);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to process your answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const continueToNextQuestion = () => {
    setStep("interview");
    setCurrentVoiceAnalysis(null);
    setCurrentFeedback(null);
    setTimeout(() => speakQuestion(currentQuestion), 500);
  };

  const completeInterview = async () => {
    setLoading(true);
    stopSpeaking();

    try {
      const res = await fetch(`/api/voice-interview/${interviewId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to complete interview");

      const data = await res.json();
      setFinalReport(data.report);
      setStep("report");
    } catch (error) {
      console.error(error);
      alert("Failed to generate final report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetInterview = () => {
    stopSpeaking();
    setStep("setup");
    setInterviewId(null);
    setCurrentQuestion("");
    setCurrentQuestionIndex(0);
    setTotalQuestions(0);
    setCurrentVoiceAnalysis(null);
    setCurrentFeedback(null);
    setFinalReport(null);
  };

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to access voice interviews.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Voice Mock Interview</h1>
        <p className="text-gray-600">
          Practice your interview skills with AI-powered voice analysis and feedback
        </p>
      </div>

      {/* Setup Step */}
      {step === "setup" && (
        <Card>
          <CardHeader>
            <CardTitle>Start Your Voice Interview</CardTitle>
            <CardDescription>
              The AI will ask you questions out loud. Answer naturally and receive detailed voice coaching.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                placeholder="e.g., Software Engineer, Product Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="questionCount">Number of Questions</Label>
              <Input
                id="questionCount"
                type="number"
                min="3"
                max="10"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ttsEnabled"
                checked={ttsEnabled}
                onChange={(e) => setTtsEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="ttsEnabled" className="font-normal cursor-pointer">
                Enable voice questions (text-to-speech)
              </Label>
            </div>

            <Button onClick={startInterview} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting Interview...
                </>
              ) : (
                "Start Voice Interview"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Interview Step */}
      {step === "interview" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (isSpeaking ? stopSpeaking() : speakQuestion(currentQuestion))}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Repeat Question
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <p className="text-lg font-medium text-blue-900">{currentQuestion}</p>
              </div>

              <VoiceRecorder
                onTranscriptComplete={handleTranscriptComplete}
                isListening={isListening}
                onListeningChange={setIsListening}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Step */}
      {step === "feedback" && currentVoiceAnalysis && currentFeedback && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="w-6 h-6 mr-2 text-green-600" />
                Answer Submitted!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice Metrics */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Voice Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Speaking Speed</div>
                    <div className="text-xl font-bold">{currentVoiceAnalysis.wordsPerMinute} WPM</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Confidence</div>
                    <div className="text-xl font-bold capitalize">{currentVoiceAnalysis.confidenceLevel}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Clarity</div>
                    <div className="text-xl font-bold capitalize">{currentVoiceAnalysis.clarity}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Filler Words</div>
                    <div className="text-xl font-bold">{currentVoiceAnalysis.fillerWords}</div>
                  </div>
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">Content Score</div>
                  <div className="text-3xl font-bold text-blue-900">{currentFeedback.contentScore}/100</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1">Delivery Score</div>
                  <div className="text-3xl font-bold text-purple-900">{currentFeedback.deliveryScore}/100</div>
                </div>
              </div>

              {/* Feedback */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Content Feedback</h3>
                <p className="text-gray-700">{currentFeedback.contentFeedback}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Delivery Feedback</h3>
                <p className="text-gray-700">{currentFeedback.deliveryFeedback}</p>
              </div>

              {/* Voice Coaching */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Voice Coaching</h3>
                <div className="space-y-2">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <div className="font-medium text-sm text-yellow-800">Pace</div>
                    <div className="text-sm text-yellow-900">{currentFeedback.voiceCoaching.paceAdvice}</div>
                  </div>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3">
                    <div className="font-medium text-sm text-blue-800">Pauses</div>
                    <div className="text-sm text-blue-900">{currentFeedback.voiceCoaching.pauseAdvice}</div>
                  </div>
                  <div className="bg-green-50 border-l-4 border-green-400 p-3">
                    <div className="font-medium text-sm text-green-800">Confidence</div>
                    <div className="text-sm text-green-900">{currentFeedback.voiceCoaching.confidenceAdvice}</div>
                  </div>
                  <div className="bg-purple-50 border-l-4 border-purple-400 p-3">
                    <div className="font-medium text-sm text-purple-800">Energy</div>
                    <div className="text-sm text-purple-900">{currentFeedback.voiceCoaching.energyAdvice}</div>
                  </div>
                </div>
              </div>

              {/* Strengths and Improvements */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-700">Strengths</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {currentFeedback.strengths.map((strength, i) => (
                      <li key={i} className="text-sm text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-orange-700">Areas to Improve</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {currentFeedback.improvements.map((improvement, i) => (
                      <li key={i} className="text-sm text-gray-700">{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                {currentQuestionIndex + 1 < totalQuestions ? (
                  <Button onClick={continueToNextQuestion} className="flex-1">
                    Continue to Next Question
                  </Button>
                ) : (
                  <Button onClick={completeInterview} disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      "Complete Interview & Get Full Report"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Final Report Step */}
      {step === "report" && finalReport && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
                Voice Interview Complete!
              </CardTitle>
              <CardDescription>Here's your comprehensive voice coaching report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Scores */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg text-center">
                  <div className="text-sm mb-1">Overall Score</div>
                  <div className="text-4xl font-bold">{finalReport.overallScore}</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg text-center">
                  <div className="text-sm mb-1">Content</div>
                  <div className="text-4xl font-bold">{finalReport.contentScore}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg text-center">
                  <div className="text-sm mb-1">Delivery</div>
                  <div className="text-4xl font-bold">{finalReport.deliveryScore}</div>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Summary</h3>
                <p className="text-gray-700">{finalReport.summary}</p>
              </div>

              {/* Voice Profile */}
              {finalReport.voiceProfile && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Your Voice Profile</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-sm text-gray-600">Average Speaking Speed</div>
                      <div className="font-semibold">{finalReport.voiceProfile.averageWPM} WPM</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Optimal Range</div>
                      <div className="font-semibold">{finalReport.voiceProfile.optimalWPM} WPM</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Pace Consistency</div>
                      <div className="font-semibold capitalize">{finalReport.voiceProfile.paceConsistency}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Confidence Trend</div>
                      <div className="font-semibold">{finalReport.voiceProfile.confidenceTrend}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Strengths and Improvements */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-700">Key Strengths</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {finalReport.keyStrengths.map((strength: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700">{strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-orange-700">Areas to Improve</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {finalReport.keyImprovements.map((improvement: string, i: number) => (
                      <li key={i} className="text-sm text-gray-700">{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Plan */}
              {finalReport.actionPlan && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Your Action Plan</h3>
                  <div className="space-y-2">
                    {finalReport.actionPlan.map((action: string, i: number) => (
                      <div key={i} className="flex items-start space-x-2">
                        <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">
                          {i + 1}
                        </div>
                        <div className="flex-1 text-gray-700">{action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Resources */}
              {finalReport.recommendedResources && finalReport.recommendedResources.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Recommended Resources</h3>
                  <div className="space-y-3">
                    {finalReport.recommendedResources.map((resource: any, i: number) => (
                      <div key={i} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{resource.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">{resource.type}</span>
                              {resource.priority && (
                                <span className={`text-xs px-2 py-1 rounded ${
                                  resource.priority === 'high' ? 'bg-red-100 text-red-700' :
                                  resource.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {resource.priority} priority
                                </span>
                              )}
                            </div>
                          </div>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View →
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview Readiness */}
              {finalReport.readyForInterview !== undefined && (
                <div className={`p-4 rounded-lg border-2 ${
                  finalReport.readyForInterview
                    ? 'bg-green-50 border-green-300'
                    : 'bg-yellow-50 border-yellow-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">Interview Readiness</h3>
                      <p className={`text-sm mt-1 ${
                        finalReport.readyForInterview ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {finalReport.readyForInterview
                          ? "You're ready for your interview! Keep practicing to maintain your skills."
                          : "Continue practicing to improve your confidence and delivery."}
                      </p>
                    </div>
                    {finalReport.estimatedSuccessRate && (
                      <div className="text-right">
                        <div className="text-3xl font-bold">{finalReport.estimatedSuccessRate}%</div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button onClick={resetInterview} variant="outline" className="flex-1">
                  Start New Interview
                </Button>
                <Button onClick={() => window.location.href = "/dashboard"} className="flex-1">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
