import { PrismaClient } from '@/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TopicMapping {
  section: string;
  topic: string;
  parentTopic: string;
  assignedUrl: string;
  domain: string;
  relatedTopics: string;
  questionCount: number;
  topicType: string;
}

async function updateSourceUrls() {
  try {
    // Read the CSV file
    const csvPath = path.join(process.cwd(), '../docs/Mapped_Catalog_Topics_to_URLs.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV (skip header)
    const lines = csvContent.trim().split('\n').slice(1);
    const topicMappings: TopicMapping[] = lines.map(line => {
      const [section, topic, parentTopic, assignedUrl, domain, relatedTopics, questionCount, topicType] = line.split(',');
      return {
        section,
        topic,
        parentTopic,
        assignedUrl,
        domain,
        relatedTopics,
        questionCount: parseInt(questionCount || '0'),
        topicType
      };
    });

    console.log(`Loaded ${topicMappings.length} topic mappings`);

    // Get all questions with their topics
    const questions = await prisma.question.findMany({
      include: {
        topicQuestions: {
          include: {
            topic: true
          }
        }
      }
    });

    console.log(`Found ${questions.length} questions to update`);

    let updatedCount = 0;

    // Update each question with source URL based on topic mapping
    for (const question of questions) {
      for (const topicQuestion of question.topicQuestions) {
        const topicName = topicQuestion.topic.name;

        // Find matching topic in mappings (case-insensitive and flexible matching)
        const mapping = topicMappings.find(tm =>
          tm.topic.toLowerCase().includes(topicName.toLowerCase()) ||
          topicName.toLowerCase().includes(tm.topic.toLowerCase()) ||
          tm.topic.toLowerCase() === topicName.toLowerCase()
        );

        if (mapping && mapping.assignedUrl && !question.sourceUrl) {
          try {
            await prisma.question.update({
              where: { id: question.id },
              data: { sourceUrl: mapping.assignedUrl }
            });

            console.log(`Updated question ${question.id} with URL: ${mapping.assignedUrl}`);
            updatedCount++;
            break; // Only use the first matching topic
          } catch (error) {
            console.error(`Error updating question ${question.id}:`, error);
          }
        }
      }
    }

    console.log(`Successfully updated ${updatedCount} questions with source URLs`);

    // Show some statistics
    const questionsWithUrls = await prisma.question.count({
      where: { sourceUrl: { not: null } }
    });
    const totalQuestions = await prisma.question.count();

    console.log(`Questions with source URLs: ${questionsWithUrls}/${totalQuestions}`);

  } catch (error) {
    console.error('Error updating source URLs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSourceUrls();