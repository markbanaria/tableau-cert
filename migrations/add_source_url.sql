-- Add source_url column to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create index on source_url for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_source_url ON public.questions(source_url) WHERE source_url IS NOT NULL;