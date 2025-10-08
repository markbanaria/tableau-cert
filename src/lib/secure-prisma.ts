import { PrismaClient } from '@/generated/prisma'

/**
 * Extended Prisma client with automatic user isolation for quiz-related operations
 */
export class SecurePrismaClient extends PrismaClient {
  constructor() {
    super()
  }

  /**
   * Get a user-scoped client that automatically filters queries by userId
   */
  forUser(userId: string) {
    return {
      // Quiz operations scoped to the user
      quiz: {
        findMany: (args?: any) =>
          this.quiz.findMany({
            ...args,
            where: {
              ...args?.where,
              userId: userId
            }
          }),

        findUnique: (args: any) =>
          this.quiz.findUnique({
            ...args,
            where: {
              ...args.where,
              userId: userId
            }
          }),

        findFirst: (args?: any) =>
          this.quiz.findFirst({
            ...args,
            where: {
              ...args?.where,
              userId: userId
            }
          }),

        create: (args: any) =>
          this.quiz.create({
            ...args,
            data: {
              ...args.data,
              userId: userId
            }
          }),

        update: (args: any) =>
          this.quiz.update({
            ...args,
            where: {
              ...args.where,
              userId: userId
            }
          }),

        delete: (args: any) =>
          this.quiz.delete({
            ...args,
            where: {
              ...args.where,
              userId: userId
            }
          }),

        count: (args?: any) =>
          this.quiz.count({
            ...args,
            where: {
              ...args?.where,
              userId: userId
            }
          })
      },

      // Quiz responses - only accessible through user's quizzes
      quizResponse: {
        findMany: (args?: any) =>
          this.quizResponse.findMany({
            ...args,
            where: {
              ...args?.where,
              quiz: {
                userId: userId
              }
            }
          }),

        findUnique: (args: any) =>
          this.quizResponse.findUnique({
            ...args,
            where: {
              ...args.where
            },
            include: {
              ...args?.include,
              quiz: true
            }
          }).then((result: any) => {
            // Verify the quiz belongs to the user
            if (result && result.quiz?.userId !== userId) {
              throw new Error('Unauthorized access to quiz response')
            }
            return result
          }),

        create: async (args: any) => {
          // Verify the quiz belongs to the user before creating response
          const quiz = await this.quiz.findUnique({
            where: { id: args.data.quizId },
            select: { userId: true }
          })

          if (!quiz || quiz.userId !== userId) {
            throw new Error('Unauthorized: Cannot create response for this quiz')
          }

          return this.quizResponse.create(args)
        },

        update: async (args: any) => {
          // Verify the response belongs to a user's quiz
          const response = await this.quizResponse.findUnique({
            where: args.where,
            include: { quiz: { select: { userId: true } } }
          })

          if (!response || (response as any).quiz?.userId !== userId) {
            throw new Error('Unauthorized: Cannot update this quiz response')
          }

          return this.quizResponse.update(args)
        },

        delete: async (args: any) => {
          // Verify the response belongs to a user's quiz
          const response = await this.quizResponse.findUnique({
            where: args.where,
            include: { quiz: { select: { userId: true } } }
          })

          if (!response || (response as any).quiz?.userId !== userId) {
            throw new Error('Unauthorized: Cannot delete this quiz response')
          }

          return this.quizResponse.delete(args)
        }
      },

      // Public read-only access to questions, topics, sections, tests, certifications
      question: this.question,
      answer: this.answer,
      topic: this.topic,
      section: this.section,
      test: this.test,
      certification: this.certification,

      // User can only access their own user data
      user: {
        findUnique: (args: any) => {
          if (args.where?.id && args.where.id !== userId) {
            throw new Error('Unauthorized: Cannot access other users data')
          }
          return this.user.findUnique({
            ...args,
            where: {
              ...args.where,
              id: userId
            }
          })
        },

        update: (args: any) =>
          this.user.update({
            ...args,
            where: {
              ...args.where,
              id: userId
            }
          })
      }
    }
  }
}

// Create a singleton instance
export const securePrisma = (globalThis as any).prisma as SecurePrismaClient || new SecurePrismaClient()

if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).prisma = securePrisma
}