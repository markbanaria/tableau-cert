import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS, CACHE_DURATIONS } from '@/lib/cache';

const prisma = new PrismaClient();

// Cached function for fetching certifications - temporarily disabled cache for dev
const getCachedCertifications = async () => {
  return await prisma.certification.findMany({
    include: {
      certificationTests: {
        include: {
          test: {
            include: {
              testSections: {
                include: {
                  section: {
                    include: {
                      sectionTopics: {
                        include: {
                          topic: {
                            include: {
                              topicQuestions: true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
};

export async function GET(request: NextRequest) {
  try {
    // Get all certifications from database - now fully database-driven!
    const certifications = await getCachedCertifications();

    // Transform the data for the frontend using database columns
    const formattedCertifications = certifications.map(cert => {
      const firstTest = cert.certificationTests[0]?.test;
      const testSections = firstTest?.testSections || [];
      const domains = testSections.length;

      // Calculate actual question counts from database
      let totalQuestions = 0;
      const sections = testSections.map(ts => {
        const sectionQuestions = ts.section.sectionTopics?.reduce((count, st) =>
          count + (st.topic.topicQuestions?.length || 0), 0) || 0;
        totalQuestions += sectionQuestions;

        return {
          id: ts.section.id,
          name: ts.section.name,
          questionCount: sectionQuestions
        };
      });

      // Calculate coverage as percentage of sections with questions
      const sectionsWithQuestions = sections.filter(s => s.questionCount > 0).length;
      const coverage = domains > 0 ? Math.round((sectionsWithQuestions / domains) * 100) : 0;

      // Default question counts for exams (fallback)
      const defaultQuestionCounts: Record<string, number> = {
        'salesforce-admin': 60,
        'tableau-consultant': 60,
        'tableau-desktop-foundations': 40,
        'tableau-data-analyst': 45,
        'tableau-server-admin': 55,
        'tableau-architect': 65
      };

      return {
        id: cert.tracks || cert.id, // Use tracks as ID for URL routing
        name: cert.name,
        description: cert.description || `Practice exam for ${cert.name} certification`,
        vendor: cert.vendor || 'Unknown',
        level: cert.level || 'Associate',
        duration: firstTest?.timeLimit || 120, // Default 2 hours
        questionCount: defaultQuestionCounts[cert.tracks || ''] || 60, // Target exam questions
        passingScore: firstTest?.passingScore || 70, // Default 70%
        domains,
        sections,
        availableQuestions: totalQuestions, // Actual questions in database
        coverage, // Percentage of sections with questions
        color: cert.color || 'bg-primary',
        icon: cert.icon || '/default-cert-icon.png',
        status: cert.status || 'coming_soon'
      };
    });

    return NextResponse.json({ certifications: formattedCertifications });

  } catch (error) {
    console.error('Error fetching certifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}