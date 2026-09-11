const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

// Specific post title mapping for council and leadership
const POST_MAPPINGS = {
  'UDAAN-000': { role: 'Super Admin', post: 'System Administrator (Root)' },
  'UDAAN-2001': { role: 'Executive Council', post: 'President' },
  'UDAAN-2021': { role: 'Executive Council', post: 'Vice President' },
  'UDAAN-2015': { role: 'Executive Council', post: 'Secretary' },
  'UDAAN-2011': { role: 'Executive Council', post: 'Treasurer' },
  'UDAAN-2009': { role: 'Executive Council', post: 'Drone Subsystem Lead' },
  'UDAAN-2004': { role: 'Executive Council', post: 'RC Subsystem Lead' },
  'UDAAN-2022': { role: 'Executive Council', post: 'Rocketry Subsystem Lead' },
  'UDAAN-2017': { role: 'Executive Council', post: 'Management Lead' },
  'UDAAN-2019': { role: 'Executive Council', post: 'PR & Creative Head' },
  'UDAAN-4001': { role: 'Mentor', post: 'Club Mentor & Technical Advisor' },
  'UDAAN-4002': { role: 'Mentor', post: 'Club Mentor & Flight Advisor' },
  'UDAAN-4003': { role: 'Mentor', post: 'Club Mentor & Avionics Advisor' }
};

