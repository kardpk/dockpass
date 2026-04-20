-- Add guest phone number to the guests table
ALTER TABLE public.guests
ADD COLUMN IF NOT EXISTS phone text;

-- Add a comment explaining what the column is for
COMMENT ON COLUMN public.guests.phone IS 'The guest''s personal phone number, collected during check-in flow.';
