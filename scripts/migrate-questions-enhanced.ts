#!/usr/bin/env tsx

import { PrismaClient } from '@/generated/prisma'
import fs from 'fs'
import path from 'path'
import csv from 'csv-parser'

const prisma = new PrismaClient()

interface QuestionBank {
  title: string
  description: string
  metadata: {
    topic?: string
    title?: string
    domain?: string
    difficulty: string
    sourceUrl?: string
    generatedDate: string
    questionCount: number
  }
  questions: Array<{
    id: string
    question: string
    options: string[]
    correctAnswer: number | string
    explanation: string
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    tags: string[]
  }>
}

interface TopicMetadata {
  section: string
  topic: string
  parentTopic: string
  assignedUrl: string
  domain: string
  relatedTopics: string
  questionCount: number
  topicType: 'parent' | 'subtopic'
}

interface MigrationStats {
  totalQuestionBanks: number
  totalQuestions: number
  totalAnswers: number
  totalTopics: number
  totalSections: number
  errors: string[]
  processedFiles: string[]
}

class EnhancedQuestionMigrator {
  private stats: MigrationStats = {
    totalQuestionBanks: 0,
    totalQuestions: 0,
    totalAnswers: 0,
    totalTopics: 0,
    totalSections: 0,
    errors: [],
    processedFiles: []
  }

  private topicMetadataMap = new Map<string, TopicMetadata>()

  private difficultyMap: { [key: string]: number } = {
    'BEGINNER': 1,
    'INTERMEDIATE': 3,
    'ADVANCED': 5
  }

  async migrateAllQuestionBanks(): Promise<void> {
    console.log('🚀 Starting enhanced question bank migration...')

    try {
      // Load CSV metadata first
      await this.loadTopicMetadata()

      // Clear existing data
      await this.clearExistingData()

      // Load and process all question banks
      const questionBanksPath = path.join(process.cwd(), 'public', 'question-banks')
      const files = fs.readdirSync(questionBanksPath).filter(file => file.endsWith('.json'))

      console.log(`📁 Found ${files.length} question bank files`)

      for (const file of files) {
        try {
          await this.processQuestionBank(path.join(questionBanksPath, file))
          this.stats.processedFiles.push(file)
        } catch (error) {
          const errorMsg = `Error processing ${file}: ${error instanceof Error ? error.message : String(error)}`
          console.error(`❌ ${errorMsg}`)
          this.stats.errors.push(errorMsg)
        }
      }

      // Print migration summary
      this.printMigrationSummary()

    } catch (error) {
      console.error('💥 Migration failed:', error)
      throw error
    } finally {
      await prisma.$disconnect()
    }
  }

