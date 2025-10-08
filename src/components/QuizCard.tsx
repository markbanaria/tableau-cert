'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface QuizCardProps {
  id: string;
  title: string;
  completedAt: string | null;
  startedAt: string;
  percentage: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: number | null;
  linkToReview?: boolean;
}

export default function QuizCard({
  id,
  title,
  completedAt,
  startedAt,
  percentage,
  passed,
  correctAnswers,
  totalQuestions,
  timeTaken,
  linkToReview = true
}: QuizCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const cardContent = (
    <Card className="hover:shadow-md transition-shadow shadow-none cursor-pointer overflow-hidden mb-6 p-0">
      <CardContent className="p-0">
        {/* Top section */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
          {/* Desktop layout - all on same line */}
          <div className="hidden md:flex items-center gap-3">
            <h3 className="font-medium text-lg truncate flex-1">{title}</h3>
            <span className="text-lg font-medium text-black">{percentage}%</span>
            {passed ? (
              <Badge
                className="text-xs sm:text-sm"
                style={{
                  backgroundColor: 'var(--passed)',
                  borderColor: 'var(--passed)',
                  color: 'white'
                }}
              >
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                Passed
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs sm:text-sm">
                <XCircleIcon className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}
          </div>

          {/* Mobile layout - badge below title row */}
          <div className="md:hidden">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <h3 className="font-medium text-base sm:text-lg truncate flex-1">{title}</h3>
              <span className="text-base sm:text-lg font-medium text-black">{percentage}%</span>
            </div>
            {passed ? (
              <Badge
                className="inline-flex text-xs sm:text-sm"
                style={{
                  backgroundColor: 'var(--passed)',
                  borderColor: 'var(--passed)',
                  color: 'white'
                }}
              >
                <CheckCircleIcon className="w-3 h-3 mr-1" />
                Passed
              </Badge>
            ) : (
              <Badge variant="secondary" className="inline-flex text-xs sm:text-sm">
                <XCircleIcon className="w-3 h-3 mr-1" />
                Failed
              </Badge>
            )}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Completed {formatDate(completedAt || startedAt)}
          </p>

          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: passed ? 'var(--passed)' : 'black'
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom section with pills */}
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-neutral-100 border">
              <span className="text-xs font-mono font-medium">{correctAnswers}</span>
              <span className="text-xs font-mono text-muted-foreground">Correct</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-neutral-100 border">
              <span className="text-xs font-mono font-medium">{totalQuestions - correctAnswers}</span>
              <span className="text-xs font-mono text-muted-foreground">Incorrect</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-neutral-100 border">
              <span className="text-xs font-mono font-medium">{formatDuration(timeTaken)}</span>
              <span className="text-xs font-mono text-muted-foreground">Time</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-neutral-100 border">
              <span className="text-xs font-mono font-medium">{totalQuestions}</span>
              <span className="text-xs font-mono text-muted-foreground">Total</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (linkToReview) {
    return <Link href={`/quiz-review/${id}`}>{cardContent}</Link>;
  }

  return cardContent;
}