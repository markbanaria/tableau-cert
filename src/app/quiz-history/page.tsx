'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ClientCache } from '@/lib/clientCache';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeftIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import MainLayout from '@/components/layout/main-layout';
import { LoadingState } from '@/components/QuestionBankLoader';
import QuizCard from '@/components/QuizCard';

interface QuizHistoryItem {
  id: string;
  status: string;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  timeTaken: number | null;
  testName: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  passed: boolean;
}

interface QuizHistoryResponse {
  quizzes: QuizHistoryItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export default function QuizHistoryPage() {
  const { data: session, status } = useSession();
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadQuizHistory();
    }
  }, [session]);

  const loadQuizHistory = async () => {
    try {
      setLoading(true);

      // Check cache first and display it immediately for better UX
      const cachedHistory = ClientCache.getCachedQuizHistory();
      if (cachedHistory) {
        console.log('Using cached quiz history as initial data');
        setQuizHistory(cachedHistory);
      }

      // Always fetch fresh data when user visits the page
      const response = await fetch('/api/quiz/sessions');
      if (response.ok) {
        const data: QuizHistoryResponse = await response.json();
        setQuizHistory(data.quizzes);
        // Cache the fresh quiz history
        ClientCache.cacheQuizHistory(data.quizzes);
      } else {
        setError('Failed to load quiz history');
      }
    } catch (error) {
      console.error('Failed to load quiz history:', error);
      setError('Failed to load quiz history');
    } finally {
      setLoading(false);
    }
  };


  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <LoadingState message="Loading..." />
        </div>
      </MainLayout>
    );
  }

  if (!session?.user) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center">Please sign in to view your quiz history.</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Quiz History</h1>
          <p className="text-muted-foreground">
            Review your completed quizzes and track your progress
          </p>
        </div>

        {loading ? (
          <LoadingState message="Loading quiz history..." />
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-red-600">{error}</p>
              <div className="text-center mt-4">
                <Button onClick={loadQuizHistory}>Try Again</Button>
              </div>
            </CardContent>
          </Card>
        ) : quizHistory.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No quizzes taken yet</p>
                <p className="text-muted-foreground mb-4">
                  Start with a practice quiz to see your results here
                </p>
                <Link href="/quiz">
                  <Button>Take Your First Quiz</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quizHistory.map((quiz) => (
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
          </div>
        )}
      </div>
    </MainLayout>
  );
}