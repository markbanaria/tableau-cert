-- Add Row Level Security (RLS) for quiz-related tables
-- This migration enables RLS and creates policies to ensure users can only access their own quiz data
-- For standard PostgreSQL (non-Supabase)

-- Enable RLS on quiz tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Create a function to get current user ID from session context
-- This assumes you set the user context in your application
CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid AS $$
BEGIN
    RETURN current_setting('app.current_user_id', true)::uuid;
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Quiz table policies
-- Users can view their own quizzes
CREATE POLICY "Users can view their own quizzes" ON public.quizzes
    FOR SELECT USING (user_id = current_user_id());

-- Users can insert their own quizzes
CREATE POLICY "Users can insert their own quizzes" ON public.quizzes
    FOR INSERT WITH CHECK (user_id = current_user_id());

-- Users can update their own quizzes (for completion, scoring, etc.)
CREATE POLICY "Users can update their own quizzes" ON public.quizzes
    FOR UPDATE USING (user_id = current_user_id());

-- Users can delete their own quizzes (optional, for cleanup)
CREATE POLICY "Users can delete their own quizzes" ON public.quizzes
    FOR DELETE USING (user_id = current_user_id());

-- Quiz responses table policies
-- Users can view quiz responses for their own quizzes
CREATE POLICY "Users can view their quiz responses" ON public.quiz_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = quiz_responses.quiz_id
            AND quizzes.user_id = current_user_id()
        )
    );

-- Users can insert quiz responses for their own quizzes
CREATE POLICY "Users can insert their quiz responses" ON public.quiz_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = quiz_responses.quiz_id
            AND quizzes.user_id = current_user_id()
        )
    );

-- Users can update quiz responses for their own quizzes (for corrections, etc.)
CREATE POLICY "Users can update their quiz responses" ON public.quiz_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = quiz_responses.quiz_id
            AND quizzes.user_id = current_user_id()
        )
    );

-- Users can delete quiz responses for their own quizzes
CREATE POLICY "Users can delete their quiz responses" ON public.quiz_responses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.quizzes
            WHERE quizzes.id = quiz_responses.quiz_id
            AND quizzes.user_id = current_user_id()
        )
    );

-- Admin/Service role bypass policies
-- These allow full access when no user context is set (for API operations)
CREATE POLICY "Service operations bypass RLS for quizzes" ON public.quizzes
    USING (current_user_id() IS NULL);

CREATE POLICY "Service operations bypass RLS for quiz responses" ON public.quiz_responses
    USING (current_user_id() IS NULL);

-- Create indexes for RLS policy performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id_auth ON public.quizzes(user_id)
    WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_user_lookup ON public.quiz_responses(quiz_id)
    WHERE quiz_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON FUNCTION current_user_id() IS 'Returns the current user ID from session context for RLS policies';
COMMENT ON POLICY "Users can view their own quizzes" ON public.quizzes IS 'Users can only view quizzes they created';
COMMENT ON POLICY "Users can view their quiz responses" ON public.quiz_responses IS 'Users can only view responses to their own quizzes';
COMMENT ON POLICY "Service operations bypass RLS for quizzes" ON public.quizzes IS 'API operations bypass RLS when no user context is set';