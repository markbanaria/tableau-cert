'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  ChartBarIcon,
  PlayIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  XCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { getQuizSampler } from '@/services/quizSampler';
import { LoadingState } from '@/components/QuestionBankLoader';
import MainLayout from '@/components/layout/main-layout';
import QuizCard from '@/components/QuizCard';

interface DashboardData {
  user: {
    name: string;
    email: string;
  };
  stats: {
    totalQuizzesTaken: number;
    totalQuestionsAnswered: number;
    correctAnswers: number;
    averageScore: number;
    accuracyPercentage: number;
  };
  recentQuizzes: Array<{
    startedAt: string;
    id: string;
    completedAt: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    testName: string;
    passed: boolean;
    percentage: number;
  }>;
  userCertifications: Array<{
    user_certification_id: string;
    status: string;
    started_at: string;
    completed_at: string | null;
    certification_id: string;
    name: string;
    description: string;
    tracks: string;
    level: string;
  }>;
  topCertifications: Array<{
    id: string;
    name: string;
    description: string;
    vendor: string;
    level: string;
    color: string;
    icon: string;
    status: string;
  }>;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [samplerReady, setSamplerReady] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [domainCoverage, setDomainCoverage] = useState<Record<string, any>>({});
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    initializeSampler();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    } else if (status !== 'loading') {
      // Redirect non-logged-in users to marketplace
      router.push('/certifications');
    }
  }, [session, status, router]);

  const initializeSampler = async () => {
    try {
      const quizSampler = getQuizSampler();

      // Load with progress callback
      await quizSampler.loadQuestionBanks((loaded, total, message) => {
        setLoadingMessage(message);
      });

      const stats = quizSampler.getQuestionBankStats();
      const coverage = await quizSampler.getDomainCoverage('tableau-consultant');
      const totalQuestions = Object.values(stats).reduce((sum, stat) => sum + stat.questionCount, 0);
      setAvailableQuestions(totalQuestions);
      setDomainCoverage(coverage);
      setSamplerReady(true);
    } catch (error) {
      console.error('Failed to load question banks:', error);
      setSamplerReady(true);
    }
  };

  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const response = await fetch('/api/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  if (!samplerReady) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Tableau Consultant Certification</h1>
          </div>
          <LoadingState message={loadingMessage} />
        </div>
      </MainLayout>
    );
  }

  // Show dashboard for logged-in users
  if (session?.user && samplerReady) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          {/* Dashboard Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, {dashboardData?.user?.name || session.user.name || 'User'}!
            </h1>
            <p className="text-muted-foreground">
              Continue your certification journey with personalized practice sessions
            </p>
          </div>

          {dashboardLoading ? (
            <LoadingState message="Loading your dashboard..." />
          ) : dashboardData ? (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Card className="shadow-none py-0">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-0" />
                      <div className="sm:ml-4">
                        <p className="text-xl sm:text-2xl font-bold">{dashboardData.stats.totalQuizzesTaken}</p>
                        <p className="text-xs text-muted-foreground">Exams Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-none py-0">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-0" />
                      <div className="sm:ml-4">
                        <p className="text-xl sm:text-2xl font-bold">{dashboardData.stats.averageScore}%</p>
                        <p className="text-xs text-muted-foreground">Average Score</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-none py-0">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-0" />
                      <div className="sm:ml-4">
                        <p className="text-xl sm:text-2xl font-bold">{dashboardData.stats.correctAnswers}</p>
                        <p className="text-xs text-muted-foreground">Questions Correct</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-none py-0">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <ClockIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-0" />
                      <div className="sm:ml-4">
                        <p className="text-xl sm:text-2xl font-bold">{dashboardData.stats.totalQuestionsAnswered}</p>
                        <p className="text-xs text-muted-foreground">Total Practice</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Recent Activity */}
                <div className="order-2 lg:order-1 lg:col-span-2">
                  <Card className="shadow-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-5 w-5" />
                        Recent Exam Activity
                      </CardTitle>
                      <CardDescription>Your latest practice sessions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dashboardData.recentQuizzes.length > 0 ? (
                        <div className="space-y-4">
                          {dashboardData.recentQuizzes.slice(0, 3).map((quiz) => (
                            <QuizCard
                              key={quiz.id}
                              id={quiz.id}
                              title={quiz.testName}
                              completedAt={quiz.completedAt}
                              startedAt={quiz.startedAt}
                              percentage={quiz.percentage}
                              passed={quiz.passed}
                              correctAnswers={quiz.correctAnswers}
                              totalQuestions={quiz.totalQuestions}
                              timeTaken={quiz.timeTaken}
                            />
                          ))}
                          {dashboardData.recentQuizzes.length > 3 && (
                            <div className="text-center pt-2">
                              <Link href="/quiz-history">
                                <Button variant="ghost" size="sm">
                                  View All Activity
                                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="mb-2">No exams taken yet</p>
                          <p className="text-sm">Start with a quick review to begin tracking your progress</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* User Certifications or Browse Certifications */}
                <div className="order-1 lg:order-2">
                  <Card className="shadow-none">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PlayIcon className="h-5 w-5" />
                        {dashboardData.userCertifications && dashboardData.userCertifications.length > 0
                          ? 'My Certifications'
                          : 'Start Practicing'}
                      </CardTitle>
                      <CardDescription>
                        {dashboardData.userCertifications && dashboardData.userCertifications.length > 0
                          ? 'Your active certification journey'
                          : 'Popular certifications to begin with'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.userCertifications && dashboardData.userCertifications.length > 0 ? (
                          /* Show user's active certifications */
                          <>
                            {dashboardData.userCertifications.map((userCert) => (
                              <div key={userCert.user_certification_id} className="group">
                                <div className="p-3 border rounded-lg hover:shadow-md transition-shadow">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <Link href={`/certifications/${userCert.tracks}`}>
                                        <p className="font-medium text-sm truncate hover:underline cursor-pointer">{userCert.name}</p>
                                      </Link>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {userCert.level} • {userCert.status === 'completed' ? 'Completed' : 'In Progress'}
                                      </p>
                                    </div>
                                    <div className="flex items-center flex-shrink-0 gap-2">
                                      <Link href={`/certifications/${userCert.tracks}/quiz`}>
                                        <Button size="sm" className="text-xs px-2">
                                          Mock Exam
                                        </Button>
                                      </Link>
                                      <Link href={`/certifications/${userCert.tracks}/review`}>
                                        <Button size="sm" variant="outline" className="text-xs px-2">
                                          Review
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="pt-2">
                              <Link href="/certifications">
                                <Button variant="outline" size="sm" className="w-full">
                                  Browse More Certifications
                                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </>
                        ) : (
                          /* Show popular certifications to start with */
                          <>
                            {dashboardData.topCertifications.map((cert) => (
                              <div key={cert.id} className="group">
                                <div className="p-3 border rounded-lg hover:shadow-md transition-shadow">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                      <Link href={cert.status === 'available' ? `/certifications/${cert.id}` : '/certifications'}>
                                        <p className="font-medium text-sm truncate hover:underline cursor-pointer">{cert.name}</p>
                                      </Link>
                                      <p className="text-xs text-muted-foreground truncate">{cert.level} • {cert.vendor}</p>
                                    </div>
                                    <div className="flex items-center flex-shrink-0">
                                      {cert.status === 'available' ? (
                                        <Link href={`/certifications/${cert.id}`}>
                                          <Button size="sm" className="text-xs px-2 sm:px-3">
                                            Start
                                          </Button>
                                        </Link>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          Coming Soon
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="pt-2">
                              <Link href="/certifications">
                                <Button variant="outline" size="sm" className="w-full">
                                  View All Certifications
                                  <ArrowRightIcon className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </MainLayout>
    );
  }

  // Show loading while redirecting non-logged-in users
  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 pb-8 pt-8 md:pt-0">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to certification marketplace...</p>
        </div>
      </div>
    </MainLayout>
  );
}