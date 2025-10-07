-- Initial schema migration for Tableau Certification Platform
-- Generated from Prisma schema - Production ready migration
-- Run this on Supabase to create all tables

BEGIN;

-- Create the new tables (auth tables already exist)
-- Questions table
CREATE TABLE IF NOT EXISTS "questions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "difficulty_level" INTEGER,
    "explanation" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Answers table
CREATE TABLE IF NOT EXISTS "answers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Topics table
CREATE TABLE IF NOT EXISTS "topics" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Topic Questions junction table
CREATE TABLE IF NOT EXISTS "topic_questions" (
    "topic_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    PRIMARY KEY ("topic_id", "question_id")
);

-- Sections table
CREATE TABLE IF NOT EXISTS "sections" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Section Topics junction table
CREATE TABLE IF NOT EXISTS "section_topics" (
    "section_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    PRIMARY KEY ("section_id", "topic_id")
);

-- Tests table
CREATE TABLE IF NOT EXISTS "tests" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "time_limit" INTEGER,
    "passing_score" INTEGER,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Test Sections junction table
CREATE TABLE IF NOT EXISTS "test_sections" (
    "test_id" UUID NOT NULL,
    "section_id" UUID NOT NULL,
    PRIMARY KEY ("test_id", "section_id")
);

-- Certifications table
CREATE TABLE IF NOT EXISTS "certifications" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tracks" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Certification Tests junction table
CREATE TABLE IF NOT EXISTS "certification_tests" (
    "certification_id" UUID NOT NULL,
    "test_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY ("certification_id", "test_id")
);

-- Quizzes table (user quiz sessions)
CREATE TABLE IF NOT EXISTS "quizzes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "test_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "score" INTEGER,
    "started_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "completed_at" TIMESTAMP,
    "time_taken" INTEGER
);

-- Quiz Responses table
CREATE TABLE IF NOT EXISTS "quiz_responses" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "quiz_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer_id" UUID,
    "user_answer" TEXT,
    "is_correct" BOOLEAN,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Foreign key constraints
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;

ALTER TABLE "topic_questions" ADD CONSTRAINT "topic_questions_topic_id_fkey"
    FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE;

ALTER TABLE "topic_questions" ADD CONSTRAINT "topic_questions_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;

ALTER TABLE "section_topics" ADD CONSTRAINT "section_topics_section_id_fkey"
    FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE;

ALTER TABLE "section_topics" ADD CONSTRAINT "section_topics_topic_id_fkey"
    FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE;

ALTER TABLE "test_sections" ADD CONSTRAINT "test_sections_test_id_fkey"
    FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE;

ALTER TABLE "test_sections" ADD CONSTRAINT "test_sections_section_id_fkey"
    FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE;

ALTER TABLE "certification_tests" ADD CONSTRAINT "certification_tests_certification_id_fkey"
    FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE CASCADE;

ALTER TABLE "certification_tests" ADD CONSTRAINT "certification_tests_test_id_fkey"
    FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE CASCADE;

ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_test_id_fkey"
    FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE SET NULL;

ALTER TABLE "quiz_responses" ADD CONSTRAINT "quiz_responses_quiz_id_fkey"
    FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE;

ALTER TABLE "quiz_responses" ADD CONSTRAINT "quiz_responses_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE;

ALTER TABLE "quiz_responses" ADD CONSTRAINT "quiz_responses_answer_id_fkey"
    FOREIGN KEY ("answer_id") REFERENCES "answers"("id") ON DELETE SET NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "questions_question_type_idx" ON "questions"("question_type");
CREATE INDEX IF NOT EXISTS "questions_difficulty_level_idx" ON "questions"("difficulty_level");
CREATE INDEX IF NOT EXISTS "answers_question_id_idx" ON "answers"("question_id");
CREATE INDEX IF NOT EXISTS "answers_is_correct_idx" ON "answers"("is_correct");
CREATE INDEX IF NOT EXISTS "topics_name_idx" ON "topics"("name");
CREATE INDEX IF NOT EXISTS "sections_name_idx" ON "sections"("name");
CREATE INDEX IF NOT EXISTS "tests_name_idx" ON "tests"("name");
CREATE INDEX IF NOT EXISTS "certifications_name_idx" ON "certifications"("name");
CREATE INDEX IF NOT EXISTS "certifications_tracks_idx" ON "certifications"("tracks");
CREATE INDEX IF NOT EXISTS "quizzes_user_id_idx" ON "quizzes"("user_id");
CREATE INDEX IF NOT EXISTS "quizzes_test_id_idx" ON "quizzes"("test_id");
CREATE INDEX IF NOT EXISTS "quizzes_status_idx" ON "quizzes"("status");
CREATE INDEX IF NOT EXISTS "quizzes_started_at_idx" ON "quizzes"("started_at");
CREATE INDEX IF NOT EXISTS "quiz_responses_quiz_id_idx" ON "quiz_responses"("quiz_id");
CREATE INDEX IF NOT EXISTS "quiz_responses_question_id_idx" ON "quiz_responses"("question_id");
CREATE INDEX IF NOT EXISTS "quiz_responses_is_correct_idx" ON "quiz_responses"("is_correct");

COMMIT;