import { QuizData, QuizQuestion } from '@/types/quiz';
import {
  TABLEAU_CONSULTANT_COMPOSITION,
  TestComposition,
  TestDomain,
  getQuestionDistribution,
  getQuestionBanksForDomain
} from '@/config/testComposition';
export interface QuestionBank {
  topic: string;
  domain: string;
  questions: QuizQuestion[];
  metadata: {
    difficulty: string;
    sourceUrl: string;
    generatedDate: string;
  };
}

export interface SamplingOptions {
  totalQuestions: number;
  compositionType: 'full_practice' | 'domain_focus' | 'quick_review' | 'custom';
  selectedDomains?: string[]; // For domain_focus and custom
  difficultyBalance?: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  excludeTopics?: string[];
  seed?: number; // For reproducible sampling
}

export class QuizSampler {
  private questionBanks: Map<string, QuestionBank> = new Map();
  private loaded = false;
  private sampledQuestionIds: Set<string> = new Set(); // Track sampled questions to avoid duplicates

  async loadQuestionBanks(): Promise<void> {
    try {
      const questionBankFiles = new Set<string>();
      
      for (const domain of TABLEAU_CONSULTANT_COMPOSITION.domains) {
        domain.questionBanks.forEach(filename => questionBankFiles.add(filename));
      }

      console.log(`Loading ${questionBankFiles.size} question banks from test composition`);

      for (const fileName of questionBankFiles) {
        try {
          const bankData = await this.loadQuestionBank(fileName);
          if (bankData) {
            const questionsWithMetadata = (bankData.questions || []).map((question: any) => ({
              ...question,
              metadata: {
                ...question.metadata,
                sourceUrl: bankData.metadata?.sourceUrl || '',
                difficulty: question.difficulty || bankData.metadata?.difficulty || 'intermediate',
                tags: question.tags || []
              }
            }));

            const questionBank: QuestionBank = {
              topic: bankData.title || fileName,
              domain: bankData.metadata?.domain || '',
              questions: questionsWithMetadata,
              metadata: bankData.metadata || {
                difficulty: 'intermediate',
                sourceUrl: '',
                generatedDate: new Date().toISOString()
              }
            };

            this.questionBanks.set(fileName, questionBank);
          }
        } catch (error) {
          console.warn(`Failed to load question bank "${fileName}":`, error);
        }
      }

      this.loaded = true;
      console.log(`Successfully loaded ${this.questionBanks.size} of ${questionBankFiles.size} question banks`);
    } catch (error) {
      console.error('Failed to load question banks:', error);
      this.loaded = true;
    }
  }

