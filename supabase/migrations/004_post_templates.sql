-- ═══════════════════════════════════════════════════════════════
-- DPT Content Hub — Migration: Post Templates
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.post_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  content text NOT NULL,
  hook_type text,
  content_type text DEFAULT 'Text',
  tags text DEFAULT '',
  client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id),
  is_global boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_client ON public.post_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_templates_global ON public.post_templates(is_global);

ALTER TABLE public.post_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access templates" ON public.post_templates
  FOR ALL USING (public.is_admin());

CREATE POLICY "Clients read own templates" ON public.post_templates
  FOR SELECT USING (client_id = auth.uid() OR is_global = true);
