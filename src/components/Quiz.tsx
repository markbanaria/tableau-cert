'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { QuizData, QuizAnswer, QuizResult, QuizQuestion, DomainScore } from '@/types/quiz';
import { HelpCircle, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

interface QuizProps {
  quizData: QuizData;
  onComplete?: (result: QuizResult) => void;
  reviewMode?: boolean;
}

export default function Quiz({ quizData, onComplete, reviewMode = false }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState<Map<string, string>>(new Map());

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

  // Restore selected option when navigating in review mode
  useState(() => {
    if (reviewMode && reviewAnswers.has(currentQuestion.id)) {
      setSelectedOption(reviewAnswers.get(currentQuestion.id) || '');
    }
  });

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
    // Save answer in review mode for navigation
    if (reviewMode) {
      setReviewAnswers(prev => new Map(prev).set(currentQuestion.id, value));
    }
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

  const handleNext = () => {
    if (!reviewMode && selectedOption === '') return;

    if (!reviewMode) {
      const newAnswer: QuizAnswer = {
        questionId: currentQuestion.id,
        selectedOption: parseInt(selectedOption)
      };

      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      if (isLastQuestion) {
        const score = updatedAnswers.reduce((acc, answer) => {
          const question = quizData.questions.find(q => q.id === answer.questionId);
          return question && question.correctAnswer === answer.selectedOption ? acc + 1 : acc;
        }, 0);

        const domainScores = calculateDomainScores(updatedAnswers);
        
        // Calculate weighted score (out of 1000) based on domain performance
        // This assumes the quiz follows official domain weightings
        const weightedScore = Math.round((score / quizData.questions.length) * 1000);

        const quizResult: QuizResult = {
          score,
          totalQuestions: quizData.questions.length,
          answers: updatedAnswers,
          passed: score >= Math.ceil(quizData.questions.length * 0.7), // 70% pass rate
          domainScores,
          weightedScore
        };

        setResult(quizResult);
        setIsComplete(true);
        onComplete?.(quizResult);
        return;
      }
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
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      // Restore answer in review mode, clear in quiz mode
      if (reviewMode) {
        const nextQuestionId = quizData.questions[nextIndex].id;
        setSelectedOption(reviewAnswers.get(nextQuestionId) || '');
      } else {
        setSelectedOption('');
      }
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      
      // Restore answer in review mode, clear in quiz mode
      if (reviewMode) {
        const prevQuestionId = quizData.questions[prevIndex].id;
        setSelectedOption(reviewAnswers.get(prevQuestionId) || '');
      } else {
        setSelectedOption('');
      }
      setShowHint(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedOption('');
    setIsComplete(false);
    setResult(null);
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
                <div className="text-4xl font-bold text-blue-600">✓</div>
                <div className="text-lg">
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
                            className="bg-blue-500 h-2 rounded-full"
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
                                <div className="space-y-2">
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
                                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                          ) : (
                                            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
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
        </CardContent>
        <CardFooter className="justify-center gap-2">
          <Button onClick={handleRestart}>
            {reviewMode ? 'Review Again' : 'Take Quiz Again'}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="space-y-3">
            {/* Top row: Review Mode badge, counter, and Show Answer button */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {reviewMode && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
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
                      variant={showHint ? "default" : "outline"}
                      size="sm"
                      className="h-8"
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
            {/* Second row: Title spanning full width */}
            <CardTitle className="text-xl">{quizData.title}</CardTitle>
          </div>
          {quizData.description && (
            <CardDescription>{quizData.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium">
                {currentQuestion.question}
              </h3>
            </div>

            <RadioGroup
              value={selectedOption}
              onValueChange={handleOptionSelect}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={index.toString()}
                    id={`option-${index}`}
                    className={
                      reviewMode && showHint
                        ? index === currentQuestion.correctAnswer
                          ? "border-green-500 text-green-500"
                          : "border-red-300"
                        : ""
                    }
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className={`text-sm font-normal cursor-pointer flex-1 ${
                      reviewMode && showHint
                        ? index === currentQuestion.correctAnswer
                          ? "text-green-700 font-medium"
                          : "text-gray-500"
                        : ""
                    }`}
                  >
                    {option}
                    {reviewMode && showHint && index === currentQuestion.correctAnswer && (
                      <span className="ml-2 text-green-600">✓ Correct</span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Answer explanation */}
            {reviewMode && showHint && currentQuestion.explanation && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Explanation:</h4>
                <p className="text-sm text-blue-800">{currentQuestion.explanation}</p>
                {currentQuestion.metadata?.sourceUrl && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <a
                      href={currentQuestion.metadata.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-900 underline"
                    >
                      <ExternalLink className="h-3 w-3" />
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
            {reviewMode && currentQuestionIndex > 0 && (
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
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
              />
            </div>
          </div>

          <Button
            onClick={handleNext}
            disabled={!reviewMode && selectedOption === ''}
          >
            {currentQuestionIndex === quizData.questions.length - 1
              ? reviewMode ? 'Finish Review' : 'Finish'
              : 'Next'
            }
          </Button>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}