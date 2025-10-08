'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrophyIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import MainLayout from '@/components/layout/main-layout';
import { LoadingState } from '@/components/QuestionBankLoader';
import QuizCard from '@/components/QuizCard';\nimport { ClientCache } from '@/lib/clientCache';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  userAnswer: number | null;
  isCorrect: boolean;
  metadata: {
    domain: string;
    domainName: string;
  };
}

interface SectionScore {
  name: string;
  correct: number;
  total: number;
  percentage: number;
}

interface QuizReviewData {
  id: string;
  title: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  timeTaken: number | null;
  score: number | null;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
  questions: QuizQuestion[];
  sectionScores?: SectionScore[];
}

export default function QuizReviewPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId as string;

  const [quizData, setQuizData] = useState<QuizReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (session?.user && quizId) {
      loadQuizReviewData();
    }
  }, [session, quizId]);

  const loadQuizReviewData = async () => {
    try {
      setLoading(true);

      // Check cache first since quiz results don't change
      const cachedResult = ClientCache.getCachedQuizResultData(quizId);
      if (cachedResult) {
        setQuizData(cachedResult);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/quiz/${quizId}/review`);
      if (response.ok) {
        const data = await response.json();
        setQuizData(data);
        // Cache the quiz result data (it doesn't change)
        ClientCache.cacheQuizResultData(quizId, data);
      } else if (response.status === 404) {
        setError('Quiz not found');
      } else {
        setError('Failed to load quiz review');
      }
    } catch (error) {
      console.error('Failed to load quiz review:', error);
      setError('Failed to load quiz review');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteQuiz = async () => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        router.push('/quiz-history');
      } else {
        setError('Failed to delete quiz');
      }
    } catch (error) {
      console.error('Failed to delete quiz:', error);
      setError('Failed to delete quiz');
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <LoadingState message="Loading quiz review..." />
        </div>
      </MainLayout>
    );
  }

  if (!session?.user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <Card className="shadow-none">
            <CardContent className="pt-6">
              <p className="text-center">Please sign in to view quiz reviews.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (error || !quizData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <div className="mb-4">
            <Link href="/quiz-history">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Quiz History
              </Button>
            </Link>
          </div>
          <Card className="shadow-none">
            <CardContent className="pt-6">
              <p className="text-center text-red-600">{error || 'Quiz not found'}</p>
              <div className="text-center mt-4">
                <Link href="/quiz-history">
                  <Button>Back to Quiz History</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 sm:px-6 pb-6 sm:pb-8 pt-6 sm:pt-8 md:pt-0">
        <div className="mb-3 sm:mb-4">
          <Link href="/quiz-history">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Quiz History
            </Button>
          </Link>
        </div>

        {/* Quiz Summary Card */}
        <QuizCard
          id={quizData.id}
          title={quizData.title}
          completedAt={quizData.completedAt}
          startedAt={quizData.startedAt}
          percentage={quizData.percentage}
          passed={quizData.passed}
          correctAnswers={quizData.correctAnswers}
          totalQuestions={quizData.totalQuestions}
          timeTaken={quizData.timeTaken}
          linkToReview={false}
        />


        {/* Section Scores */}
        {quizData.sectionScores && quizData.sectionScores.length > 0 && (
          <Card className="mb-6 sm:mb-8 shadow-none">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Score by Section</CardTitle>
              <CardDescription className="text-sm sm:text-base">Performance breakdown across different knowledge areas</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                {quizData.sectionScores.map((section, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-sm sm:text-sm font-medium">{section.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({section.correct}/{section.total} questions)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-black">
                          {section.percentage}%
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={section.percentage}
                      className="h-2 [&>div]:bg-black"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detailed Question Review */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Question Review</h2>

          {quizData.questions.map((question, index) => (
            <Card key={question.id} className="shadow-none">
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{
                    backgroundColor: question.isCorrect ? 'var(--passed)' : 'var(--failed)'
                  }}>
                    {question.isCorrect ? (
                      <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    ) : (
                      <XCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg">Question {index + 1}</CardTitle>
                    <p className="text-sm sm:text-base mt-1 leading-relaxed">{question.question}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="space-y-2 mb-3 sm:mb-4">
                  {question.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === question.correctAnswer;
                    const isUserAnswer = optionIndex === question.userAnswer;
                    const isUserWrong = isUserAnswer && !isCorrect;

                    let bgClass = 'bg-background border-border';
                    let textClass = '';
                    let bgStyle = {};

                    if (isCorrect) {
                      bgClass = 'border-[var(--passed-border)]';
                      bgStyle = { backgroundColor: 'var(--passed-light)' };
                    } else if (isUserWrong) {
                      bgClass = 'border-[var(--failed-border)]';
                      bgStyle = { backgroundColor: 'var(--failed-light)' };
                    }

                    return (
                      <div
                        key={optionIndex}
                        className={`p-2.5 sm:p-3 rounded-md border text-xs sm:text-sm ${bgClass} ${textClass}`}
                        style={bgStyle}
                      >
                        <div className="flex items-start gap-2">
                          <span className="font-medium flex-shrink-0">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          <span className="flex-1 leading-relaxed">{option}</span>
                          <div className="min-w-[20px] sm:min-w-[24px] flex justify-center flex-shrink-0">
                            {isCorrect && (
                              <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--passed)' }} />
                            )}
                            {isUserWrong && (
                              <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--failed)' }} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>


                {question.explanation && (
                  <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-md" style={{ backgroundColor: '#fafafa' }}>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      <strong>Explanation:</strong>
                      <span className="ml-1">{question.explanation}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 sm:mt-8">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="flex gap-2">
              <Link href="/quiz-history" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs">View All Quizzes</Button>
              </Link>
              <Link href="/quiz" className="flex-1">
                <Button size="sm" className="w-full text-xs">Take Another Quiz</Button>
              </Link>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteQuiz}
              disabled={deleting}
              className="w-full text-xs"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Quiz'}
            </Button>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex gap-4 justify-between">
            <div className="flex gap-4">
              <Link href="/quiz-history">
                <Button variant="outline">View All Quizzes</Button>
              </Link>
              <Link href="/quiz">
                <Button>Take Another Quiz</Button>
              </Link>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteQuiz}
              disabled={deleting}
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Quiz'}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}