  private async loadQuestionBank(fileName: string): Promise<any> {
    try {
      // Fetch the question bank file from the public assets
      const response = await fetch(`/question-banks/${fileName}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${fileName}.json`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Could not load question bank ${fileName}:`, error);
      return null;
    }
  }



  async generateQuiz(options: SamplingOptions): Promise<QuizData> {
    if (!this.loaded) {
      throw new Error('Question banks not loaded. Call loadQuestionBanks() first.');
    }

    // Reset sampled questions tracker for each new quiz generation
    this.sampledQuestionIds.clear();

    const questions = await this.sampleQuestions(options);

    if (questions.length === 0) {
      throw new Error('No questions available for the selected configuration. Please generate more question banks or adjust your selection.');
    }

    return {
      title: this.generateQuizTitle(options),
      description: this.generateQuizDescription(options, questions.length),
      questions: this.shuffleArray(questions)
    };
  }

  private async sampleQuestions(options: SamplingOptions): Promise<QuizQuestion[]> {
    const sampledQuestions: QuizQuestion[] = [];

    switch (options.compositionType) {
      case 'full_practice':
        return this.sampleFullPracticeExam(options);

      case 'domain_focus':
        return this.sampleDomainFocus(options);

      case 'quick_review':
        return this.sampleQuickReview(options);

      case 'custom':
        return this.sampleCustom(options);

      default:
        throw new Error(`Unsupported composition type: ${options.compositionType}`);
    }
  }

  private sampleFullPracticeExam(options: SamplingOptions): QuizQuestion[] {
    const distribution = getQuestionDistribution(
      TABLEAU_CONSULTANT_COMPOSITION,
      options.totalQuestions
    );

    const sampledQuestions: QuizQuestion[] = [];

    for (const domain of TABLEAU_CONSULTANT_COMPOSITION.domains) {
      const questionsNeeded = distribution[domain.id];
      const domainQuestions = this.getQuestionsForDomain(domain.id, questionsNeeded);
      sampledQuestions.push(...domainQuestions);
    }

    // If we don't have enough questions, sample from available questions
    if (sampledQuestions.length < options.totalQuestions) {
      const allAvailableQuestions = this.getAllAvailableQuestions();
      const additionalNeeded = Math.min(
        options.totalQuestions - sampledQuestions.length,
        allAvailableQuestions.length - sampledQuestions.length
      );

      // Add additional questions from any available source
      const shuffledAll = this.shuffleArray(allAvailableQuestions);
      const additionalQuestions = shuffledAll
        .filter(q => !sampledQuestions.some(sq => sq.id === q.id))
        .slice(0, additionalNeeded);

      sampledQuestions.push(...additionalQuestions);
    }

    return sampledQuestions;
  }

  private sampleDomainFocus(options: SamplingOptions): QuizQuestion[] {
    if (!options.selectedDomains || options.selectedDomains.length === 0) {
      throw new Error('selectedDomains is required for domain_focus composition');
    }

    const questionsPerDomain = Math.floor(options.totalQuestions / options.selectedDomains.length);
    const sampledQuestions: QuizQuestion[] = [];

    for (const domainId of options.selectedDomains) {
      const domainQuestions = this.getQuestionsForDomain(domainId, questionsPerDomain);
      sampledQuestions.push(...domainQuestions);
    }

    // Fill remaining slots with questions from any selected domain
    const remaining = options.totalQuestions - sampledQuestions.length;
    if (remaining > 0) {
      const extraQuestions = this.getQuestionsForDomain(
        options.selectedDomains[0],
        remaining
      );
      sampledQuestions.push(...extraQuestions);
    }

    return sampledQuestions;
  }

  private sampleQuickReview(options: SamplingOptions): QuizQuestion[] {
    // Balanced sampling across all domains
    const domainCount = TABLEAU_CONSULTANT_COMPOSITION.domains.length;
    const questionsPerDomain = Math.floor(options.totalQuestions / domainCount);
    const sampledQuestions: QuizQuestion[] = [];

    for (const domain of TABLEAU_CONSULTANT_COMPOSITION.domains) {
      const domainQuestions = this.getQuestionsForDomain(domain.id, questionsPerDomain);
      sampledQuestions.push(...domainQuestions);
    }

    return sampledQuestions.slice(0, options.totalQuestions);
  }

  private sampleCustom(options: SamplingOptions): QuizQuestion[] {
    // Implementation for custom sampling based on user preferences
    return this.sampleDomainFocus(options);
  }

  private getQuestionsForDomain(domainId: string, count: number): QuizQuestion[] {
    const domain = TABLEAU_CONSULTANT_COMPOSITION.domains.find(d => d.id === domainId);
    if (!domain) return [];

    const allDomainQuestions: QuizQuestion[] = [];

    // Collect all questions from this domain's question banks
    for (const bankFileName of domain.questionBanks) {
      const questionBank = this.questionBanks.get(bankFileName);

      if (questionBank && questionBank.questions) {
        // Only add questions that haven't been sampled yet
        const uniqueQuestions = questionBank.questions.filter(
          q => !this.sampledQuestionIds.has(q.id)
        ).map(q => ({
          ...q,
          metadata: {
            ...q.metadata,
            domain: domainId,
            domainName: domain.name
          }
        }));
        allDomainQuestions.push(...uniqueQuestions);
      }
    }

    // Shuffle and sample the requested number of questions
    const shuffled = this.shuffleArray(allDomainQuestions);
    const sampled = shuffled.slice(0, Math.min(count, shuffled.length));
    
    // Track the sampled questions to avoid duplicates
    sampled.forEach(q => this.sampledQuestionIds.add(q.id));
    
    return sampled;
  }

  private normalizeTopicName(topic: string): string {
    return topic.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateQuizTitle(options: SamplingOptions): string {
    switch (options.compositionType) {
      case 'full_practice':
        return 'Tableau Consultant - Full Practice Exam';
      case 'domain_focus':
        const domainNames = options.selectedDomains?.map(id =>
          TABLEAU_CONSULTANT_COMPOSITION.domains.find(d => d.id === id)?.name
        ).join(', ');
        return `Tableau Consultant - ${domainNames} Focus`;
      case 'quick_review':
        return 'Tableau Consultant - Quick Review';
      case 'custom':
        return 'Tableau Consultant - Custom Practice';
      default:
        return 'Tableau Consultant Practice Quiz';
    }
  }

  private generateQuizDescription(options: SamplingOptions, actualQuestions: number): string {
    const questionText = actualQuestions === options.totalQuestions
      ? `${actualQuestions} questions`
      : `${actualQuestions} questions (limited by available question banks)`;

    const baseDescription = `${questionText} covering `;

    switch (options.compositionType) {
      case 'full_practice':
        return baseDescription + 'all exam domains with proper weightings';
      case 'domain_focus':
        return baseDescription + 'selected domains for focused practice';
      case 'quick_review':
        return baseDescription + 'key concepts from all domains';
      case 'custom':
        return baseDescription + 'custom selection of topics';
      default:
        return baseDescription + 'Tableau consultant-level concepts';
    }
  }

  private getAllAvailableQuestions(): QuizQuestion[] {
    const allQuestions: QuizQuestion[] = [];
    for (const bank of this.questionBanks.values()) {
      allQuestions.push(...bank.questions);
    }
    return allQuestions;
  }

  // Utility methods
  getAvailableTopics(): string[] {
    return Array.from(this.questionBanks.keys());
  }

  getQuestionBankStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [topic, bank] of this.questionBanks) {
      stats[topic] = {
        questionCount: bank.questions.length,
        domain: bank.domain,
        difficulty: bank.metadata.difficulty
      };
    }

    return stats;
  }

  getDomainCoverage(): Record<string, any> {
    const coverage: Record<string, any> = {};

    for (const domain of TABLEAU_CONSULTANT_COMPOSITION.domains) {
      let questionsCount = 0;
      let topicsLoaded = 0;
      const topicsTotal = domain.questionBanks.length;
      const topicDetails: Record<string, number> = {};

      // Count questions from all question banks for this domain
      for (const bankFileName of domain.questionBanks) {
        const bank = this.questionBanks.get(bankFileName);
        
        if (bank && bank.questions) {
          questionsCount += bank.questions.length;
          topicsLoaded++;
          topicDetails[bank.topic || bankFileName] = bank.questions.length;
        }
      }

      coverage[domain.name] = {
        totalQuestions: questionsCount,
        topicsLoaded: topicsLoaded,
        topicsTotal: topicsTotal,
        coveragePercentage: Math.round((topicsLoaded / topicsTotal) * 100),
        requiredQuestions: domain.questionCount,
        topicDetails: topicDetails
      };
    }

    return coverage;
  }

  async validateQuestionBanks(): Promise<string[]> {
    const issues: string[] = [];

    // Check that all required question banks are loaded
    const requiredBanks = new Set<string>();
    for (const domain of TABLEAU_CONSULTANT_COMPOSITION.domains) {
      domain.questionBanks.forEach(filename => requiredBanks.add(filename));
    }

    // Check for missing question banks
    for (const bankFileName of requiredBanks) {
      if (!this.questionBanks.has(bankFileName)) {
        issues.push(`Missing question bank file: "${bankFileName}.json"`);
      }
    }

    // Validate loaded question banks
    for (const [filename, bank] of this.questionBanks) {
      if (bank.questions.length === 0) {
        issues.push(`Question bank "${filename}" has no questions`);
      }

      // Validate question structure
      for (const question of bank.questions) {
        if (!question.question || !question.options || question.options.length < 4) {
          issues.push(`Question bank "${filename}" has malformed questions`);
          break;
        }
      }
    }

    return issues;
  }

  getRequiredVsLoadedTopics(): { required: string[]; loaded: string[]; missing: string[] } {
    const requiredBanks = new Set<string>();
    
    // Collect all required question bank files from test composition
    for (const domain of TABLEAU_CONSULTANT_COMPOSITION.domains) {
      domain.questionBanks.forEach(filename => requiredBanks.add(filename));
    }

    const requiredArray = Array.from(requiredBanks).sort();
    const loadedArray = Array.from(this.questionBanks.keys()).sort();
    const missing = requiredArray.filter(filename => 
      !this.questionBanks.has(filename)
    );

    return { required: requiredArray, loaded: loadedArray, missing };
  }

  // Quick Review Features

  /**
   * Get list of all domains with their metadata
   */
  getDomains(): Array<{ id: string; name: string; description: string }> {
    return TABLEAU_CONSULTANT_COMPOSITION.domains.map(domain => ({
      id: domain.id,
      name: domain.name,
      description: domain.description
    }));
  }

  /**
   * Get list of all topics (question banks) for a specific domain
   */
  getTopicsForDomain(domainId: string): string[] {
    const domain = TABLEAU_CONSULTANT_COMPOSITION.domains.find(d => d.id === domainId);
    if (!domain) {
      return [];
    }
    return domain.questionBanks;
  }

  /**
   * Get random questions from any loaded question bank
   * @param count Number of questions to return
   * @returns Array of random questions
   */
  async getRandomQuestions(count: number): Promise<QuizQuestion[]> {
    if (!this.loaded) {
      await this.loadQuestionBanks();
    }

    // Collect all available questions with domain metadata
    const allQuestions: QuizQuestion[] = [];
    
    // Map each question bank to its domain
    for (const domain of TABLEAU_CONSULTANT_COMPOSITION.domains) {
      for (const bankFileName of domain.questionBanks) {
        const bank = this.questionBanks.get(bankFileName);
        if (bank) {
          const questionsWithMetadata = bank.questions.map(q => ({
            ...q,
            metadata: {
              ...q.metadata,
              domain: domain.id,
              domainName: domain.name
            }
          }));
          allQuestions.push(...questionsWithMetadata);
        }
      }
    }

    if (allQuestions.length === 0) {
      throw new Error('No questions available');
    }

    // Shuffle and return requested count
    const shuffled = this.shuffleArray([...allQuestions]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get questions filtered by domain and optionally by specific topic
   * @param domainId The domain to filter by (e.g., 'domain1')
   * @param topicName Optional specific topic/question bank name
   * @param count Number of questions to return
   * @returns Array of questions matching the criteria
   */
  async getQuestionsByDomainAndTopic(
    domainId: string,
    topicName?: string,
    count: number = 10
  ): Promise<QuizQuestion[]> {
    if (!this.loaded) {
      await this.loadQuestionBanks();
    }

    const domain = TABLEAU_CONSULTANT_COMPOSITION.domains.find(d => d.id === domainId);
    if (!domain) {
      throw new Error(`Domain not found: ${domainId}`);
    }

    let questions: QuizQuestion[] = [];

    if (topicName) {
      // Get questions from specific topic
      const bank = this.questionBanks.get(topicName);
      if (!bank) {
        throw new Error(`Topic not found: ${topicName}`);
      }
      questions = bank.questions.map(q => ({
        ...q,
        metadata: {
          ...q.metadata,
          domain: domain.id,
          domainName: domain.name
        }
      }));
    } else {
      // Get questions from all topics in the domain
      for (const bankFileName of domain.questionBanks) {
        const bank = this.questionBanks.get(bankFileName);
        if (bank) {
          const questionsWithMetadata = bank.questions.map(q => ({
            ...q,
            metadata: {
              ...q.metadata,
              domain: domain.id,
              domainName: domain.name
            }
          }));
          questions.push(...questionsWithMetadata);
        }
      }
    }

    if (questions.length === 0) {
      throw new Error('No questions found for the specified criteria');
    }

    // Shuffle and return requested count
    const shuffled = this.shuffleArray(questions);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Get the total available question count for a domain and optional topic
   * @param domainId The domain to check
   * @param topicName Optional specific topic/question bank name
   * @returns Number of available questions
   */
  getAvailableQuestionCount(domainId: string, topicName?: string): number {
    if (!this.loaded) {
      return 0;
    }

    const domain = TABLEAU_CONSULTANT_COMPOSITION.domains.find(d => d.id === domainId);
    if (!domain) {
      return 0;
    }

    let count = 0;

    if (topicName) {
      const bank = this.questionBanks.get(topicName);
      if (bank) {
        count = bank.questions.length;
      }
    } else {
      for (const bankFileName of domain.questionBanks) {
        const bank = this.questionBanks.get(bankFileName);
        if (bank) {
          count += bank.questions.length;
        }
      }
    }

    return count;
  }

  /**
   * Get total available questions across all banks
   * @returns Total number of questions
   */
  getTotalAvailableQuestions(): number {
    if (!this.loaded) {
      return 0;
    }

    let total = 0;
    for (const bank of this.questionBanks.values()) {
      total += bank.questions.length;
    }
    return total;
  }

}
