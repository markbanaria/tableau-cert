'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuizData, QuizAnswer, QuizResult } from '@/types/quiz';
import { HelpCircle, ExternalLink } from 'lucide-react';

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

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quizData.questions.length - 1;

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
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

        const quizResult: QuizResult = {
          score,
          totalQuestions: quizData.questions.length,
          answers: updatedAnswers,
          passed: score >= Math.ceil(quizData.questions.length * 0.7) // 70% pass rate
        };

        setResult(quizResult);
        setIsComplete(true);
        onComplete?.(quizResult);
        return;
      }
    }

    // Move to next question (both quiz and review mode)
    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption('');
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedOption('');
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <CardDescription>{quizData.title}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold">
            {result.score}/{result.totalQuestions}
          </div>
          <div className="text-lg">
            Score: {Math.round((result.score / result.totalQuestions) * 100)}%
          </div>
          <div className={`text-lg font-semibold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
            {result.passed ? '✅ Passed!' : '❌ Failed'}
          </div>
          <p className="text-sm text-muted-foreground">
            {result.passed
              ? 'Congratulations! You passed the quiz.'
              : 'You need 70% to pass. Try again!'}
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={handleRestart}>
            Take Quiz Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <CardTitle className="text-xl flex-1 min-w-0">{quizData.title}</CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              {reviewMode && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded whitespace-nowrap">
                  Review Mode
                </span>
              )}
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {currentQuestionIndex + 1} of {quizData.questions.length}
              </span>
            </div>
          </div>
          {quizData.description && (
            <CardDescription>{quizData.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-start gap-2 mb-4">
              <h3 className="text-lg font-medium flex-1">
                {currentQuestion.question}
              </h3>
              <div className="flex gap-2">
                {/* Hint Button */}
                {reviewMode && currentQuestion.explanation && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setShowHint(!showHint)}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Show answer and explanation</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
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