function formatName(name) {
  if (!name) return '-';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getMemberDetails(m) {
  const mapped = POST_MAPPINGS[m.member_id];
  if (mapped) {
    return {
      role: mapped.role,
      post: mapped.post
    };
  }

  if (m.year === 4) {
    return {
      role: 'Senior Member',
      post: '4th Year Senior Member'
    };
  }
  if (m.year === 3) {
    return {
      role: 'Executive Member',
      post: '3rd Year Core Member'
    };
  }
  if (m.year === 2) {
    return {
      role: 'Member',
      post: '2nd Year Technical Member'
    };
  }
  return {
    role: m.role || 'Member',
    post: m.role || 'Technical Member'
  };
}

function getClearanceBadge(clearance) {
  if (clearance >= 9) return '<span class="badge badge-red">L9 Root Admin</span>';
  if (clearance >= 5) return '<span class="badge badge-gold">L5 Council Lead</span>';
  if (clearance === 4) return '<span class="badge badge-blue">L4 Senior</span>';
  if (clearance === 3) return '<span class="badge badge-cyan">L3 Core</span>';
  return '<span class="badge badge-gray">L2 Member</span>';
}

function getPostBadge(post, role) {
  const p = (post || '').toLowerCase();
  const r = (role || '').toLowerCase();
  if (p.includes('president') || p.includes('secretary') || p.includes('treasurer')) {
    return `<span class="badge badge-gold font-bold">${post}</span>`;
  }
  if (p.includes('lead') || p.includes('head')) {
    return `<span class="badge badge-cyan font-bold">${post}</span>`;
  }
  if (r.includes('mentor')) {
    return `<span class="badge badge-purple font-bold">${post}</span>`;
  }
  if (r.includes('super admin')) {
    return `<span class="badge badge-red font-bold">${post}</span>`;
  }
  if (r.includes('senior')) {
    return `<span class="badge badge-blue">${post}</span>`;
  }
  return `<span class="badge badge-gray">${post}</span>`;
}

function cleanDivisions(div) {
  if (!div) return '-';
  return div
    .replace(/Creative\/Web-Dev/gi, 'Creative, Web Dev')
    .replace(/,\s*,/g, ',')
    .trim();
}

async function generatePDF() {
  console.log('Fetching members from Supabase...');
  const { data: members, error } = await supabase
    .from('members')
    .select('member_id, name, role, division, year, clearance, status')
    .order('member_id');

  if (error) {
    console.error('Error fetching members:', error);
    return;
  }

  console.log(`Fetched ${members.length} members. Generating styled HTML...`);

  // Categorize
  const admin = members.filter(m => m.member_id === 'UDAAN-000');
  const mentors = members.filter(m => m.role === 'Mentor');
  const councilIds = ['UDAAN-2001', 'UDAAN-2021', 'UDAAN-2015', 'UDAAN-2011', 'UDAAN-2009', 'UDAAN-2004', 'UDAAN-2022', 'UDAAN-2017', 'UDAAN-2019'];
  const council = councilIds.map(id => members.find(m => m.member_id === id)).filter(Boolean);
  const year4 = members.filter(m => m.year === 4);
  const year3Others = members.filter(m => m.year === 3 && !councilIds.includes(m.member_id));
  const year2 = members.filter(m => m.year === 2);

  const renderTable = (rows) => {
    return `
      <table>
        <thead>
          <tr>
            <th style="width: 14%;">User ID</th>
            <th style="width: 23%;">Name</th>
            <th style="width: 18%;">Role</th>
            <th style="width: 22%;">Post / Designation</th>
            <th style="width: 13%;">Division</th>
            <th style="width: 10%; text-align: center;">Clearance</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((m, idx) => {
            const details = getMemberDetails(m);
            return `
              <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
                <td class="mono font-bold">${m.member_id}</td>
                <td class="name">${formatName(m.name)}</td>
                <td class="role-cell font-semibold text-slate-700">${details.role}</td>
                <td>${getPostBadge(details.post, details.role)}</td>
                <td class="division">${cleanDivisions(m.division)}</td>
                <td class="text-center">${getClearanceBadge(m.clearance)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UDAAN Club - Complete Member Roster & Directory</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 12mm 14mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      font-size: 10.5px;
      line-height: 1.35;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title-group h1 {
      font-size: 19px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .title-group p {
      font-size: 10.5px;
      color: #475569;
      margin: 0;
      font-weight: 500;
    }
    .meta-group {
      text-align: right;
      font-size: 9.5px;
      color: #475569;
    }
    .meta-group strong {
      color: #0f172a;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      text-align: center;
    }
    .summary-card .val {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .summary-card .lbl {
      font-size: 8.5px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    .notice-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
    }
    .notice-box .col {
      flex: 1;
    }
    .notice-box h4 {
      margin: 0 0 2px 0;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #15803d;
      font-weight: 700;
    }
    .notice-box p {
      margin: 0;
      font-size: 9.5px;
      color: #334155;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 14px 0 6px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title span.count {
      font-size: 9.5px;
      font-weight: 700;
      background: #e2e8f0;
      color: #334155;
      padding: 1.5px 7px;
      border-radius: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 9.5px;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 5px 7px;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 4.5px 7px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tr.even {
      background-color: #ffffff;
    }
    tr.odd {
      background-color: #f8fafc;
    }
    tr {
      page-break-inside: avoid;
    }
    .name {
      font-weight: 700;
      color: #0f172a;
    }
    .role-cell {
      color: #334155;
    }
    .mono {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 9px;
      color: #0f172a;
      letter-spacing: 0.2px;
    }
    .division {
      color: #475569;
      font-size: 9px;
    }
    .text-center {
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 1.5px 5.5px;
      border-radius: 3px;
      font-size: 8.5px;
      font-weight: 600;
      white-space: nowrap;
    }
    .badge-gold {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .badge-cyan {
      background: #cffafe;
      color: #155e75;
      border: 1px solid #a5f3fc;
    }
    .badge-purple {
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #e9d5ff;
    }
    .badge-blue {
      background: #e0e7ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
    }
    .badge-red {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .badge-gray {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .page-break {
      page-break-before: always;
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 8px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 3px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="title-group">
      <h1>UDAAN Club &bull; NIT Rourkela</h1>
      <p>Official Aero-Modelling & Autonomous Systems Club &bull; Master Member Directory</p>
    </div>
    <div class="meta-group">
      <div>Total Roster: <strong>${members.length} Members</strong></div>
      <div>Session: <strong>2025&ndash;2026 Academic Year</strong></div>
      <div>Status: <strong>All Approved (Clean Roster)</strong></div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="val">${members.length}</div>
      <div class="lbl">Total Members</div>
    </div>
    <div class="summary-card">
      <div class="val">${council.length}</div>
      <div class="lbl">Executive Council</div>
    </div>
    <div class="summary-card">
      <div class="val">${year4.length}</div>
      <div class="lbl">4th Year Seniors</div>
    </div>
    <div class="summary-card">
      <div class="val">${year3Others.length}</div>
      <div class="lbl">3rd Year Members</div>
    </div>
    <div class="summary-card">
      <div class="val">${year2.length}</div>
      <div class="lbl">2nd Year Members</div>
    </div>
  </div>

  <div class="notice-box">
    <div class="col">
      <h4>Portal Login & Authentication</h4>
      <p><strong>URL:</strong> https://udaan-nitr.vercel.app/#/team-login (or localhost:3000)</p>
      <p><strong>Login ID:</strong> Member's designated User ID (e.g. UDAAN-2001) or email address</p>
    </div>
    <div class="col">
      <h4>First-Login Password Policy</h4>
      <p><strong>Super Admin (UDAAN-000):</strong> Initial temporary password <code>Admin@2026</code></p>
      <p><strong>All Members & Council Leads:</strong> Initial temporary password <code>Udaan@2026</code></p>
      <p><em>*All accounts must update password upon their first login before entering flight deck.</em></p>
    </div>
  </div>

  <!-- SECTION 1: EXECUTIVE COUNCIL LEADERSHIP -->
  <div class="section-title">
    <span>1. Executive Council Leadership (Clearance Level 5)</span>
    <span class="count">${council.length} Leads</span>
  </div>
  ${renderTable(council)}

  <!-- SECTION 2: MENTORS & ADMINISTRATION -->
  <div class="section-title">
    <span>2. Mentors & Super Administration</span>
    <span class="count">${mentors.length + admin.length} Accounts</span>
  </div>
  ${renderTable([...admin, ...mentors])}

  <!-- SECTION 3: 4TH YEAR SENIOR MEMBERS -->
  <div class="section-title">
    <span>3. 4th Year Senior Members (Clearance Level 4)</span>
    <span class="count">${year4.length} Members</span>
  </div>
  ${renderTable(year4)}

  <div class="page-break"></div>

  <!-- SECTION 4: 3RD YEAR CORE MEMBERS -->
  <div class="section-title">
    <span>4. 3rd Year Core Members (Clearance Level 3)</span>
    <span class="count">${year3Others.length} Members</span>
  </div>
  ${renderTable(year3Others)}

  <!-- SECTION 5: 2ND YEAR MEMBERS -->
  <div class="section-title">
    <span>5. 2nd Year Members (Batch Inductees)</span>
    <span class="count">${year2.length} Members</span>
  </div>
  ${renderTable(year2)}

</body>
</html>`;

  const htmlPath = path.resolve('scratch_roster.html');
  const pdfPath = path.resolve('UDAAN_Club_Members_Roster.pdf');
  const publicPdfPath = path.resolve('public/UDAAN_Club_Members_Roster.pdf');

  fs.writeFileSync(htmlPath, html);
  console.log(`Saved HTML preview to ${htmlPath}`);

  console.log('Rendering PDF via Headless Chrome...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  
  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(pdfPath)) {
    fs.copyFileSync(pdfPath, publicPdfPath);
    const stats = fs.statSync(pdfPath);
    console.log(`\nSuccessfully created PDF: ${pdfPath}`);
    console.log(`Copied to public folder: ${publicPdfPath}`);
    console.log(`File Size: ${(stats.size / 1024).toFixed(1)} KB`);
  } else {
    console.error('Failed to generate PDF');
  }
}

generatePDF();
