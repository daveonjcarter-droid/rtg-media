-- Application status enum
CREATE TYPE public.application_status AS ENUM (
  'new', 'strong', 'needs_review', 'rejected', 'approved', 'invited'
);

CREATE TYPE public.application_priority AS ENUM ('low', 'normal', 'high');
CREATE TYPE public.application_experience AS ENUM ('none', 'beginner', 'intermediate', 'professional');

-- Applications table
CREATE TABLE public.applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Applicant info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  role_applying_for TEXT NOT NULL,
  -- Links
  portfolio_url TEXT NOT NULL,
  instagram_url TEXT,
  linkedin_url TEXT,
  -- Written answers
  why_join TEXT NOT NULL,
  experience TEXT NOT NULL,
  availability TEXT NOT NULL,
  experience_level public.application_experience,
  -- Resume
  resume_path TEXT,
  resume_filename TEXT,
  -- Workflow
  status public.application_status NOT NULL DEFAULT 'new',
  priority public.application_priority NOT NULL DEFAULT 'normal',
  is_low_priority BOOLEAN NOT NULL DEFAULT false,
  completeness_score INTEGER NOT NULL DEFAULT 0,
  internal_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  -- Invite link (once approved)
  invite_id UUID,
  invited_at TIMESTAMP WITH TIME ZONE,
  -- Spam / verification
  ip_address TEXT,
  user_agent TEXT,
  captcha_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- One application per email (case-insensitive)
CREATE UNIQUE INDEX applications_email_unique ON public.applications (lower(email));
CREATE INDEX applications_status_idx ON public.applications (status, created_at DESC);
CREATE INDEX applications_role_idx ON public.applications (role_applying_for);
CREATE INDEX applications_city_idx ON public.applications (city);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit
CREATE POLICY "Anyone can submit an application"
ON public.applications FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Admins/head admins can read
CREATE POLICY "Admins read applications"
ON public.applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'head_admin'));

CREATE POLICY "Admins update applications"
ON public.applications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'head_admin'));

CREATE POLICY "Admins delete applications"
ON public.applications FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'head_admin'));

-- updated_at trigger
CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Rate limit table (used by submit edge function)
CREATE TABLE public.application_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX application_rate_limits_ip_idx ON public.application_rate_limits (ip_address, created_at DESC);
CREATE INDEX application_rate_limits_email_idx ON public.application_rate_limits (lower(email), created_at DESC);

ALTER TABLE public.application_rate_limits ENABLE ROW LEVEL SECURITY;
-- Only service role accesses this (no policies = no client access)

-- Storage bucket for resumes (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications', 'applications', false)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload to applications bucket (anonymous upload from form)
CREATE POLICY "Anyone can upload application files"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'applications');

-- Only admins can read application files
CREATE POLICY "Admins can read application files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'applications'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'head_admin'))
);

-- Only admins can delete application files
CREATE POLICY "Admins can delete application files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'applications'
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'head_admin'))
);