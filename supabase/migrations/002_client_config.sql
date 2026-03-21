-- ═══════════════════════════════════════════════════════════════
-- DPT Content Hub — Migration: Client Voice & Content Config
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.client_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- VOICE PROFILE
  voice_tone text DEFAULT '',              -- e.g. "Direct, practitioner, no-BS"
  voice_perspective text DEFAULT 'first_person' CHECK (voice_perspective IN ('first_person', 'third_person', 'company_voice')),
  voice_description text DEFAULT '',       -- Longer description of how they sound
  banned_words text DEFAULT '',            -- Comma-separated banned words
  preferred_vocabulary text DEFAULT '',    -- Words/phrases they actually use
  example_posts text DEFAULT '',           -- 3-5 of their best posts, newline separated
  writing_style_notes text DEFAULT '',     -- Any other style notes

  -- CONTENT RULES
  emoji_policy text DEFAULT 'never' CHECK (emoji_policy IN ('never', 'sparingly', 'freely')),
  cta_preferences text DEFAULT '',         -- e.g. "Link in comments only, never REPOST"
  hashtag_strategy text DEFAULT '',        -- e.g. "Max 3, always include #CustomerSuccess"
  post_length_min integer DEFAULT 100,
  post_length_max integer DEFAULT 200,
  formatting_rules text DEFAULT '',        -- e.g. "Short paragraphs, no bullets"

  -- NICHE & POSITIONING
  industry text DEFAULT '',
  sub_topics text DEFAULT '',              -- Comma-separated key topics they cover
  unique_angle text DEFAULT '',            -- What differentiates them
  competitors text DEFAULT '',             -- Who else posts in their space
  target_audience text DEFAULT '',         -- Who they're writing for

  -- RESEARCH KEYWORDS
  research_keywords text DEFAULT '',       -- Specific terms to search for trends
  subreddits text DEFAULT '',              -- e.g. "r/sales, r/CustomerSuccess"
  blogs_and_sources text DEFAULT '',       -- Industry blogs to monitor
  thought_leaders text DEFAULT '',         -- People in their space to reference

  -- CONTENT CALENDAR
  posting_frequency text DEFAULT '5 per week',
  day_themes text DEFAULT '',              -- e.g. "Mon: hot takes, Wed: carousels, Fri: quick punch"

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_config_client ON public.client_config(client_id);

ALTER TABLE public.client_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access client_config" ON public.client_config
  FOR ALL USING (public.is_admin());

CREATE POLICY "Clients read own config" ON public.client_config
  FOR SELECT USING (client_id = auth.uid());

CREATE TRIGGER update_client_config_updated_at
  BEFORE UPDATE ON public.client_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
