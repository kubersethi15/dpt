-- ═══════════════════════════════════════════════════════════════
-- DPT Content Hub — Migration: LinkedIn Profile Audits
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.profile_audits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Prospect info
  prospect_name text NOT NULL,
  prospect_company text DEFAULT '',
  prospect_title text DEFAULT '',
  prospect_niche text DEFAULT '',
  prospect_linkedin_url text DEFAULT '',
  
  -- Profile data (manually entered by DPT)
  headline text DEFAULT '',
  about_section text DEFAULT '',
  has_banner boolean DEFAULT false,
  has_featured boolean DEFAULT false,
  has_creator_mode boolean DEFAULT false,
  follower_count integer DEFAULT 0,
  posting_frequency text DEFAULT '',
  recent_hooks text DEFAULT '',
  content_types_used text DEFAULT '',
  hashtag_usage text DEFAULT '',
  cta_style text DEFAULT '',
  engagement_level text DEFAULT '',
  profile_notes text DEFAULT '',
  
  -- AI-generated audit results
  audit_results jsonb DEFAULT '{}',
  overall_score integer DEFAULT 0,
  
  -- Meta
  created_by uuid REFERENCES public.profiles(id),
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'analyzed', 'sent')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audits_created_by ON public.profile_audits(created_by);

ALTER TABLE public.profile_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access audits" ON public.profile_audits
  FOR ALL USING (public.is_admin());

CREATE TRIGGER update_audits_updated_at
  BEFORE UPDATE ON public.profile_audits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
