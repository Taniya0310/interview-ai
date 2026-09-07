ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS institution_company VARCHAR(150);
