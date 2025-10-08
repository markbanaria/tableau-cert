'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Quiz from '@/components/Quiz';
import { QuizData } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowPathIcon, AdjustmentsHorizontalIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { LoadingState } from '@/components/QuestionBankLoader';
import MainLayout from '@/components/layout/main-layout';
import { quizApi, QuizOptions } from '@/services/quizApi';

export default function QuickReviewPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading quiz options...');

  // Quiz options from API
  const [quizOptions, setQuizOptions] = useState<QuizOptions | null>(null);

  // Random sampling state
  const [randomCount, setRandomCount] = useState(10);

  // Domain/Topic filtering state
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number | 'mixed'>('mixed');
  const [targetedCount, setTargetedCount] = useState(10);

  useEffect(() => {
    loadQuizOptions();
  }, []);

  const loadQuizOptions = async () => {
    try {
      setLoadingOptions(true);
      setLoadingMessage('Fetching quiz options from database...');
      const options = await quizApi.getQuizOptions();
      setQuizOptions(options);
      setLoadingMessage('Ready!');
    } catch (error) {
      console.error('Failed to load quiz options:', error);
      setLoadingMessage('Failed to load quiz options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const generateRandomQuiz = async () => {
    if (!quizOptions) {
      alert('Quiz options are still loading. Please wait.');
      return;
    }

    setLoading(true);
    try {
      const quizData = await quizApi.generateQuiz({
        questionCount: randomCount,
        difficultyLevel: 'mixed'
      });

      setQuizData(quizData);
      setShowQuiz(true);
    } catch (error) {
      console.error('Failed to generate random quiz:', error);
      alert(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateTargetedQuiz = async () => {
    if (!quizOptions) {
      alert('Quiz options are still loading. Please wait.');
      return;
    }

    if (selectedSections.length === 0 && selectedTopics.length === 0) {
      alert('Please select at least one section or topic.');
      return;
    }

    setLoading(true);
    try {
      const quizData = await quizApi.generateQuiz({
        sectionIds: selectedSections.length > 0 ? selectedSections : undefined,
        topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
        difficultyLevel: selectedDifficulty,
        questionCount: targetedCount
      });

      setQuizData(quizData);
      setShowQuiz(true);
    } catch (error) {
      console.error('Failed to generate targeted quiz:', error);
      alert(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSetup = () => {
    setShowQuiz(false);
    setQuizData(null);
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      }
      return [...prev, sectionId];
    });
    // Clear topic selection when sections change
    setSelectedTopics([]);
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      }
      return [...prev, topicId];
    });
    // Clear section selection when topics change
    setSelectedSections([]);
  };

  const getMaxQuestions = () => {
    if (!quizOptions) return 100;
    return quizOptions.maxQuestions || 100;
  };

  const getAvailableQuestionCount = () => {
    if (!quizOptions) return 0;

    if (selectedSections.length > 0) {
      return selectedSections.reduce((sum, sectionId) => {
        const section = quizOptions.sections?.find(s => s.id === sectionId);
        return sum + (section?.questionCount || 0);
      }, 0);
    }

    if (selectedTopics.length > 0) {
      return selectedTopics.reduce((sum, topicId) => {
        const topic = quizOptions.topics?.find(t => t.id === topicId);
        return sum + (topic?.questionCount || 0);
      }, 0);
    }

    // Total available questions
    return quizOptions.sections?.reduce((sum, section) => sum + section.questionCount, 0) || 0;
  };

  if (loadingOptions) {
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
          <LoadingState message={loadingMessage} />
        </div>
      </MainLayout>
    );
  }

  if (showQuiz && quizData) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <Quiz
            quizData={quizData}
            reviewMode={true}
            onBack={handleBackToSetup}
            backLabel="Back to Review Setup"
          />
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
        <h1 className="text-3xl font-bold mb-2">Quick Review</h1>
        <p className="text-muted-foreground">
          Practice with questions from the database ({getAvailableQuestionCount()} questions available)
        </p>
      </div>

      <Tabs defaultValue="random" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="random" className="flex items-center gap-2">
            <ArrowPathIcon className="w-4 h-4" />
            Random Sample
          </TabsTrigger>
          <TabsTrigger value="targeted" className="flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            By Section & Topic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="random">
          <Card>
            <CardHeader>
              <CardTitle>Random Question Sampling</CardTitle>
              <CardDescription>
                Get a random mix of questions from all sections to test your overall knowledge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="random-count">Number of Questions</Label>
                <Input
                  id="random-count"
                  type="number"
                  min="1"
                  max={getMaxQuestions()}
                  value={randomCount === 0 ? '' : randomCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    if (val === '') {
                      setRandomCount(0);
                    } else {
                      setRandomCount(Math.min(parseInt(val) || 0, getMaxQuestions()));
                    }
                  }}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Choose between 1 and {getMaxQuestions()} questions
                </p>
              </div>

              <Button
                onClick={generateRandomQuiz}
                disabled={loading || !quizOptions || randomCount === 0 || randomCount > getMaxQuestions()}
                size="lg"
                className="w-full sm:w-auto bg-review hover:bg-review/90 text-white"
              >
                {loading ? 'Generating...' : `Generate ${randomCount} Random Questions`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targeted">
          <Card>
            <CardHeader>
              <CardTitle>Section & Topic Focused Review</CardTitle>
              <CardDescription>
                Select specific sections or topics to focus your review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sections Selection */}
              <div className="space-y-2">
                <Label>Select Sections</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {quizOptions?.sections?.map(section => (
                    <div key={section.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`section-${section.id}`}
                        checked={selectedSections.includes(section.id)}
                        onChange={() => handleSectionChange(section.id)}
                        className="rounded border-gray-300"
                        disabled={selectedTopics.length > 0}
                      />
                      <label
                        htmlFor={`section-${section.id}`}
                        className={`text-sm ${selectedTopics.length > 0 ? 'text-gray-400' : ''}`}
                      >
                        {section.name} ({section.questionCount} questions)
                      </label>
                    </div>
                  ))}
                </div>
                {selectedTopics.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Clear topic selection to enable section selection
                  </p>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">OR</span>
                </div>
              </div>

              {/* Topics Selection */}
              <div className="space-y-2">
                <Label>Select Topics</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {quizOptions?.topics?.map(topic => (
                    <div key={topic.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`topic-${topic.id}`}
                        checked={selectedTopics.includes(topic.id)}
                        onChange={() => handleTopicChange(topic.id)}
                        className="rounded border-gray-300"
                        disabled={selectedSections.length > 0}
                      />
                      <label
                        htmlFor={`topic-${topic.id}`}
                        className={`text-sm ${selectedSections.length > 0 ? 'text-gray-400' : ''}`}
                      >
                        {topic.name} ({topic.questionCount} questions)
                      </label>
                    </div>
                  ))}
                </div>
                {selectedSections.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Clear section selection to enable topic selection
                  </p>
                )}
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-2">
                <Label htmlFor="difficulty-select">Difficulty Level</Label>
                <Select
                  value={selectedDifficulty.toString()}
                  onValueChange={(value) => setSelectedDifficulty(value === 'mixed' ? 'mixed' : parseInt(value))}
                >
                  <SelectTrigger id="difficulty-select">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {quizOptions?.difficultyLevels?.map(level => (
                      <SelectItem key={level.value.toString()} value={level.value.toString()}>
                        {level.label} - {level.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Count */}
              <div className="space-y-2">
                <Label htmlFor="targeted-count">Number of Questions</Label>
                <Input
                  id="targeted-count"
                  type="number"
                  min="1"
                  max={Math.min(getMaxQuestions(), getAvailableQuestionCount())}
                  value={targetedCount === 0 ? '' : targetedCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    if (val === '') {
                      setTargetedCount(0);
                    } else {
                      setTargetedCount(Math.min(parseInt(val) || 0, Math.min(getMaxQuestions(), getAvailableQuestionCount())));
                    }
                  }}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  {getAvailableQuestionCount() > 0
                    ? `Choose between 1 and ${Math.min(getMaxQuestions(), getAvailableQuestionCount())} questions`
                    : 'Select sections or topics to see available questions'}
                </p>
              </div>

              <Button
                onClick={generateTargetedQuiz}
                disabled={loading || !quizOptions || (selectedSections.length === 0 && selectedTopics.length === 0) || targetedCount === 0}
                size="lg"
                className="w-full sm:w-auto bg-review hover:bg-review/90 text-white"
              >
                {loading ? 'Generating...' : `Generate ${targetedCount > 0 ? targetedCount : '0'} Questions`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </MainLayout>
  );
}