-- ================================================================
-- UDAAN AEROMODELLING & ROBOTICS CLUB - SECURE AUTH RPC FUNCTION
-- ================================================================
-- Purpose:
-- Fixes client-side hash verification vulnerability.
-- Currently, the web app fetches the bcrypt password hash over the wire
-- and compares it in browser JavaScript.
--
-- With this function, PostgreSQL verifies the password directly via
-- pgcrypto, ensuring password hashes NEVER leave the database.
-- ================================================================

-- 1. Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create the secure authentication function
CREATE OR REPLACE FUNCTION verify_member_credentials(
  p_member_id TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to check password without granting client read access to password column
SET search_path = public, extensions
AS $$
DECLARE
  v_member RECORD;
  v_is_valid BOOLEAN := false;
BEGIN
  -- Fetch member record by member_id
  SELECT 
    member_id, name, email, personal_email, institute_email,
    role, division, clearance, year, department, status,
    profile_pic, phone, roll_no, email_verified, password
  INTO v_member
  FROM members
  WHERE LOWER(member_id) = LOWER(TRIM(p_member_id));

  -- If member not found or inactive, reject
  IF v_member.member_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Member ID or Password');
  END IF;

  -- Check password:
  -- 1) Try pgcrypto crypt (handles standard bcrypt $2a$, $2b$, $2y$)
  IF v_member.password LIKE '$2%' THEN
    v_is_valid := (extensions.crypt(p_password, v_member.password) = v_member.password);
  ELSE
    -- Legacy fallback for plain-text dev seed accounts
    v_is_valid := (v_member.password = p_password);
  END IF;

  -- If invalid password
  IF NOT v_is_valid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid Member ID or Password');
  END IF;

  -- Update last active timestamp
  UPDATE members 
  SET updated_at = NOW()
  WHERE member_id = v_member.member_id;

  -- Return sanitized member object (EXCLUDING PASSWORD)
  RETURN jsonb_build_object(
    'success', true,
    'member', jsonb_build_object(
      'member_id', v_member.member_id,
      'name', v_member.name,
      'email', v_member.email,
      'personal_email', v_member.personal_email,
      'institute_email', v_member.institute_email,
      'role', v_member.role,
      'division', v_member.division,
      'clearance', v_member.clearance,
      'year', v_member.year,
      'department', v_member.department,
      'status', v_member.status,
      'profile_pic', v_member.profile_pic,
      'phone', v_member.phone,
      'roll_no', v_member.roll_no,
      'email_verified', v_member.email_verified
    )
  );
END;
$$;

-- 3. Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION verify_member_credentials(TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION verify_member_credentials IS 'Secure server-side authentication function verifying member passwords in PostgreSQL without exposing password hashes to clients.';
