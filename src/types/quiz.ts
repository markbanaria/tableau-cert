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
  };
}

export interface QuizData {
  title: string;
  description?: string;
  questions: QuizQuestion[];
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
}