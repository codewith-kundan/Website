-- ================================================================
-- UDAAN CLUB - BULK PASSWORD RESET & FORCED CHANGE ON FIRST LOGIN
-- ================================================================
-- Run this in your Supabase SQL Editor if needed:
-- https://supabase.com/dashboard/project/vdeacxzqdbulgklfkqfs/sql
-- ================================================================

-- Step 1: Set Super Admin (UDAAN-000) password to SuperAdmin@2026
-- (Bcrypt hash of "SuperAdmin@2026" with salt cost 10)
UPDATE members
SET password = '$2a$10$LRk.s28IfFKou.iYf/6ms.BhrTv6cklhYpzPwt4/Kd5I66owtMd8u',
    updated_at = NOW()
WHERE member_id = 'UDAAN-000';

-- Step 2: Set all Executive Body (EB / Level 5) members password to Admin@2026
-- (Bcrypt hash of "Admin@2026" with salt cost 10)
UPDATE members
SET password = '$2a$10$dHvyGJ4eZRmMdoNLnC/4Ou/xK5FpWgOXmzDHgsJZLAMYf4cwoDP1u',
    updated_at = NOW()
WHERE clearance = 5;

-- Step 3: Set all general members (Clearance < 5) password to Udaan@2026
-- (Bcrypt hash of "Udaan@2026" with salt cost 10)
UPDATE members
SET password = '$2a$10$Yy5upmgf2T.oZgNMvJVPiuWEKcyaHrkH1Jj85OM9WVPO3wxBVuXhm',
    updated_at = NOW()
WHERE clearance < 5 AND member_id != 'UDAAN-000';

-- Step 4: Verification - Verify counts
SELECT 
  COUNT(*) as total_members,
  COUNT(CASE WHEN member_id = 'UDAAN-000' THEN 1 END) as super_admin_count,
  COUNT(CASE WHEN clearance = 5 THEN 1 END) as eb_count,
  COUNT(CASE WHEN clearance < 5 THEN 1 END) as general_member_count
FROM members;
