'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Quiz from '@/components/Quiz';
import { QuizData, QuizResult } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { getQuizSampler, SamplingOptions } from '@/services/quizSampler';
import { TABLEAU_CONSULTANT_COMPOSITION } from '@/config/testComposition';
import { ArrowLeft } from 'lucide-react';
import { LoadingState } from '@/components/QuestionBankLoader';
import MainLayout from '@/components/layout/main-layout';

export default function MockExamPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [samplerReady, setSamplerReady] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

  // Mock Exam configuration state
  const [compositionType, setCompositionType] = useState<'full_practice' | 'domain_focus'>('full_practice');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [fullPracticeQuestionCount, setFullPracticeQuestionCount] = useState(60);
  const [domainFocusQuestionCount, setDomainFocusQuestionCount] = useState(30);

  useEffect(() => {
    initializeSampler();
  }, []);

  const initializeSampler = async () => {
    try {
      const quizSampler = getQuizSampler();
      
      await quizSampler.loadQuestionBanks((loaded, total, message) => {
        setLoadingMessage(message);
      });
      
      const stats = quizSampler.getQuestionBankStats();
      const totalQuestions = Object.values(stats).reduce((sum, stat) => sum + stat.questionCount, 0);
      setAvailableQuestions(totalQuestions);
      setSamplerReady(true);
    } catch (error) {
      console.error('Failed to load question banks:', error);
      setSamplerReady(true);
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    console.log('Mock Exam completed:', result);
  };

  const generateQuiz = async (type: 'full_practice' | 'domain_focus') => {
    if (!samplerReady) {
      alert('Question banks are still loading. Please wait.');
      return;
    }

    if (availableQuestions === 0) {
      alert('No question banks available. Please generate some question banks first.');
      return;
    }

    setLoading(true);
    try {
      const quizSampler = getQuizSampler();
      const questionCount = type === 'full_practice' ? fullPracticeQuestionCount : domainFocusQuestionCount;
      const options: SamplingOptions = {
        totalQuestions: Math.min(questionCount, availableQuestions),
        compositionType: type,
        selectedDomains: type === 'domain_focus' ? selectedDomains : undefined,
      };

      const generatedQuiz = await quizSampler.generateQuiz(options);
      setQuizData(generatedQuiz);
      setShowQuiz(true);
    } catch (error) {
      console.error('Failed to generate mock exam:', error);
      alert(`Failed to generate mock exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainToggle = (domainId: string) => {
    setSelectedDomains(prev =>
      prev.includes(domainId)
        ? prev.filter(id => id !== domainId)
        : [...prev, domainId]
    );
  };

  if (!samplerReady) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          <LoadingState message={loadingMessage} />
        </div>
      </MainLayout>
    );
  }

  if (showQuiz && quizData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => setShowQuiz(false)}
            >
            ← Back to Mock Exam Setup
          </Button>
        </div>
        <Quiz quizData={quizData} onComplete={handleQuizComplete} />
      </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-6 py-8">
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau Consultant Mock Exam</h1>
        <p className="text-muted-foreground">
          Generate practice exams based on official exam composition
        </p>
        {samplerReady && (
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-medium">{availableQuestions}</span> questions available
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Full Practice Exam</CardTitle>
            <CardDescription>
              60 questions with official domain weightings
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow space-y-4">
            <div className="text-sm space-y-2">
              {TABLEAU_CONSULTANT_COMPOSITION.domains.map(domain => (
                <div key={domain.id} className="flex justify-between">
                  <span className="text-muted-foreground">{domain.name}:</span>
                  <span className="font-medium">{domain.weightPercentage}%</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Questions:</label>
              <Select value={fullPracticeQuestionCount.toString()} onValueChange={(v) => setFullPracticeQuestionCount(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions (Test)</SelectItem>
                  <SelectItem value="30">30 Questions</SelectItem>
                  <SelectItem value="45">45 Questions</SelectItem>
                  <SelectItem value="60">60 Questions (Full)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow"></div>
            <Button
              onClick={() => {
                setCompositionType('full_practice');
                generateQuiz('full_practice');
              }}
              disabled={loading || !samplerReady}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Start Full Practice Exam'}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Domain Focus Exam</CardTitle>
            <CardDescription>
              Focus on specific exam domains
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Domains:</label>
              {TABLEAU_CONSULTANT_COMPOSITION.domains.map(domain => (
                <div key={domain.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={domain.id}
                    checked={selectedDomains.includes(domain.id)}
                    onCheckedChange={() => handleDomainToggle(domain.id)}
                  />
                  <label
                    htmlFor={domain.id}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {domain.name}
                  </label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Questions:</label>
              <Select value={domainFocusQuestionCount.toString()} onValueChange={(v) => setDomainFocusQuestionCount(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions (Test)</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                  <SelectItem value="30">30 Questions</SelectItem>
                  <SelectItem value="40">40 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow"></div>
            <Button
              onClick={() => {
                setCompositionType('domain_focus');
                generateQuiz('domain_focus');
              }}
              disabled={loading || !samplerReady || selectedDomains.length === 0}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Start Domain Focus Exam'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {!samplerReady && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-800">
              Loading question banks... Please wait before starting an exam.
            </p>
          </CardContent>
        </Card>
      )}

      {samplerReady && availableQuestions < 60 && (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Limited Question Banks Available</p>
              <p>
                Only {availableQuestions} questions are currently available.
                Full practice exams may have fewer questions than the standard 60.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {samplerReady && availableQuestions === 0 && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-sm text-red-800">
              <p className="font-medium mb-2">No Question Banks Found</p>
              <p>
                No question banks are available. Please generate question banks first.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </MainLayout>
  );
}
