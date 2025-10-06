'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { getQuizSampler } from '@/services/quizSampler';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface QuestionBankLoaderProps {
  onLoadComplete?: () => void;
  showDetails?: boolean;
}

export function QuestionBankLoader({ onLoadComplete, showDetails = true }: QuestionBankLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing...');

  useEffect(() => {
    // Simulate progress updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  if (!showDetails) {
    return (
      <div className="flex items-center justify-center gap-2">
        <ArrowPathIcon className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading questions...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          Loading Question Banks
        </CardTitle>
        <CardDescription>
          {message}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {progress}% complete
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
