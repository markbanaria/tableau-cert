'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Quiz from '@/components/Quiz';
import { QuizData, QuizQuestion } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getQuizSampler } from '@/services/quizSampler';
import { Shuffle, Target, ArrowLeft } from 'lucide-react';
import { LoadingState } from '@/components/QuestionBankLoader';
import MainLayout from '@/components/layout/main-layout';

export default function QuickReviewPage() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [samplerReady, setSamplerReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

  // Random sampling state
  const [randomCount, setRandomCount] = useState(10);
  const [maxRandomQuestions, setMaxRandomQuestions] = useState(60);

  // Domain/Topic filtering state
  const [domains, setDomains] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('__all__');
  const [targetedCount, setTargetedCount] = useState(10);
  const [maxTargetedQuestions, setMaxTargetedQuestions] = useState(60);

  useEffect(() => {
    initializeSampler();
  }, []);

  useEffect(() => {
    if (selectedDomain && samplerReady) {
      const quizSampler = getQuizSampler();
      const domainTopics = quizSampler.getTopicsForDomain(selectedDomain);
      setTopics(domainTopics);
      setSelectedTopic('__all__'); // Reset topic selection when domain changes
      
      // Update max questions for domain
      const availableCount = quizSampler.getAvailableQuestionCount(selectedDomain);
      setMaxTargetedQuestions(availableCount);
      setTargetedCount(Math.min(10, availableCount));
    } else {
      setTopics([]);
      setSelectedTopic('__all__');
      setMaxTargetedQuestions(60);
    }
  }, [selectedDomain, samplerReady]);

  useEffect(() => {
    if (selectedDomain && selectedTopic && samplerReady) {
      const quizSampler = getQuizSampler();
      const topicName = selectedTopic === '__all__' ? undefined : selectedTopic;
      const availableCount = quizSampler.getAvailableQuestionCount(selectedDomain, topicName);
      setMaxTargetedQuestions(availableCount);
      setTargetedCount(Math.min(targetedCount, availableCount));
    }
  }, [selectedTopic]);

  const initializeSampler = async () => {
    try {
      const quizSampler = getQuizSampler();
      
      await quizSampler.loadQuestionBanks((loaded, total, message) => {
        setLoadingMessage(message);
      });
      
      const availableDomains = quizSampler.getDomains();
      setDomains(availableDomains);
      
      // Set max random questions
      const totalQuestions = quizSampler.getTotalAvailableQuestions();
      setMaxRandomQuestions(totalQuestions);
      
      setSamplerReady(true);
    } catch (error) {
      console.error('Failed to load question banks:', error);
      setSamplerReady(true);
    }
  };

  const generateRandomQuiz = async () => {
    if (!samplerReady) {
      alert('Question banks are still loading. Please wait.');
      return;
    }

    setLoading(true);
    try {
      const quizSampler = getQuizSampler();
      const questions = await quizSampler.getRandomQuestions(randomCount);
      
      const quizData: QuizData = {
        title: `Quick Review: Random ${randomCount} Questions`,
        description: 'Randomly sampled questions from all domains',
        questions: questions
      };

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
    if (!samplerReady) {
      alert('Question banks are still loading. Please wait.');
      return;
    }

    if (!selectedDomain) {
      alert('Please select a domain first.');
      return;
    }

    setLoading(true);
    try {
      const quizSampler = getQuizSampler();
      const questions = await quizSampler.getQuestionsByDomainAndTopic(
        selectedDomain,
        selectedTopic === '__all__' ? undefined : selectedTopic,
        targetedCount
      );

      const domainName = domains.find(d => d.id === selectedDomain)?.name || selectedDomain;
      const topicName = selectedTopic !== '__all__' ? ` - ${formatTopicName(selectedTopic)}` : '';
      
      const quizData: QuizData = {
        title: `Quick Review: ${domainName}${topicName}`,
        description: selectedTopic !== '__all__'
          ? `Questions from ${formatTopicName(selectedTopic)}`
          : `Questions from ${domainName}`,
        questions: questions
      };

      setQuizData(quizData);
      setShowQuiz(true);
    } catch (error) {
      console.error('Failed to generate targeted quiz:', error);
      alert(`Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTopicName = (topic: string): string => {
    return topic
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleBackToSetup = () => {
    setShowQuiz(false);
    setQuizData(null);
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
            <Button onClick={handleBackToSetup} variant="outline">
              ← Back to Review Setup
            </Button>
          </div>
          <Quiz quizData={quizData} reviewMode={true} />
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
        <h1 className="text-3xl font-bold mb-2">Quick Review</h1>
        <p className="text-muted-foreground">
          Practice with random questions or focus on specific domains and topics
        </p>
      </div>

      <Tabs defaultValue="random" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="random" className="flex items-center gap-2">
            <Shuffle className="w-4 h-4" />
            Random Sample
          </TabsTrigger>
          <TabsTrigger value="targeted" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            By Domain & Topic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="random">
          <Card>
            <CardHeader>
              <CardTitle>Random Question Sampling</CardTitle>
              <CardDescription>
                Get a random mix of questions from all domains to test your overall knowledge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="random-count">Number of Questions</Label>
                <Input
                  id="random-count"
                  type="number"
                  min="1"
                  max={maxRandomQuestions}
                  value={randomCount === 0 ? '' : randomCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    if (val === '') {
                      setRandomCount(0);
                    } else {
                      setRandomCount(Math.min(parseInt(val) || 0, maxRandomQuestions));
                    }
                  }}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Choose between 1 and {maxRandomQuestions} questions (max available)
                </p>
              </div>

              <Button 
                onClick={generateRandomQuiz} 
                disabled={loading || !samplerReady || randomCount === 0 || randomCount > maxRandomQuestions}
                size="lg"
                className="w-full sm:w-auto"
              >
                {loading ? 'Generating...' : `Generate ${randomCount} Random Questions`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targeted">
          <Card>
            <CardHeader>
              <CardTitle>Domain & Topic Focused Review</CardTitle>
              <CardDescription>
                Select a specific domain and optionally a topic to focus your review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="domain-select">Domain</Label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger id="domain-select">
                    <SelectValue placeholder="Select a domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map(domain => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedDomain && (
                  <p className="text-sm text-muted-foreground">
                    {domains.find(d => d.id === selectedDomain)?.description}
                  </p>
                )}
              </div>

              {selectedDomain && topics.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="topic-select">Topic (Optional)</Label>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger id="topic-select">
                      <SelectValue placeholder="All topics in domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All topics in domain</SelectItem>
                      {topics.map(topic => (
                        <SelectItem key={topic} value={topic}>
                          {formatTopicName(topic)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Leave blank to review all topics in the selected domain
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="targeted-count">Number of Questions</Label>
                <Input
                  id="targeted-count"
                  type="number"
                  min="1"
                  max={maxTargetedQuestions}
                  value={targetedCount === 0 ? '' : targetedCount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    if (val === '') {
                      setTargetedCount(0);
                    } else {
                      setTargetedCount(Math.min(parseInt(val) || 0, maxTargetedQuestions));
                    }
                  }}
                  className="max-w-xs"
                />
                <p className="text-sm text-muted-foreground">
                  Choose between 1 and {maxTargetedQuestions} questions (max available for selection)
                </p>
              </div>

              <Button 
                onClick={generateTargetedQuiz} 
                disabled={loading || !samplerReady || !selectedDomain || targetedCount === 0 || targetedCount > maxTargetedQuestions}
                size="lg"
                className="w-full sm:w-auto"
              >
                {loading ? 'Generating...' : `Generate ${targetedCount > 0 ? targetedCount : '0'} Questions`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!samplerReady && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading question banks...</p>
          </CardContent>
        </Card>
      )}
    </div>
    </MainLayout>
  );
}
