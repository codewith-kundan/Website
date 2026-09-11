const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function updateRolesAndYears() {
  console.log('--- Starting Role & Year Progression Update ---');

  // 1. Current 4th Years -> Role: 'Mentor', Year: null (rendered as '-')
  console.log('Step 1: Updating 4th Years to Mentor (Year: null)...');
  const { data: m4, error: err4 } = await supabase
    .from('members')
    .update({ role: 'Mentor', year: null, clearance: 4 })
    .eq('year', 4)
    .select('member_id, name, role, year, clearance');
  
  if (err4) {
    console.error('Error updating 4th years:', err4);
    return;
  }
  console.log(`Updated ${m4.length} 4th-year members to Mentor:`, m4.map(m => `${m.member_id}: ${m.name} (${m.role})`));

  // 2. Current 3rd Years -> Year 4
  console.log('\nStep 2: Promoting 3rd Years to 4th Year...');
  // First, former council in year 3: set role to 'Senior Member', clearance: 4, year: 4
  const formerCouncilIds = ['UDAAN-001', 'UDAAN-002', 'UDAAN-003', 'UDAAN-004', 'UDAAN-005', 'UDAAN-006', 'UDAAN-007'];
  const { data: mOldCouncil, error: errOldCouncil } = await supabase
    .from('members')
    .update({ role: 'Senior Member', clearance: 4, year: 4 })
    .in('member_id', formerCouncilIds)
    .select('member_id, name, role, year, clearance');
  
  if (errOldCouncil) {
    console.error('Error updating former council:', errOldCouncil);
    return;
  }
  console.log(`Updated ${mOldCouncil.length} former council members to Senior Member (Year 4, Clearance 4)`);

  // Other 3rd years to Year 4
  const { data: m3, error: err3 } = await supabase
    .from('members')
    .update({ year: 4, clearance: 4 })
    .eq('year', 3)
    .select('member_id, name, role, year, clearance');
  
  if (err3) {
    console.error('Error updating 3rd years to 4th:', err3);
    return;
  }
  console.log(`Updated remaining ${m3.length} 3rd years to 4th Year:`, m3.map(m => `${m.member_id}: ${m.name}`));

  // 3. Current 2nd Years -> Year 3
  console.log('\nStep 3: Promoting 2nd Years to 3rd Year...');
  // All 2nd years to year 3
  const { data: m2, error: err2 } = await supabase
    .from('members')
    .update({ year: 3 })
    .eq('year', 2)
    .select('member_id, name, role, year, clearance');
  
  if (err2) {
    console.error('Error promoting 2nd years to 3rd:', err2);
    return;
  }
  console.log(`Promoted ${m2.length} 2nd years to 3rd Year`);

  // Now assign New Council Roles & Level 5 Clearance
  console.log('\nStep 3b: Assigning New Council Roles & Clearance 5...');
  const newCouncil = [
    { id: 'UDAAN-2001', role: 'President' },
    { id: 'UDAAN-2021', role: 'Vice President' },
    { id: 'UDAAN-2015', role: 'Secretary' },
    { id: 'UDAAN-2011', role: 'Treasurer' },
    { id: 'UDAAN-2009', role: 'Drone Lead' },
    { id: 'UDAAN-2022', role: 'Rocket Lead' },
    { id: 'UDAAN-2004', role: 'RC Lead' },
    { id: 'UDAAN-2017', role: 'Management Lead' },
    { id: 'UDAAN-2019', role: 'PR & Creative Head' },
  ];

  for (const c of newCouncil) {
    const { data, error } = await supabase
      .from('members')
      .update({ role: c.role, clearance: 5 })
      .eq('member_id', c.id)
      .select('member_id, name, role, clearance, year');
    if (error) console.error(`Error updating ${c.id}:`, error);
    else console.log(`Assigned Council: ${data[0]?.member_id} - ${data[0]?.name} -> ${data[0]?.role} (Clearance: ${data[0]?.clearance}, Year: ${data[0]?.year})`);
  }

  // 4. Current 1st Years -> Year 2
  console.log('\nStep 4: Promoting 1st Years to 2nd Year...');
  const { data: m1, error: err1 } = await supabase
    .from('members')
    .update({ year: 2 })
    .eq('year', 1)
    .select('member_id');
  
  if (err1) {
    console.error('Error promoting 1st years to 2nd:', err1);
    return;
  }
  console.log(`Promoted ${m1.length} 1st-year members to 2nd Year`);

  console.log('\n--- Successfully Completed All Database Updates! ---');
}

updateRolesAndYears();
