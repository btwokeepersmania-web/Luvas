-- Run this in Supabase SQL editor (use Service Role key permissions)

CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Optional: index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_created_at ON public.otp_codes (email, created_at DESC);
