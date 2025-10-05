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

export interface QuizResult {
  score: number;
  totalQuestions: number;
  answers: QuizAnswer[];
  passed: boolean;
}