'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

export default function CertificationReviewPage() {
  const params = useParams();
  const certificationSlug = params.certification as string;

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

  // Certification metadata
  const [certificationInfo, setCertificationInfo] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadCertificationInfo();
    loadQuizOptions();
  }, [certificationSlug]);

  const loadCertificationInfo = async () => {
    try {
      const response = await fetch(`/api/certifications/${certificationSlug}`);
      if (response.ok) {
        const info = await response.json();
        setCertificationInfo(info);
      } else {
        // Fallback for unknown certifications
        setCertificationInfo({
          name: formatCertificationName(certificationSlug),
          description: `Quick review for ${formatCertificationName(certificationSlug)} certification`
        });
      }
    } catch (error) {
      console.error('Failed to load certification info:', error);
      setCertificationInfo({
        name: formatCertificationName(certificationSlug),
        description: `Quick review for ${formatCertificationName(certificationSlug)} certification`
      });
    }
  };

  const loadQuizOptions = async () => {
    try {
      setLoadingOptions(true);
      setLoadingMessage('Fetching quiz options from database...');
      const options = await quizApi.getQuizOptions(certificationSlug);
      setQuizOptions(options);
      setLoadingMessage('Ready!');
    } catch (error) {
      console.error('Failed to load quiz options:', error);
      setLoadingMessage('Failed to load quiz options');
    } finally {
      setLoadingOptions(false);
    }
  };

  const formatCertificationName = (slug: string): string => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const generateRandomQuiz = async () => {
    if (!quizOptions) {
      alert('Quiz options are still loading. Please wait.');
      return;
    }

    setLoading(true);
    try {
      // Start review session in database
      const sessionResponse = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificationSlug,
          type: 'review-random',
          questionCount: randomCount,
          startedAt: new Date().toISOString()
        }),
      });

      const session = sessionResponse.ok ? await sessionResponse.json() : null;

      const quizData = await quizApi.generateQuiz({
        questionCount: randomCount,
        difficultyLevel: 'mixed'
      });

      // Add session ID to quiz data for tracking
      if (session?.id) {
        quizData.sessionId = session.id;
      }

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
      // Start review session in database
      const sessionResponse = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificationSlug,
          type: 'review-targeted',
          sectionIds: selectedSections.length > 0 ? selectedSections : undefined,
          topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
          difficultyLevel: selectedDifficulty,
          questionCount: targetedCount,
          startedAt: new Date().toISOString()
        }),
      });

      const session = sessionResponse.ok ? await sessionResponse.json() : null;

      const quizData = await quizApi.generateQuiz({
        // If topics are selected, use them; otherwise use sections
        sectionIds: selectedTopics.length > 0 ? undefined : (selectedSections.length > 0 ? selectedSections : undefined),
        topicIds: selectedTopics.length > 0 ? selectedTopics : undefined,
        difficultyLevel: selectedDifficulty,
        questionCount: targetedCount
      });

      // Add session ID to quiz data for tracking
      if (session?.id) {
        quizData.sessionId = session.id;
      }

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
    // Don't clear section selection - topics work as a refinement of sections
  };

  const getMaxQuestions = () => {
    if (!quizOptions) return 100;
    return quizOptions.maxQuestions || 100;
  };

  const getAvailableTopics = () => {
    if (!quizOptions || selectedSections.length === 0) return [];

    return selectedSections.flatMap(sectionId => {
      const section = quizOptions.sections?.find(s => s.id === sectionId);
      return section?.topics || [];
    });
  };

  const getAvailableQuestionCount = () => {
    if (!quizOptions) return 0;

    if (selectedTopics.length > 0) {
      return selectedTopics.reduce((sum, topicId) => {
        // Look for topic in available topics from selected sections
        const availableTopics = getAvailableTopics();
        const topic = availableTopics.find(t => t.id === topicId);
        return sum + (topic?.questionCount || 0);
      }, 0);
    }

    if (selectedSections.length > 0) {
      return selectedSections.reduce((sum, sectionId) => {
        const section = quizOptions.sections?.find(s => s.id === sectionId);
        return sum + (section?.questionCount || 0);
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
            <Link href={`/certifications/${certificationSlug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Certification
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
        <Link href={`/certifications/${certificationSlug}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Certification
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{certificationInfo.name} Quick Review</h1>
        <p className="text-muted-foreground">
          {certificationInfo.description} ({getAvailableQuestionCount()} questions available)
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
                  {selectedSections.length > 0 ? (
                    // Show filtered topics from selected sections
                    (() => {
                      const availableTopics = getAvailableTopics();
                      if (availableTopics.length === 0) {
                        return <p className="text-sm text-muted-foreground">No topics found for selected sections</p>;
                      }
                      return availableTopics.map(topic => (
                        <div key={topic.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`topic-${topic.id}`}
                            checked={selectedTopics.includes(topic.id)}
                            onChange={() => handleTopicChange(topic.id)}
                            className="rounded border-gray-300"
                          />
                          <label
                            htmlFor={`topic-${topic.id}`}
                            className="text-sm"
                          >
                            {topic.name} ({topic.questionCount} questions)
                          </label>
                        </div>
                      ));
                    })()
                  ) : (
                    // Show all topics when no sections selected
                    quizOptions?.topics?.map(topic => (
                      <div key={topic.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`topic-${topic.id}`}
                          checked={selectedTopics.includes(topic.id)}
                          onChange={() => handleTopicChange(topic.id)}
                          className="rounded border-gray-300"
                        />
                        <label
                          htmlFor={`topic-${topic.id}`}
                          className="text-sm"
                        >
                          {topic.name} ({topic.questionCount} questions)
                        </label>
                      </div>
                    ))
                  )}
                  {!selectedSections.length && !quizOptions?.topics?.length && (
                    <p className="text-sm text-muted-foreground">No topics available</p>
                  )}
                  {selectedSections.length > 0 && getAvailableTopics().length === 0 && (
                    <p className="text-sm text-muted-foreground">No topics available for selected sections</p>
                  )}
                </div>
                {selectedSections.length > 0 && getAvailableTopics().length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Showing topics from selected sections. Select topics to fine-tune your review.
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