/**
 * Test script to validate quiz sampler updates
 * Run this to verify that the sampler correctly handles the test composition structure
 */

import { QuizSampler } from '../services/quizSampler';
import { TABLEAU_CONSULTANT_COMPOSITION } from '../config/testComposition';

async function testQuizSampler() {
  console.log('🧪 Testing Quiz Sampler with Updated Test Composition\n');
  console.log('=' .repeat(80));

  const sampler = new QuizSampler();

  // Test 1: Load question banks
  console.log('\n📚 Test 1: Loading Question Banks Dynamically...');
  await sampler.loadQuestionBanks();
  
  const stats = sampler.getQuestionBankStats();
  console.log(`✓ Loaded ${Object.keys(stats).length} question banks`);

  // Test 2: Check required vs loaded topics
  console.log('\n📋 Test 2: Validating Topic Coverage...');
  const topicComparison = sampler.getRequiredVsLoadedTopics();
  console.log(`  Required topics: ${topicComparison.required.length}`);
  console.log(`  Loaded topics: ${topicComparison.loaded.length}`);
  console.log(`  Missing topics: ${topicComparison.missing.length}`);
  
  if (topicComparison.missing.length > 0) {
    console.log('\n⚠️  Missing Question Banks:');
    topicComparison.missing.forEach(topic => console.log(`    - ${topic}`));
  }

  // Test 3: Domain coverage with subtopics
  console.log('\n📊 Test 3: Domain Coverage Analysis...');
  const coverage = sampler.getDomainCoverage();
  
  for (const [domainName, data] of Object.entries(coverage)) {
    console.log(`\n  ${domainName}:`);
    console.log(`    Total Questions Available: ${data.totalQuestions}`);
    console.log(`    Required for Exam: ${data.requiredQuestions}`);
    console.log(`    Topics Loaded: ${data.topicsLoaded}/${data.topicsTotal} (${data.coveragePercentage}%)`);
    
    if (data.totalQuestions < data.requiredQuestions) {
      console.log(`    ⚠️  WARNING: Insufficient questions (need ${data.requiredQuestions - data.totalQuestions} more)`);
    } else {
      console.log(`    ✓ Sufficient questions available`);
    }
  }

  // Test 4: Validate question banks
  console.log('\n🔍 Test 4: Validating Question Bank Structure...');
  const issues = await sampler.validateQuestionBanks();
  
  if (issues.length === 0) {
    console.log('  ✓ All question banks are valid');
  } else {
    console.log(`  ⚠️  Found ${issues.length} issues:`);
    issues.slice(0, 10).forEach(issue => console.log(`    - ${issue}`));
    if (issues.length > 10) {
      console.log(`    ... and ${issues.length - 10} more`);
    }
  }

  // Test 5: Generate sample quiz
  console.log('\n🎯 Test 5: Generating Sample Full Practice Exam...');
  try {
    const quiz = await sampler.generateQuiz({
      totalQuestions: 60,
      compositionType: 'full_practice'
    });
    
    console.log(`  ✓ Generated quiz: "${quiz.title}"`);
    console.log(`  Description: ${quiz.description}`);
    console.log(`  Total Questions: ${quiz.questions.length}/60`);
    
    // Count questions by domain
    const questionsByDomain: Record<string, number> = {};
    for (const question of quiz.questions) {
      const domain = question.metadata?.tags?.[0] || 'unknown';
      questionsByDomain[domain] = (questionsByDomain[domain] || 0) + 1;
    }
    
    console.log('\n  Question Distribution:');
    for (const [domain, count] of Object.entries(questionsByDomain)) {
      console.log(`    ${domain}: ${count} questions`);
    }
    
  } catch (error) {
    console.log(`  ❌ Failed to generate quiz: ${error}`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📝 Summary:');
  console.log(`  ✓ Test Composition Domains: ${TABLEAU_CONSULTANT_COMPOSITION.domains.length}`);
  console.log(`  ✓ Required Topics: ${topicComparison.required.length}`);
  console.log(`  ✓ Loaded Question Banks: ${Object.keys(stats).length}`);
  console.log(`  ✓ Missing Question Banks: ${topicComparison.missing.length}`);
  console.log(`  ✓ Validation Issues: ${issues.length}`);
  
  if (topicComparison.missing.length === 0 && issues.length === 0) {
    console.log('\n✅ Quiz Sampler is ready for accurate exam composition!');
  } else {
    console.log('\n⚠️  Quiz Sampler needs attention - see issues above');
  }
}

// Run the test
testQuizSampler().catch(console.error);
