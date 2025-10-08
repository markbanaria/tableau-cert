export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  metadata?: {
    sourceUrl?: string;
    difficulty?: string;
    tags?: string[];
    domain?: string;
    domainName?: string;
    topic?: string;
  };
  answerIds?: string[]; // For database-backed questions
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface QuizData {
  title: string;
  description?: string;
  questions: QuizQuestion[];
  metadata?: any; // Additional metadata from the API
  sessionId?: string; // For database quiz session tracking
}

export interface QuizAnswer {
  questionId: string;
  selectedOption: number;
}

export interface DomainScore {
  domainId: string;
  domainName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  weight?: number; // Optional weight percentage for the domain
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  answers: QuizAnswer[];
  passed: boolean;
  domainScores?: DomainScore[]; // Optional domain breakdown
  weightedScore?: number; // Optional weighted score (e.g., out of 1000)
  timeTaken?: number; // Time taken in seconds
  responses?: Array<{
    questionId: string;
    answerId?: string;
    userAnswer?: string;
    isCorrect: boolean;
  }>; // For database session tracking
}