'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizSampler } from '@/services/quizSampler';

export default function Home() {
  const [quizSampler] = useState(() => new QuizSampler());
  const [samplerReady, setSamplerReady] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState(0);
  const [domainCoverage, setDomainCoverage] = useState<Record<string, any>>({});

  useEffect(() => {
    initializeSampler();
  }, []);

  const initializeSampler = async () => {
    try {
      await quizSampler.loadQuestionBanks();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tableau Certification Hub</h1>
        <p className="text-muted-foreground">
          Practice and prepare for your Tableau certification
        </p>
        {samplerReady && (
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-medium">{availableQuestions}</span> questions available
          </p>
        )}
      </div>

      {/* Question Bank Coverage */}
      {samplerReady && Object.keys(domainCoverage).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Question Bank Coverage</CardTitle>
            <CardDescription>
              Available questions by domain (including subtopics)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(domainCoverage).map(([domainName, data]: [string, any]) => (
                <div key={domainName} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{domainName}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${
                      data.coveragePercentage >= 80 ? 'bg-green-100 text-green-800' :
                      data.coveragePercentage >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {data.coveragePercentage}% coverage
                    </span>
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
          </CardContent>
        </Card>
      )}

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
              <Button className="w-full" variant="outline">
                Quick Review
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
