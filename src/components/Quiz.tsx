'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { QuizData, QuizAnswer, QuizResult, QuizQuestion, DomainScore } from '@/types/quiz';
import { ArrowTopRightOnSquareIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, HomeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { generateResultsPDF } from '@/utils/generateResultsPDF';
import { ClientCache } from '@/lib/clientCache';

interface QuizProps {
  quizData: QuizData;
  onComplete?: (result: QuizResult) => void;
  reviewMode?: boolean;
  onBack?: () => void;
  backLabel?: string;
}

export default function Quiz({ quizData, onComplete, reviewMode = false, onBack, backLabel }: QuizProps) {
  const router = useRouter();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);

  // Unified answer tracking system - single source of truth
  const [answerMap, setAnswerMap] = useState<Map<string, string>>(new Map());

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

  // Restore selected option when question changes
  useEffect(() => {
    const savedAnswer = answerMap.get(currentQuestion.id);
    setSelectedOption(savedAnswer || '');

    // Reset showHint when changing questions
    setShowHint(false);
  }, [currentQuestionIndex, currentQuestion.id]);

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
    // Save answer immediately to unified map
    setAnswerMap(prev => {
      const newMap = new Map(prev);
      newMap.set(currentQuestion.id, value);
      return newMap;
    });
  };

  const calculateDomainScores = (answers: QuizAnswer[]): DomainScore[] => {
    // Group questions by domain
    const domainMap = new Map<string, { 
      domainId: string;
      domainName: string;
      questions: QuizQuestion[];
      correctCount: number;
    }>();

    quizData.questions.forEach(question => {
      const domainId = question.metadata?.domain || 'unknown';
      const domainName = question.metadata?.domainName || 'Unknown Domain';
      
      if (!domainMap.has(domainId)) {
        domainMap.set(domainId, {
          domainId,
          domainName,
          questions: [],
          correctCount: 0
        });
      }
      
      domainMap.get(domainId)!.questions.push(question);
    });

    // Calculate scores for each domain
    answers.forEach(answer => {
      const question = quizData.questions.find(q => q.id === answer.questionId);
      if (question) {
        const domainId = question.metadata?.domain || 'unknown';
        const domainData = domainMap.get(domainId);
        
        if (domainData && question.correctAnswer === answer.selectedOption) {
          domainData.correctCount++;
        }
      }
    });

    // Convert to DomainScore array
    return Array.from(domainMap.values()).map(domain => ({
      domainId: domain.domainId,
      domainName: domain.domainName,
      score: domain.correctCount,
      totalQuestions: domain.questions.length,
      percentage: domain.questions.length > 0 
        ? Math.round((domain.correctCount / domain.questions.length) * 100)
        : 0
    }));
  };

  const calculateDomainBreakdownForReview = (): DomainScore[] => {
    // Group questions by domain for review mode (no scoring)
    const domainMap = new Map<string, { 
      domainId: string;
      domainName: string;
      count: number;
    }>();

    quizData.questions.forEach(question => {
      const domainId = question.metadata?.domain || 'unknown';
      const domainName = question.metadata?.domainName || 'Unknown Domain';
      
      if (!domainMap.has(domainId)) {
        domainMap.set(domainId, {
          domainId,
          domainName,
          count: 0
        });
      }
      
      domainMap.get(domainId)!.count++;
    });

    // Convert to DomainScore array (no actual scores in review mode)
    return Array.from(domainMap.values()).map(domain => ({
      domainId: domain.domainId,
      domainName: domain.domainName,
      score: 0,
      totalQuestions: domain.count,
      percentage: 0
    }));
  };

  const saveQuizSession = async (result: QuizResult): Promise<boolean> => {
    if (!quizData.sessionId) return true;

    try {
      const timeTaken = Math.round((new Date().getTime() - startTime.getTime()) / 1000);

      // Prepare response data for database
      const responses = result.answers.map(answer => {
        const question = quizData.questions.find(q => q.id === answer.questionId);
        const isCorrect = question ? question.correctAnswer === answer.selectedOption : false;
        const answerId = question?.answerIds?.[answer.selectedOption] || null;

        return {
          questionId: answer.questionId,
          answerId,
          userAnswer: question?.options[answer.selectedOption] || null,
          isCorrect
        };
      });

      const response = await fetch('/api/quiz/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quizData.sessionId,
          sessionId: quizData.sessionId,
          result: {
            ...result,
            timeTaken,
            responses
          },
          completedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save quiz session: ${response.statusText}`);
      }

      // Invalidate cache after successful quiz completion
      ClientCache.invalidateUserActivityData();

      return true;
    } catch (error) {
      console.error('Failed to save quiz session:', error);
      return false;
    }
  };

  const handleNext = async () => {
    if (!reviewMode && selectedOption === '') return;

    if (!reviewMode && isLastQuestion) {
      setIsSaving(true);

      try {
        // Generate final answers array from the answer map
        const finalAnswers: QuizAnswer[] = [];
        for (const [questionId, answer] of answerMap.entries()) {
          finalAnswers.push({
            questionId,
            selectedOption: parseInt(answer)
          });
        }

        const score = finalAnswers.reduce((acc, answer) => {
          const question = quizData.questions.find(q => q.id === answer.questionId);
          return question && question.correctAnswer === answer.selectedOption ? acc + 1 : acc;
        }, 0);

        const domainScores = calculateDomainScores(finalAnswers);

        // Calculate weighted score (out of 1000) based on domain performance
        // This assumes the quiz follows official domain weightings
        const weightedScore = Math.round((score / quizData.questions.length) * 1000);

        const timeTaken = Math.round((new Date().getTime() - startTime.getTime()) / 1000);

        const quizResult: QuizResult = {
          score,
          totalQuestions: quizData.questions.length,
          answers: finalAnswers,
          passed: score >= Math.ceil(quizData.questions.length * 0.7), // 70% pass rate
          domainScores,
          weightedScore,
          timeTaken
        };

        // Save session to database BEFORE showing results
        if (quizData.sessionId) {
          const saveSuccess = await saveQuizSession(quizResult);
          if (!saveSuccess) {
            // Still show results even if save failed, but maybe show a warning
            console.warn('Quiz results may not be saved properly');
          }
        }

        setResult(quizResult);
        setIsComplete(true);
        onComplete?.(quizResult);
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // In review mode, when reaching the last question, show completion
    if (reviewMode && isLastQuestion) {
      const domainScores = calculateDomainBreakdownForReview();

      const quizResult: QuizResult = {
        score: 0, // No scoring in review mode
        totalQuestions: quizData.questions.length,
        answers: [], // No tracked answers in review mode
        passed: true, // Always "passed" in review mode since it's just for learning
        domainScores
      };

      setResult(quizResult);
      setIsComplete(true);
      onComplete?.(quizResult);
      return;
    }

    // Move to next question (both quiz and review mode)
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowHint(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption('');
    setIsComplete(false);
    setResult(null);
    setAnswerMap(new Map());
    setShowFullDetails(false);
    setStartTime(new Date());
  };

  const handleDownloadPDF = () => {
    if (result) {
      generateResultsPDF(quizData, result, reviewMode);
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (isComplete && result) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {reviewMode ? 'Review Complete!' : 'Quiz Complete!'}
          </CardTitle>
          <CardDescription>{quizData.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reviewMode ? (
            <>
              {/* Review Mode Summary */}
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircleIcon className="w-16 h-16 text-review" />
                </div>
                <div className="text-lg font-semibold">
                  You reviewed {result.totalQuestions} questions
                </div>
                <p className="text-sm text-muted-foreground">
                  Great job! You've completed the review session.
                </p>
              </div>

              {/* Domain Breakdown for Review */}
              {result.domainScores && result.domainScores.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-center">Domain Coverage</h3>
                  <div className="grid gap-3">
                    {result.domainScores.map((domain) => (
                      <div key={domain.domainId} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{domain.domainName}</span>
                          <span className="text-sm text-muted-foreground">
                            {domain.totalQuestions} question{domain.totalQuestions !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-review h-2 rounded-full"
                            style={{ 
                              width: `${(domain.totalQuestions / result.totalQuestions) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Quiz Mode Summary */}
              <div className="text-center space-y-4 pb-6 border-b">
                <div className="text-5xl font-bold">
                  {result.score}/{result.totalQuestions}
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-semibold">
                    {Math.round((result.score / result.totalQuestions) * 100)}%
                  </div>
                  {result.weightedScore && (
                    <div className="text-lg text-muted-foreground">
                      Weighted Score: {result.weightedScore}/1000
                    </div>
                  )}
                </div>
                <div className={`text-xl font-semibold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.passed ? '✅ Passed!' : '❌ Failed'}
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.passed
                    ? 'Congratulations! You passed the quiz.'
                    : 'You need 70% to pass. Try again!'}
                </p>
              </div>

              {/* Domain Breakdown for Quiz */}
              {result.domainScores && result.domainScores.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center">Performance by Domain</h3>
                  <Accordion type="multiple" className="w-full">
                    {result.domainScores
                      .sort((a, b) => a.domainName.localeCompare(b.domainName))
                      .map((domain) => {
                        // Get all questions for this domain
                        const domainQuestions = quizData.questions.filter(
                          q => (q.metadata?.domain || 'unknown') === domain.domainId
                        );
                        
                        return (
                          <AccordionItem key={domain.domainId} value={domain.domainId} className="border rounded-lg mb-3 px-4">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-start justify-between w-full pr-4">
                                <div className="flex-1 text-left">
                                  <h4 className="font-medium text-sm mb-1">{domain.domainName}</h4>
                                  <div className="text-xs text-muted-foreground">
                                    {domain.score}/{domain.totalQuestions} correct
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${
                                    domain.percentage >= 70 ? 'text-green-600' : 
                                    domain.percentage >= 50 ? 'text-yellow-600' : 
                                    'text-red-600'
                                  }`}>
                                    {domain.percentage}%
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-2">
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                  <div
                                    className={`h-3 rounded-full transition-all ${
                                      domain.percentage >= 70 ? 'bg-green-500' : 
                                      domain.percentage >= 50 ? 'bg-yellow-500' : 
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${domain.percentage}%` }}
                                  />
                                </div>
                                
                                {/* Individual question results */}
                                <div
                                  className="space-y-2 no-select no-context-menu"
                                  onCopy={(e) => e.preventDefault()}
                                  onCut={(e) => e.preventDefault()}
                                  onPaste={(e) => e.preventDefault()}
                                  onContextMenu={(e) => e.preventDefault()}
                                >
                                  {domainQuestions.map((question, idx) => {
                                    const answer = result.answers.find(a => a.questionId === question.id);
                                    const isCorrect = answer && answer.selectedOption === question.correctAnswer;

                                    return (
                                      <div
                                        key={question.id}
                                        className={`p-3 rounded-md border ${
                                          isCorrect
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-red-50 border-red-200'
                                        }`}
                                      >
                                        <div className="flex items-start gap-2">
                                          {isCorrect ? (
                                            <CheckCircleIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                          ) : (
                                            <XCircleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium mb-1">
                                              Question {idx + 1}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                              {question.question}
                                            </p>
                                            {!isCorrect && answer && (
                                              <div className="mt-2 text-xs">
                                                <p className="text-red-700">
                                                  Your answer: {question.options[answer.selectedOption]}
                                                </p>
                                                <p className="text-green-700 mt-1">
                                                  Correct answer: {question.options[question.correctAnswer]}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                  </Accordion>
                </div>
              )}
            </>
          )}

          {/* Full Details Section */}
          {showFullDetails && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-center">Complete Question Review</h3>
              <div className="space-y-6">
                {quizData.questions.map((question, index) => {
                  const answer = !reviewMode && result.answers ?
                    result.answers.find(a => a.questionId === question.id) : null;
                  const isCorrect = answer && answer.selectedOption === question.correctAnswer;

                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="mb-3">
                        <h4 className="font-medium text-sm mb-2">
                          Q{index + 1}. {question.question}
                        </h4>
                      </div>

                      <div className="space-y-2 mb-3">
                        {question.options.map((option, optIndex) => {
                          const isThisCorrect = optIndex === question.correctAnswer;
                          const isUserAnswer = answer?.selectedOption === optIndex;

                          return (
                            <div
                              key={optIndex}
                              className={`p-2 rounded text-sm ${
                                isThisCorrect ? 'bg-green-50 border border-green-200' :
                                isUserAnswer && !isThisCorrect ? 'bg-red-50 border border-red-200' :
                                'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isThisCorrect && (
                                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                )}
                                {isUserAnswer && !isThisCorrect && (
                                  <XCircleIcon className="w-4 h-4 text-red-600" />
                                )}
                                <span className={`${
                                  isThisCorrect ? 'font-medium text-green-700' :
                                  isUserAnswer && !isThisCorrect ? 'text-red-700' :
                                  ''
                                }`}>
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                          <p className="text-sm text-blue-800">{question.explanation}</p>
                        </div>
                      )}

                      {!reviewMode && answer && (
                        <div className="mt-2 text-xs">
                          {isCorrect ? (
                            <span className="text-green-600 font-medium">✓ Correct</span>
                          ) : (
                            <span className="text-red-600 font-medium">✗ Incorrect</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            <Button
              onClick={handleRestart}
              className={reviewMode ? 'bg-review hover:bg-review/90 text-white' : ''}
            >
              {reviewMode ? 'Review Again' : 'Take Quiz Again'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFullDetails(!showFullDetails)}
            >
              {showFullDetails ? 'Hide Details' : 'Show Full Details'}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={handleGoHome}
            className="w-full"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-2xl mx-auto space-y-4">
        {/* Back button */}
        {onBack && (
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              {backLabel || 'Back'}
            </Button>
          </div>
        )}
        
        {/* Title and description outside card */}
        <div>
          <h2 className="text-xl font-semibold mb-6">{quizData.title}</h2>
          {quizData.description && (
            <p className="text-sm text-muted-foreground mt-1">{quizData.description}</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="space-y-3">
              {/* Top row: Review Mode badge, counter, and Show Answer button */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {reviewMode && (
                    <span className="text-xs bg-review-light text-review px-2 py-1 rounded whitespace-nowrap font-medium">
                      Review Mode
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {currentQuestionIndex + 1} of {quizData.questions.length}
                  </span>
                </div>
                {/* Show Answer button */}
                {reviewMode && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 ${showHint ? 'bg-gray-100 hover:bg-gray-200' : ''}`}
                        onClick={() => setShowHint(!showHint)}
                      >
                        {showHint ? "Hide Answer" : "Show Answer"}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show answer and explanation</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </CardHeader>
        <CardContent 
          className="space-y-6"
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="no-select no-context-menu">
            <div className="mb-10">
              <h3 className="text-lg font-medium">
                {currentQuestion.question}
              </h3>
            </div>

            <RadioGroup
              value={selectedOption}
              onValueChange={handleOptionSelect}
              className="mb-6"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    className={`cursor-pointer ${
                      reviewMode
                        ? showHint && index === currentQuestion.correctAnswer
                          ? "border-green-500 text-green-500"
                          : selectedOption === index.toString()
                          ? "border-review text-review"
                          : ""
                        : ""
                    }`}
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className={`text-sm font-normal cursor-pointer flex-1 flex items-center pointer-events-auto ${
                      reviewMode && showHint && index === currentQuestion.correctAnswer
                        ? "text-green-700 font-medium"
                        : ""
                    }`}
                    onClick={() => handleOptionSelect(index.toString())}
                  >
                    {option}
                    {reviewMode && showHint && index === currentQuestion.correctAnswer && (
                      <CheckCircleIcon className="ml-2 min-w-4 w-4 h-4 text-green-600" />
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Answer explanation */}
            {reviewMode && showHint && currentQuestion.explanation && (
              <div className="mt-4 p-4 bg-review-light border border-review-border rounded-lg no-select no-context-menu">
                <h4 className="font-medium text-review mb-2">Explanation:</h4>
                <p className="text-sm text-gray-700">{currentQuestion.explanation}</p>
                {currentQuestion.metadata?.sourceUrl && (
                  <div className="mt-3 pt-3 border-t border-review-border">
                    <a
                      href={currentQuestion.metadata.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-review hover:text-review/80 underline pointer-events-auto"
                    >
                      <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                      View source documentation
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            {currentQuestionIndex > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${reviewMode ? 'bg-review' : 'bg-primary'}`}
                style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <Button
            onClick={handleNext}
            disabled={(!reviewMode && selectedOption === '') || isSaving}
            className={reviewMode ? 'bg-review hover:bg-review/90 text-white' : ''}
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving results...
              </div>
            ) : (
              currentQuestionIndex === quizData.questions.length - 1
                ? reviewMode ? 'Finish Review' : 'Finish'
                : 'Next'
            )}
          </Button>
        </CardFooter>
      </Card>
      </div>

      {/* Loading Overlay */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-2xl flex items-center gap-4 max-w-md mx-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div>
              <div className="text-lg font-semibold">Saving your quiz results...</div>
              <div className="text-sm text-gray-600 mt-1">Please wait while we save your answers</div>
            </div>
          </div>
        </div>
      )}
    </TooltipProvider>
  );
}