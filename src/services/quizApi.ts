import { QuizData, QuizQuestion } from '@/types/quiz';

export interface QuizOptions {
  topics?: Array<{ id: string; name: string; questionCount: number }>;
  sections?: Array<{
    id: string;
    name: string;
    questionCount: number;
    topics?: Array<{ id: string; name: string; questionCount: number }>;
  }>;
  questionTypes?: string[];
  difficultyLevels?: Array<{ value: number | string; label: string; description: string }>;
  maxQuestions?: number;
}

export interface QuizGenerationRequest {
  topicIds?: string[];
  sectionIds?: string[];
  difficultyLevel?: number | 'mixed';
  questionCount?: number;
  questionTypes?: string[];
}

export interface QuizGenerationResponse {
  quizId?: string;
  questions: Array<{
    id: string;
    questionNumber: number;
    content: string;
    questionType: string;
    difficultyLevel: number;
    explanation?: string;
    sourceUrl?: string;
    correctAnswer: number; // Add the correctAnswer field that the API actually returns
    answers: Array<{
      id: string;
      content: string;
      isCorrect?: boolean;
    }>;
    options: string[]; // Add options field that the API returns
    answerIds: string[]; // Add answerIds field that the API returns
    topics?: Array<{
      id: string;
      name: string;
      sections?: Array<{
        id: string;
        name: string;
      }>;
    }>;
  }>;
  metadata: {
    totalQuestions: number;
    requestedCount: number;
    availableQuestions: number;
    generatedAt: string;
    topicBreakdown?: Record<string, number>;
    sectionBreakdown?: Record<string, number>;
    difficultyBreakdown?: Record<number, number>;
  };
}

class QuizApiService {
  private baseUrl = '/api/quiz';

  async getQuizOptions(certificationSlug?: string): Promise<QuizOptions> {
    try {
      const url = certificationSlug
        ? `${this.baseUrl}/generate?certification=${certificationSlug}`
        : `${this.baseUrl}/generate`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz options: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz options:', error);
      throw error;
    }
  }

  async generateQuiz(options: QuizGenerationRequest): Promise<QuizData> {
    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate quiz: ${response.statusText}`);
      }

      const data: QuizGenerationResponse = await response.json();

      // Transform the response to match the QuizData format
      const questions: QuizQuestion[] = data.questions.map((q) => {
        // Use the correctAnswer field provided by the API
        const correctAnswerIndex = q.correctAnswer >= 0 ? q.correctAnswer : 0;

        return {
          id: q.id,
          question: q.content,
          options: q.answers.map(a => a.content),
          correctAnswer: correctAnswerIndex, // Use the correct answer provided by the API
          explanation: q.explanation || '', // Use explanation from database
          difficulty: this.mapDifficultyLevel(q.difficultyLevel),
          metadata: {
            domain: q.topics?.[0]?.sections?.[0]?.id || '',
            domainName: q.topics?.[0]?.sections?.[0]?.name || '',
            topic: q.topics?.[0]?.name || '',
            difficulty: this.mapDifficultyLevel(q.difficultyLevel),
            sourceUrl: q.sourceUrl || '',
            tags: []
          },
          // Store answer IDs for submission
          answerIds: q.answers.map(a => a.id)
        };
      });

      return {
        title: this.generateQuizTitle(options, data.metadata),
        questions,
        metadata: data.metadata
      };
    } catch (error) {
      console.error('Error generating quiz:', error);
      throw error;
    }
  }

  private mapDifficultyLevel(level: number): 'beginner' | 'intermediate' | 'advanced' {
    if (level <= 2) return 'beginner';
    if (level <= 4) return 'intermediate';
    return 'advanced';
  }

  private generateQuizTitle(options: QuizGenerationRequest, metadata: any): string {
    const questionCount = metadata.totalQuestions;

    if (options.sectionIds && options.sectionIds.length > 0) {
      const sectionNames = Object.keys(metadata.sectionBreakdown || {});
      if (sectionNames.length === 1) {
        return `${sectionNames[0]} - ${questionCount} Questions`;
      }
      return `Mixed Sections - ${questionCount} Questions`;
    }

    if (options.topicIds && options.topicIds.length > 0) {
      const topicNames = Object.keys(metadata.topicBreakdown || {});
      if (topicNames.length === 1) {
        return `${topicNames[0]} - ${questionCount} Questions`;
      }
      return `Mixed Topics - ${questionCount} Questions`;
    }

    if (options.difficultyLevel && options.difficultyLevel !== 'mixed') {
      const difficultyMap: Record<number, string> = {
        1: 'Beginner',
        2: 'Beginner',
        3: 'Intermediate',
        4: 'Intermediate',
        5: 'Advanced'
      };
      return `${difficultyMap[options.difficultyLevel as number]} Level - ${questionCount} Questions`;
    }

    return `Quick Review - ${questionCount} Questions`;
  }
}

export const quizApi = new QuizApiService();