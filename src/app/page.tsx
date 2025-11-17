"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Target,
  Sparkles,
  MessageSquare,
  Mic,
  Mail,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Users
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm animate-slideDown">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Resume Builder
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="text-center max-w-5xl mx-auto animate-fadeInUp">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6 animate-fadeInUp animation-delay-200">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Resume Builder
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight animate-fadeInUp animation-delay-400">
              Land Your Dream Job with AI-Optimized Resumes
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-fadeInUp animation-delay-600">
              Create ATS-friendly resumes, practice voice interviews, and get personalized job matches—all powered by advanced AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fadeInUp animation-delay-800">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 rounded-xl shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105">
                  Start Building Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-2 hover:border-blue-600 hover:text-blue-600 transition-all">
                  See How It Works
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-gray-600 animate-fadeInUp animation-delay-1000">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Free forever plan
              </div>
              <div className="flex items-center hidden md:flex">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                Trusted by 10,000+ users
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: "10,000+", label: "Resumes Created" },
              { number: "95%", label: "ATS Pass Rate" },
              { number: "5,000+", label: "Jobs Matched" },
              { number: "4.9★", label: "User Rating" }
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center animate-scaleIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powered by advanced AI to give you an unfair advantage in your job search
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <FileText className="w-8 h-8" />,
                title: "AI Resume Parser",
                description: "Upload your resume and our AI instantly extracts skills, experience, and education with 99% accuracy.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Job Match Optimizer",
                description: "Get AI-powered suggestions to tailor your resume for any job description. Increase your match score to 90%+.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: <Mic className="w-8 h-8" />,
                title: "Voice Interview Coach",
                description: "Practice interviews with AI voice analysis. Get feedback on pace, confidence, clarity, and filler words.",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: <Mail className="w-8 h-8" />,
                title: "Daily Job Alerts",
                description: "Receive personalized job matches via email every morning. AI scores each job based on your profile.",
                gradient: "from-green-500 to-teal-500"
              },
              {
                icon: <MessageSquare className="w-8 h-8" />,
                title: "Mock Interviews",
                description: "Practice with AI-generated interview questions. Get detailed feedback and improvement tips.",
                gradient: "from-indigo-500 to-purple-500"
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "Cover Letter Generator",
                description: "AI writes personalized cover letters for each application. Highlight your best fit in seconds.",
                gradient: "from-pink-500 to-rose-500"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="animate-fadeInUp hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full hover:shadow-2xl transition-all border-2 hover:border-blue-200 bg-white/80 backdrop-blur">
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 shadow-lg`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="text-2xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Get Hired in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600">
              From resume to offer letter in record time
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Upload Your Resume",
                description: "Drag and drop your existing resume. Our AI analyzes and extracts all relevant information automatically.",
                icon: <FileText className="w-12 h-12" />
              },
              {
                step: "02",
                title: "Optimize & Practice",
                description: "Match your resume to job descriptions, practice voice interviews, and get AI coaching on your delivery.",
                icon: <TrendingUp className="w-12 h-12" />
              },
              {
                step: "03",
                title: "Get Job Matches",
                description: "Receive daily emails with top job matches. Apply with one click and track all your applications.",
                icon: <Mail className="w-12 h-12" />
              }
            ].map((item, index) => (
              <div
                key={index}
                className="relative animate-slideInLeft"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white mb-6 shadow-xl">
                    {item.icon}
                  </div>
                  <div className="text-6xl font-bold text-gray-100 absolute top-0 right-0 -z-10">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 right-0 transform translate-x-1/2">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Loved by Job Seekers Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See what our users have to say
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Software Engineer at Google",
                content: "The voice interview feature was a game-changer! It helped me improve my speaking pace and confidence. Landed my dream job in 2 weeks!",
                rating: 5,
                avatar: "👩‍💻"
              },
              {
                name: "Michael Chen",
                role: "Product Manager at Microsoft",
                content: "The AI job matching is incredible. I got 10 relevant job matches daily and applied to only the best ones. Got 3 offers in a month!",
                rating: 5,
                avatar: "👨‍💼"
              },
              {
                name: "Emily Davis",
                role: "Data Scientist at Amazon",
                content: "Resume optimization increased my interview rate by 300%. The AI suggestions were spot-on for every job I applied to.",
                rating: 5,
                avatar: "👩‍🔬"
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="animate-scaleIn hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="h-full hover:shadow-xl transition-all bg-white border-2">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 italic leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl mr-4">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-bold">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white border-y">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Shield className="w-8 h-8" />, text: "Bank-level Security" },
              { icon: <Globe className="w-8 h-8" />, text: "Global Reach" },
              { icon: <Users className="w-8 h-8" />, text: "10K+ Users" },
              { icon: <Zap className="w-8 h-8" />, text: "Lightning Fast" }
            ].map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center animate-fadeInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-blue-600 mb-3">{item.icon}</div>
                <div className="font-semibold text-gray-700">{item.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center max-w-3xl mx-auto animate-fadeInUp">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Accelerate Your Job Search?
            </h2>
            <p className="text-xl text-blue-100 mb-10">
              Join thousands of job seekers who landed their dream jobs with AI Resume Builder
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-7 rounded-xl shadow-2xl hover:scale-105 transition-transform">
                Start Building Your Resume Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-blue-100 mt-6 text-sm">
              No credit card required • Get started in 60 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">AI Resume Builder</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Build your perfect resume with AI-powered tools and land your dream job faster.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-blue-400 transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-400 transition">Pricing</Link></li>
                <li><Link href="/templates" className="hover:text-blue-400 transition">Templates</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-blue-400 transition">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-blue-400 transition">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-blue-400 transition">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-400 transition">Terms of Service</Link></li>
                <li><Link href="/contact" className="hover:text-blue-400 transition">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 AI Resume Builder. All rights reserved. Made with ❤️ for job seekers worldwide.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
          }
          to {
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slideDown {
          animation: slideDown 0.6s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-400 {
          animation-delay: 400ms;
        }

        .animation-delay-600 {
          animation-delay: 600ms;
        }

        .animation-delay-800 {
          animation-delay: 800ms;
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