  private async loadTopicMetadata(): Promise<void> {
    console.log('📊 Loading topic metadata from CSV...')

    const csvPath = path.join(process.cwd(), '..', 'docs', 'Mapped_Catalog_Topics_to_URLs.csv')

    return new Promise((resolve, reject) => {
      const results: TopicMetadata[] = []

      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
          results.push({
            section: data.Section,
            topic: data.Topic,
            parentTopic: data.Parent_Topic || '',
            assignedUrl: data.Assigned_URL,
            domain: data.Domain,
            relatedTopics: data.Related_Topics || '',
            questionCount: parseInt(data.Question_Count) || 0,
            topicType: data.Topic_Type as 'parent' | 'subtopic'
          })
        })
        .on('end', () => {
          // Create map for quick lookups
          results.forEach(metadata => {
            this.topicMetadataMap.set(metadata.topic, metadata)
          })

          console.log(`✅ Loaded ${results.length} topic metadata entries`)
          resolve()
        })
        .on('error', reject)
    })
  }

  private async clearExistingData(): Promise<void> {
    console.log('🧹 Clearing existing question data...')

    // Delete in proper order to respect foreign key constraints
    await prisma.quizResponse.deleteMany()
    await prisma.quiz.deleteMany()
    await prisma.testSection.deleteMany()
    await prisma.certificationTest.deleteMany()
    await prisma.test.deleteMany()
    await prisma.certification.deleteMany()
    await prisma.topicQuestion.deleteMany()
    await prisma.sectionTopic.deleteMany()
    await prisma.answer.deleteMany()
    await prisma.question.deleteMany()
    await prisma.topic.deleteMany()
    await prisma.section.deleteMany()

    console.log('✅ Existing data cleared')
  }

  private async processQuestionBank(filePath: string): Promise<void> {
    console.log(`📖 Processing: ${path.basename(filePath)}`)

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const questionBank: QuestionBank = JSON.parse(fileContent)

    this.stats.totalQuestionBanks++

    // Extract topic name from various sources
    const topicName = questionBank.metadata?.topic ||
                     questionBank.metadata?.title ||
                     questionBank.title

    // Get metadata from CSV
    const metadata = this.topicMetadataMap.get(topicName)

    if (!metadata) {
      console.warn(`⚠️  No metadata found for topic: ${topicName}`)
    }

    // Create or get topic
    const topic = await this.createOrGetTopic(
      topicName,
      questionBank.description,
      metadata
    )

    // Create or get section
    const sectionName = metadata?.section || questionBank.metadata?.domain || 'Unknown'
    const section = await this.createOrGetSection(
      sectionName,
      `Section: ${sectionName}`,
      metadata?.domain
    )

    // Link topic to section
    await this.linkTopicToSection(topic.id, section.id)

    // Process each question
    for (const questionData of questionBank.questions) {
      try {
        await this.processQuestion(questionData, topic.id, metadata)
        this.stats.totalQuestions++
      } catch (error) {
        const errorMsg = `Error processing question ${questionData.id} in ${path.basename(filePath)}: ${error instanceof Error ? error.message : String(error)}`
        console.error(`❌ ${errorMsg}`)
        this.stats.errors.push(errorMsg)
      }
    }

    console.log(`✅ Processed ${questionBank.questions.length} questions from ${path.basename(filePath)}`)
  }

  private async createOrGetTopic(name: string, description?: string, metadata?: TopicMetadata) {
    let topic = await prisma.topic.findFirst({
      where: { name }
    })

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name,
          description: description || metadata?.assignedUrl || `Topic: ${name}`
        }
      })
      this.stats.totalTopics++
      console.log(`📝 Created topic: ${name} ${metadata ? `(${metadata.domain})` : ''}`)
    }

    return topic
  }

  private async createOrGetSection(name: string, description?: string, domain?: string) {
    let section = await prisma.section.findFirst({
      where: { name }
    })

    if (!section) {
      section = await prisma.section.create({
        data: {
          name,
          description: description || `Section: ${name}`
        }
      })
      this.stats.totalSections++
      console.log(`📂 Created section: ${name} ${domain ? `(${domain})` : ''}`)
    }

    return section
  }

  private async linkTopicToSection(topicId: string, sectionId: string) {
    const existing = await prisma.sectionTopic.findUnique({
      where: {
        sectionId_topicId: {
          sectionId,
          topicId
        }
      }
    })

    if (!existing) {
      await prisma.sectionTopic.create({
        data: {
          sectionId,
          topicId
        }
      })
    }
  }

  private async processQuestion(questionData: any, topicId: string, metadata?: TopicMetadata) {
    // Normalize correctAnswer to number
    let correctAnswerIndex: number
    if (typeof questionData.correctAnswer === 'string') {
      // Handle A, B, C, D format
      const letterMap: { [key: string]: number } = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }
      correctAnswerIndex = letterMap[questionData.correctAnswer.toUpperCase()] ?? 0
    } else {
      correctAnswerIndex = questionData.correctAnswer
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        content: questionData.question,
        questionType: 'multiple_choice',
        difficultyLevel: this.difficultyMap[questionData.difficulty] || 3,
        explanation: questionData.explanation || null
      }
    })

    // Link question to topic
    await prisma.topicQuestion.create({
      data: {
        topicId,
        questionId: question.id
      }
    })

    // Create answers
    for (let i = 0; i < questionData.options.length; i++) {
      await prisma.answer.create({
        data: {
          questionId: question.id,
          content: questionData.options[i],
          isCorrect: i === correctAnswerIndex,
          explanation: i === correctAnswerIndex ? questionData.explanation : null
        }
      })
      this.stats.totalAnswers++
    }
  }

  private printMigrationSummary() {
    console.log('\n📊 Enhanced Migration Summary:')
    console.log('=====================================')
    console.log(`📁 Question Banks: ${this.stats.totalQuestionBanks}`)
    console.log(`❓ Questions: ${this.stats.totalQuestions}`)
    console.log(`💡 Answers: ${this.stats.totalAnswers}`)
    console.log(`🏷️  Topics: ${this.stats.totalTopics}`)
    console.log(`📂 Sections: ${this.stats.totalSections}`)
    console.log(`✅ Processed Files: ${this.stats.processedFiles.length}`)
    console.log(`🗂️  CSV Metadata Entries: ${this.topicMetadataMap.size}`)

    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors (${this.stats.errors.length}):`)
      this.stats.errors.forEach(error => console.log(`   ${error}`))
    }

    console.log('\n🎉 Enhanced migration completed!')
    console.log('\n📋 Next Steps:')
    console.log('   1. Run validation: npm run validate:migration')
    console.log('   2. Test quiz generation functionality')
    console.log('   3. Set up content management APIs')
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new EnhancedQuestionMigrator()
  migrator.migrateAllQuestionBanks()
    .then(() => {
      console.log('✨ Enhanced migration complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Enhanced migration failed:', error)
      process.exit(1)
    })
}

export { EnhancedQuestionMigrator }