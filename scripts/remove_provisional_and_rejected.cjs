const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

const DIVISION_TABLES = [
  'drone_division',
  'rc_plane_division',
  'rocketry_division',
  'creative_division',
  'management_division'
];

async function removeProvisionalAndRejected() {
  console.log('--- Purging Provisional and Rejected Records ---');

  // 1. Fetch all members to remove
  const { data: targets, error: fetchErr } = await supabase
    .from('members')
    .select('member_id, name, status, year, role')
    .in('status', ['provisional', 'rejected']);

  if (fetchErr) {
    console.error('Error fetching targets:', fetchErr);
    return;
  }

  console.log(`Found ${targets.length} records to remove:`);
  console.log(`- Provisional: ${targets.filter(t => t.status === 'provisional').length}`);
  console.log(`- Rejected: ${targets.filter(t => t.status === 'rejected').length}`);

  const targetIds = targets.map(t => t.member_id);
  const targetNames = targets.map(t => t.name).filter(Boolean);

  // 2. Clean up child records in batches or with `in`
  console.log('\nCleaning related child records...');

  // Tasks
  const { error: tErr1 } = await supabase.from('tasks').delete().in('assigned_to', targetIds);
  if (tErr1) console.warn('Tasks delete (assigned_to):', tErr1.message);
  const { error: tErr2 } = await supabase.from('tasks').delete().in('assigned_by', targetIds);
  if (tErr2) console.warn('Tasks delete (assigned_by):', tErr2.message);

  // Notifications
  const { error: nErr } = await supabase.from('notifications').delete().in('member_id', targetIds);
  if (nErr) console.warn('Notifications delete:', nErr.message);

  // Activity logs
  const { error: aErr } = await supabase.from('activity_logs').delete().in('member_id', targetIds);
  if (aErr) console.warn('Activity logs delete:', aErr.message);

  // Division requests
  const { error: drErr } = await supabase.from('division_requests').delete().in('member_id', targetIds);
  if (drErr) console.warn('Division requests delete:', drErr.message);

  // Division tables
  for (const table of DIVISION_TABLES) {
    try {
      const { error } = await supabase.from(table).delete().in('member_id', targetIds);
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        console.warn(`Division table ${table} delete:`, error.message);
      }
    } catch (e) {
      // ignore table not found
    }
  }

  // 3. Delete from members table
  console.log('\nDeleting from members table...');
  const { data: deleted, error: delErr } = await supabase
    .from('members')
    .delete()
    .in('status', ['provisional', 'rejected'])
    .select('member_id, name, status');

  if (delErr) {
    console.error('Error deleting members:', delErr);
    return;
  }

  console.log(`Successfully deleted ${deleted.length} members from database!`);

  // 4. Verify remaining members
  const { data: remaining, count } = await supabase
    .from('members')
    .select('member_id, name, role, year, status', { count: 'exact' });

  console.log(`\nRemaining members count in database: ${remaining.length}`);
  const statusCounts = {};
  remaining.forEach(r => {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  });
  console.log('Status distribution of remaining members:', statusCounts);
}

removeProvisionalAndRejected();
