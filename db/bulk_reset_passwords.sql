-- ================================================================
-- UDAAN CLUB - BULK PASSWORD RESET & FORCED CHANGE ON FIRST LOGIN
-- ================================================================
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vdeacxzqdbulgklfkqfs/sql
-- ================================================================

-- Step 1: Add requires_password_change column if not present (default to true for forced first-login change)
ALTER TABLE members ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT true;

-- Step 2: Set Super Admin (UDAAN-000) password to Admin@2026
-- and enforce forced password change on first login
-- (Bcrypt hash of "Admin@2026" with salt cost 10)
UPDATE members
SET password = '$2a$10$ScN..YQEHHedOqgow3qPOOSG383sGVTu429nRd21URKnov.39.TLW',
    requires_password_change = true,
    updated_at = NOW()
WHERE member_id = 'UDAAN-000';

-- Step 3: Set all general members, leads, and administrators password to Udaan@2026
-- and enforce forced password change on first login
-- (Bcrypt hash of "Udaan@2026" with salt cost 10)
UPDATE members
SET password = '$2a$10$i5BparPCu7mODbq8ld6o1OQFzB6TiLfLCyM8l20f1fmo.FVf5T/Sm',
    requires_password_change = true,
    updated_at = NOW()
WHERE member_id != 'UDAAN-000';

-- Step 4: Verification - Verify counts
SELECT 
  COUNT(*) as total_members,
  COUNT(CASE WHEN member_id = 'UDAAN-000' AND requires_password_change = true THEN 1 END) as super_admins_pending_change,
  COUNT(CASE WHEN requires_password_change = true THEN 1 END) as total_pending_password_changes
FROM members;

