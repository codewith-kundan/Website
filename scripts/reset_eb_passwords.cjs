const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function resetPasswords() {
  console.log('==================================================');
  console.log('RESETTING PASSWORDS FOR SUPER ADMIN & EXECUTIVE BODY (EB)');
  console.log('==================================================\n');

  // 1. Reset Super Admin (UDAAN-000) to SuperAdmin@2026
  console.log('1. Hashing and updating Super Admin (UDAAN-000) password to SuperAdmin@2026...');
  const superAdminHash = await bcrypt.hash('SuperAdmin@2026', 10);
  const { data: superAdminData, error: superAdminErr } = await supabase
    .from('members')
    .update({ 
      password: superAdminHash, 
      updated_at: new Date().toISOString() 
    })
    .eq('member_id', 'UDAAN-000')
    .select('member_id, name, role, clearance');

  if (superAdminErr) {
    console.error('❌ Failed to update Super Admin:', superAdminErr);
  } else {
    console.log('✅ Super Admin updated successfully:', superAdminData);
  }

  // 2. Find all EB members (Clearance Level 5)
  console.log('\n2. Fetching all Executive Body (EB / Level 5) members...');
  const { data: ebMembers, error: ebFetchErr } = await supabase
    .from('members')
    .select('member_id, name, role, clearance')
    .eq('clearance', 5)
    .order('member_id');

  if (ebFetchErr) {
    console.error('❌ Failed to fetch EB members:', ebFetchErr);
    return;
  }

  console.log(`Found ${ebMembers.length} Executive Body members:`);
  ebMembers.forEach(m => console.log(`   - ${m.member_id}: ${m.name} (${m.role})`));

  // 3. Hash Admin@2026 and update all EB members
  console.log('\n3. Hashing and updating EB passwords to Admin@2026...');
  const ebHash = await bcrypt.hash('Admin@2026', 10);
  const ebIds = ebMembers.map(m => m.member_id);

  const { data: updatedEb, error: ebUpdateErr } = await supabase
    .from('members')
    .update({ 
      password: ebHash, 
      updated_at: new Date().toISOString() 
    })
    .in('member_id', ebIds)
    .select('member_id, name, role, clearance');

  if (ebUpdateErr) {
    console.error('❌ Failed to update EB passwords:', ebUpdateErr);
    return;
  }

  console.log(`✅ Successfully updated ${updatedEb.length} EB members to Admin@2026:`);
  updatedEb.forEach(m => console.log(`   ✔ ${m.member_id}: ${m.name} (${m.role})`));

  // 4. Verify logins with bcrypt.compare
  console.log('\n4. Verifying bcrypt password verification...');
  const testSuperAdmin = await bcrypt.compare('SuperAdmin@2026', superAdminHash);
  const testEb = await bcrypt.compare('Admin@2026', ebHash);
  console.log(`   - SuperAdmin@2026 matches hash: ${testSuperAdmin}`);
  console.log(`   - Admin@2026 matches hash: ${testEb}`);

  console.log('\n==================================================');
  console.log('ALL PASSWORDS RESET SUCCESSFULLY!');
  console.log('==================================================');
}

resetPasswords().catch(console.error);
