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
    domain: string
    difficulty: string
    sourceUrl: string
    generatedDate: string
    questionCount: number
  }
  questions: Array<{
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    tags: string[]
  }>
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

class QuestionMigrator {
  private stats: MigrationStats = {
    totalQuestionBanks: 0,
    totalQuestions: 0,
    totalAnswers: 0,
    totalTopics: 0,
    totalSections: 0,
    errors: [],
    processedFiles: []
  }

  private difficultyMap: { [key: string]: number } = {
    'BEGINNER': 1,
    'INTERMEDIATE': 3,
    'ADVANCED': 5
  }

  async migrateAllQuestionBanks(): Promise<void> {
    console.log('🚀 Starting question bank migration...')

    try {
      // Clear existing data (optional - remove if you want to keep existing data)
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

    // Create or get topic
    const topicName = questionBank.metadata.topic || questionBank.metadata.title || questionBank.title
    const topic = await this.createOrGetTopic(topicName, questionBank.description)

    // Create or get section based on domain
    const section = await this.createOrGetSection(questionBank.metadata.domain, `Domain: ${questionBank.metadata.domain}`)

    // Link topic to section
    await this.linkTopicToSection(topic.id, section.id)

    // Process each question
    for (const questionData of questionBank.questions) {
      try {
        await this.processQuestion(questionData, topic.id)
        this.stats.totalQuestions++
      } catch (error) {
        const errorMsg = `Error processing question ${questionData.id} in ${path.basename(filePath)}: ${error instanceof Error ? error.message : String(error)}`
        console.error(`❌ ${errorMsg}`)
        this.stats.errors.push(errorMsg)
      }
    }

    console.log(`✅ Processed ${questionBank.questions.length} questions from ${path.basename(filePath)}`)
  }

  private async createOrGetTopic(name: string, description?: string) {
    let topic = await prisma.topic.findFirst({
      where: { name }
    })

    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name,
          description: description || `Topic: ${name}`
        }
      })
      this.stats.totalTopics++
      console.log(`📝 Created topic: ${name}`)
    }

    return topic
  }

  private async createOrGetSection(name: string, description?: string) {
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
      console.log(`📂 Created section: ${name}`)
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

  private async processQuestion(questionData: any, topicId: string) {
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
          isCorrect: i === questionData.correctAnswer,
          explanation: i === questionData.correctAnswer ? questionData.explanation : null
        }
      })
      this.stats.totalAnswers++
    }
  }

  private printMigrationSummary() {
    console.log('\n📊 Migration Summary:')
    console.log('=====================================')
    console.log(`📁 Question Banks: ${this.stats.totalQuestionBanks}`)
    console.log(`❓ Questions: ${this.stats.totalQuestions}`)
    console.log(`💡 Answers: ${this.stats.totalAnswers}`)
    console.log(`🏷️  Topics: ${this.stats.totalTopics}`)
    console.log(`📂 Sections: ${this.stats.totalSections}`)
    console.log(`✅ Processed Files: ${this.stats.processedFiles.length}`)

    if (this.stats.errors.length > 0) {
      console.log(`\n❌ Errors (${this.stats.errors.length}):`)
      this.stats.errors.forEach(error => console.log(`   ${error}`))
    }

    console.log('\n🎉 Migration completed!')
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new QuestionMigrator()
  migrator.migrateAllQuestionBanks()
    .then(() => {
      console.log('✨ All done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

export { QuestionMigrator }