'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getQuizSampler } from '@/services/quizSampler';
import { LoadingState } from '@/components/QuestionBankLoader';
import MainLayout from '@/components/layout/main-layout';

export default function Home() {
  const [samplerReady, setSamplerReady] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [domainCoverage, setDomainCoverage] = useState<Record<string, any>>({});
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

  useEffect(() => {
    initializeSampler();
  }, []);

  const initializeSampler = async () => {
    try {
      const quizSampler = getQuizSampler();
      
      // Load with progress callback
      await quizSampler.loadQuestionBanks((loaded, total, message) => {
        setLoadingMessage(message);
      });
      
      const stats = quizSampler.getQuestionBankStats();
      const coverage = quizSampler.getDomainCoverage();
      const totalQuestions = Object.values(stats).reduce((sum, stat) => sum + stat.questionCount, 0);
      setAvailableQuestions(totalQuestions);
      setDomainCoverage(coverage);
      setSamplerReady(true);
    } catch (error) {
      console.error('Failed to load question banks:', error);
      setSamplerReady(true);
    }
  };

  if (!samplerReady) {
    return (
      <MainLayout>
        <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/tableau-logo.png" 
                alt="Tableau Logo" 
                className="h-8 w-auto mb-4"
              />
            </div>
            <h1 className="text-3xl font-bold mb-2">Tableau Certification Hub</h1>
          </div>
          <LoadingState message={loadingMessage} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-6 pb-8 pt-8 md:pt-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tableau Certification Hub</h1>
          <p className="text-muted-foreground">
            Practice and prepare for your Tableau certification
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-medium">{availableQuestions}</span> questions available
          </p>
        </div>

        {/* Mobile Quick Action Buttons - Hidden on Desktop */}
        <div className="grid grid-cols-2 gap-3 mb-6 md:hidden">
          <Link href="/quiz" className="w-full">
            <Button className="w-full" size="lg">
              Mock Exam
            </Button>
          </Link>
          <Link href="/review" className="w-full">
            <Button className="w-full bg-review hover:bg-review/90 text-white" size="lg">
              Quick Review
            </Button>
          </Link>
        </div>

        {/* Question Bank Coverage */}
        {samplerReady && Object.keys(domainCoverage).length > 0 && (() => {
          // Calculate total aggregated coverage
          const totalCoverage = Object.values(domainCoverage).reduce((sum, data: any) => sum + data.coveragePercentage, 0);
          const avgCoverage = Math.round(totalCoverage / Object.keys(domainCoverage).length);
          
          return (
            <Card className="mb-8">
              <Accordion type="single" collapsible>
                <AccordionItem value="coverage" className="border-none">
                  <div className="px-6">
                    <AccordionTrigger className="p-0 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex flex-col items-start text-left">
                          <CardTitle className="text-lg">Question Bank Coverage</CardTitle>
                          <CardDescription className="mt-1">
                            Available questions by domain (including subtopics)
                          </CardDescription>
                        </div>
                        <span className={`text-sm font-semibold px-3 py-1 rounded whitespace-nowrap ml-4 ${
                          avgCoverage >= 80 ? 'bg-green-100 text-green-800' :
                          avgCoverage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {avgCoverage}% total
                        </span>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className="px-6 pb-6 pt-2">
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(domainCoverage).map(([domainName, data]: [string, any]) => (
                        <div key={domainName} className="border rounded-lg p-4">
                          <div className="mb-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              data.coveragePercentage >= 80 ? 'bg-green-100 text-green-800' :
                              data.coveragePercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {data.coveragePercentage}% coverage
                            </span>
                          </div>
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-medium text-sm">{domainName}</h4>
                          </div>
                          <div className="text-sm space-y-1 text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Questions:</span>
                              <span className="font-medium text-foreground">
                                {data.totalQuestions} / {data.requiredQuestions} needed
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Topics:</span>
                              <span className="font-medium text-foreground">
                                {data.topicsLoaded} / {data.topicsTotal} loaded
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          );
        })()}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mock Exam</CardTitle>
              <CardDescription>
                Full practice exams with official domain weightings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/quiz">
                <Button className="w-full">
                  Start Mock Exam
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Review</CardTitle>
              <CardDescription>
                Random sampling or targeted review by domain and topic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/review">
                <Button className="w-full bg-review hover:bg-review/90 text-white">
                  Quick Review
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}