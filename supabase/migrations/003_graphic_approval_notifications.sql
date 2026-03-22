-- ═══════════════════════════════════════════════════════════════
-- DPT Content Hub — Migration: Graphic Approval + Notification Prefs
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Add graphic approval status to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS graphic_status text DEFAULT 'none' 
  CHECK (graphic_status IN ('none', 'pending_review', 'approved', 'changes_requested'));

-- 2. Notification log (tracks what's been sent to avoid duplicates)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'content_ready_for_review',
    'content_approved',
    'content_changes_requested',
    'graphic_ready_for_review',
    'graphic_approved',
    'graphic_changes_requested',
    'comment_added'
  )),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(recipient_id, read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "Admin insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin());

-- Allow clients to insert notifications too (when they approve/reject)
CREATE POLICY "Authenticated users insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
