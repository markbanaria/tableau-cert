'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Quiz from '@/components/Quiz';
import { QuizData, QuizResult } from '@/types/quiz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { LoadingState } from '@/components/QuestionBankLoader';
import MainLayout from '@/components/layout/main-layout';
import { quizApi, QuizOptions } from '@/services/quizApi';

export default function CertificationQuizPage() {
  const params = useParams();
  const certificationSlug = params.certification as string;

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading exam options...');

  // Quiz options from API
  const [quizOptions, setQuizOptions] = useState<QuizOptions | null>(null);

  // Mock Exam configuration state
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [fullPracticeQuestionCount, setFullPracticeQuestionCount] = useState(60);
  const [domainFocusQuestionCount, setDomainFocusQuestionCount] = useState(30);

  // Certification metadata
  const [certificationInfo, setCertificationInfo] = useState({
    name: '',
    description: '',
    domains: [] as Array<{ id: string; name: string; weight: number }>
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
        // Fallback for tableau-consultant certification
        if (certificationSlug === 'tableau-consultant') {
          setCertificationInfo({
            name: 'Tableau Consultant',
            description: 'Advanced certification for solution architects and consultants implementing enterprise Tableau deployments',
            domains: [
              { id: 'domain1', name: 'Evaluate Current State', weight: 22 },
              { id: 'domain2', name: 'Plan and Prepare Data Connections', weight: 22 },
              { id: 'domain3', name: 'Design and Troubleshoot Calculations and Workbooks', weight: 40 },
              { id: 'domain4', name: 'Establish Governance and Support Published Content', weight: 16 }
            ]
          });
        } else {
          // Generic fallback for other certifications
          setCertificationInfo({
            name: formatCertificationName(certificationSlug),
            description: `Practice exam for ${formatCertificationName(certificationSlug)} certification`,
            domains: []
          });
        }
      }
    } catch (error) {
      console.error('Failed to load certification info:', error);
      // Same fallback logic as above
      if (certificationSlug === 'tableau-consultant') {
        setCertificationInfo({
          name: 'Tableau Consultant',
          description: 'Advanced certification for solution architects and consultants implementing enterprise Tableau deployments',
          domains: [
            { id: 'domain1', name: 'Evaluate Current State', weight: 22 },
            { id: 'domain2', name: 'Plan and Prepare Data Connections', weight: 22 },
            { id: 'domain3', name: 'Design and Troubleshoot Calculations and Workbooks', weight: 40 },
            { id: 'domain4', name: 'Establish Governance and Support Published Content', weight: 16 }
          ]
        });
      } else {
        setCertificationInfo({
          name: formatCertificationName(certificationSlug),
          description: `Practice exam for ${formatCertificationName(certificationSlug)} certification`,
          domains: []
        });
      }
    }
  };

  const loadQuizOptions = async () => {
    try {
      setLoadingOptions(true);
      setLoadingMessage('Fetching exam options from database...');
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

  const formatCertificationName = (slug: string): string => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleQuizComplete = async (result: QuizResult) => {
    console.log('Mock Exam completed:', result);
    // Quiz session is already saved by the Quiz component's saveQuizSession function
    // No need to create duplicate session records here
  };

  const generateFullPracticeExam = async () => {
    if (!quizOptions) {
      alert('Quiz options are still loading. Please wait.');
      return;
    }

    setLoading(true);
    try {
      // Start quiz session in database
      const sessionResponse = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificationSlug,
          type: 'full-practice',
          questionCount: fullPracticeQuestionCount,
          startedAt: new Date().toISOString()
        }),
      });

      const session = sessionResponse.ok ? await sessionResponse.json() : null;

      // Generate quiz questions
      const quizData = await quizApi.generateQuiz({
        questionCount: fullPracticeQuestionCount,
        difficultyLevel: 'mixed'
      });

      // Add session ID to quiz data for tracking
      if (session?.id) {
        quizData.sessionId = session.id;
      }

      setQuizData(quizData);
      setShowQuiz(true);
    } catch (error) {
      console.error('Failed to generate full practice exam:', error);
      alert(`Failed to generate exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateDomainFocusExam = async () => {
    if (!quizOptions) {
      alert('Quiz options are still loading. Please wait.');
      return;
    }

    if (selectedSections.length === 0) {
      alert('Please select at least one domain to focus on.');
      return;
    }

    setLoading(true);
    try {
      // Start quiz session in database
      const sessionResponse = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificationSlug,
          type: 'domain-focus',
          sectionIds: selectedSections,
          questionCount: domainFocusQuestionCount,
          startedAt: new Date().toISOString()
        }),
      });

      const session = sessionResponse.ok ? await sessionResponse.json() : null;

      const quizData = await quizApi.generateQuiz({
        sectionIds: selectedSections,
        questionCount: domainFocusQuestionCount,
        difficultyLevel: 'mixed'
      });

      // Add session ID to quiz data for tracking
      if (session?.id) {
        quizData.sessionId = session.id;
      }

      setQuizData(quizData);
      setShowQuiz(true);
    } catch (error) {
      console.error('Failed to generate domain focus exam:', error);
      alert(`Failed to generate exam: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const getTotalQuestions = () => {
    if (!quizOptions) return 0;
    return quizOptions.sections?.reduce((sum, section) => sum + section.questionCount, 0) || 0;
  };

  const getSelectedSectionsQuestionCount = () => {
    if (!quizOptions || selectedSections.length === 0) return 0;
    return selectedSections.reduce((sum, sectionId) => {
      const section = quizOptions.sections?.find(s => s.id === sectionId);
      return sum + (section?.questionCount || 0);
    }, 0);
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
            onComplete={handleQuizComplete}
            onBack={() => setShowQuiz(false)}
            backLabel="Back to Mock Exam Setup"
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
        <h1 className="text-3xl font-bold mb-2">{certificationInfo.name} Mock Exam</h1>
        <p className="text-muted-foreground">
          {certificationInfo.description}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <span className="font-medium">{getTotalQuestions()}</span> questions available from database
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Full Practice Exam</CardTitle>
            <CardDescription>
              Comprehensive exam with questions from all domains
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col flex-grow space-y-4">
            {certificationInfo.domains.length > 0 && (
              <div className="text-sm space-y-2">
                <p className="font-medium mb-2">Official Domain Weightings:</p>
                {certificationInfo.domains.map(domain => (
                  <div key={domain.id} className="flex justify-between">
                    <span className="text-muted-foreground">{domain.name}:</span>
                    <span className="font-medium">{domain.weight}%</span>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Questions:</label>
              <Select
                value={fullPracticeQuestionCount.toString()}
                onValueChange={(v) => setFullPracticeQuestionCount(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions (Quick Test)</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                  <SelectItem value="30">30 Questions</SelectItem>
                  <SelectItem value="45">45 Questions</SelectItem>
                  <SelectItem value="60">60 Questions (Full Exam)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow"></div>
            <Button
              onClick={generateFullPracticeExam}
              disabled={loading || !quizOptions}
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
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {quizOptions?.sections?.map(section => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={section.id}
                      checked={selectedSections.includes(section.id)}
                      onCheckedChange={() => handleSectionToggle(section.id)}
                    />
                    <label
                      htmlFor={section.id}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {section.name} ({section.questionCount} questions)
                    </label>
                  </div>
                ))}
              </div>
              {selectedSections.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {getSelectedSectionsQuestionCount()} questions available from selected domains
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Questions:</label>
              <Select
                value={domainFocusQuestionCount.toString()}
                onValueChange={(v) => setDomainFocusQuestionCount(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Questions (Quick Test)</SelectItem>
                  <SelectItem value="10">10 Questions</SelectItem>
                  <SelectItem value="15">15 Questions</SelectItem>
                  <SelectItem value="20">20 Questions</SelectItem>
                  <SelectItem value="30">30 Questions</SelectItem>
                  <SelectItem value="40">40 Questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow"></div>
            <Button
              onClick={generateDomainFocusExam}
              disabled={loading || !quizOptions || selectedSections.length === 0}
              className="w-full"
            >
              {loading ? 'Generating...' : 'Start Domain Focus Exam'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {!quizOptions && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-800">
              Loading exam options from database... Please wait before starting an exam.
            </p>
          </CardContent>
        </Card>
      )}

      {quizOptions && getTotalQuestions() < 60 && (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Limited Questions Available</p>
              <p>
                Only {getTotalQuestions()} questions are currently available.
                Full practice exams may have fewer questions than the standard 60.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {quizOptions && getTotalQuestions() === 0 && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-sm text-red-800">
              <p className="font-medium mb-2">No Questions Found</p>
              <p>
                No questions are available in the database. Please check your database connection.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </MainLayout>
  );
}