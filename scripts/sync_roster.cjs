const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

async function syncRoster() {
  const { data: members, error } = await supabase
    .from('members')
    .select('member_id, name, role, division, year, clearance, status')
    .order('member_id');

  if (error) {
    console.error(error);
    return;
  }

  // 1. Write CSV
  const csvHeaders = ['Member ID', 'Name', 'Role', 'Division', 'Year', 'Clearance', 'Status'];
  const csvRows = [csvHeaders.join(',')];
  for (const m of members) {
    csvRows.push([
      m.member_id,
      '"' + (m.name || '') + '"',
      '"' + (m.role || '') + '"',
      '"' + (m.division || '') + '"',
      '"' + (m.year ?? '') + '"',
      '"' + (m.clearance ?? '') + '"',
      '"' + (m.status || '') + '"'
    ].join(','));
  }
  fs.writeFileSync('all_members_roster.csv', csvRows.join('\n'));
  console.log('Updated all_members_roster.csv with ' + members.length + ' records');

  // 2. Write Markdown
  let md = '# UDAAN Club - Complete Member Roster\n\n';
  md += `**Total Members**: ${members.length}\n\n`;
  md += '| User ID | Name | Role | Division | Year | Clearance | Status |\n';
  md += '| :--- | :--- | :--- | :--- | :---: | :---: | :---: |\n';
  for (const m of members) {
    md += `| \`${m.member_id}\` | **${m.name}** | ${m.role} | ${m.division} | ${m.year ?? '-'} | Level ${m.clearance} | \`${m.status}\` |\n`;
  }
  fs.writeFileSync('db/all_members_roster.md', md);
  console.log('Updated db/all_members_roster.md');
}

syncRoster();
