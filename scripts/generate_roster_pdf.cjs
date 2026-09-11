const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

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
  const councilIds = ['UDAAN-2001', 'UDAAN-2021', 'UDAAN-2015', 'UDAAN-2011', 'UDAAN-2009', 'UDAAN-2022', 'UDAAN-2004', 'UDAAN-2017', 'UDAAN-2019'];
  const council = councilIds.map(id => members.find(m => m.member_id === id)).filter(Boolean);
  const year4 = members.filter(m => m.year === 4);
  const year3Others = members.filter(m => m.year === 3 && !councilIds.includes(m.member_id));
  const year2 = members.filter(m => m.year === 2);

  const renderTable = (rows, showStatus = true) => {
    return `
      <table>
        <thead>
          <tr>
            <th style="width: 18%;">Member ID</th>
            <th style="width: 27%;">Name</th>
            <th style="width: 25%;">Role</th>
            <th style="width: 15%;">Division</th>
            <th style="width: 8%; text-align: center;">Year</th>
            ${showStatus ? '<th style="width: 12%; text-align: center;">Status</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${rows.map((m, idx) => `
            <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
              <td class="mono font-bold">${m.member_id}</td>
              <td class="name">${m.name || '-'}</td>
              <td><span class="badge ${getBadgeClass(m.role, m.clearance)}">${m.role || '-'}</span></td>
              <td class="division">${m.division || '-'}</td>
              <td class="text-center font-bold">${m.year != null ? m.year : '-'}</td>
              ${showStatus ? `<td class="text-center"><span class="status-pill status-${m.status}">${m.status || '-'}</span></td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  const getBadgeClass = (role, clearance) => {
    const r = (role || '').toLowerCase();
    if (r.includes('president') || r.includes('secretary') || r.includes('treasurer')) return 'badge-gold';
    if (r.includes('lead')) return 'badge-cyan';
    if (r.includes('mentor')) return 'badge-purple';
    if (r.includes('senior')) return 'badge-blue';
    return 'badge-gray';
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>UDAAN Club - Complete Member Roster</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1a202c;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }
    .header {
      border-bottom: 2.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title-group h1 {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .title-group p {
      font-size: 11px;
      color: #64748b;
      margin: 0;
      font-weight: 500;
    }
    .meta-group {
      text-align: right;
      font-size: 10px;
      color: #475569;
    }
    .meta-group strong {
      color: #0f172a;
    }
    .notice-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }
    .notice-box .col {
      flex: 1;
    }
    .notice-box h4 {
      margin: 0 0 4px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e3a8a;
    }
    .notice-box p {
      margin: 0;
      font-size: 10px;
      color: #475569;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 20px 0 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title span.count {
      font-size: 10px;
      font-weight: 600;
      background: #e2e8f0;
      color: #334155;
      padding: 2px 8px;
      border-radius: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 10px;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.5px;
    }
    td {
      padding: 5px 8px;
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
      font-weight: 600;
      color: #0f172a;
    }
    .mono {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 9.5px;
      color: #1e293b;
    }
    .division {
      color: #475569;
      text-transform: capitalize;
    }
    .text-center {
      text-align: center;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 600;
      text-transform: capitalize;
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
    .badge-gray {
      background: #f1f5f9;
      color: #475569;
    }
    .status-pill {
      display: inline-block;
      padding: 1.5px 6px;
      border-radius: 10px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .status-approved {
      background: #dcfce7;
      color: #166534;
    }
    .status-provisional {
      background: #fef9c3;
      color: #854d0e;
    }
    .status-rejected {
      background: #fee2e2;
      color: #991b1b;
    }
    .page-break {
      page-break-before: always;
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      font-size: 9px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
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
      <div>Session: <strong>2026 Academic Year</strong></div>
      <div>Generated: <strong>${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
    </div>
  </div>

  <div class="notice-box">
    <div class="col">
      <h4>Portal Login Guidelines</h4>
      <p><strong>URL:</strong> http://localhost:3000/#/team-login</p>
      <p><strong>Username:</strong> Member's designated UDAAN-XXXX ID or registered email</p>
    </div>
    <div class="col">
      <h4>Password Policy & Security</h4>
      <p><strong>Super Admin (UDAAN-000):</strong> Admin@2026</p>
      <p><strong>All Members & Mentors:</strong> Initial password Udaan@2026 (Forced change on first login)</p>
    </div>
  </div>

  <!-- SECTION 1: COUNCIL LEADERSHIP -->
  <div class="section-title">
    <span>1. Executive Council (Clearance Level 5)</span>
    <span class="count">${council.length} Leads</span>
  </div>
  ${renderTable(council, false)}

  <!-- SECTION 2: MENTORS & ADMINISTRATION -->
  <div class="section-title">
    <span>2. Mentors & Super Administration</span>
    <span class="count">${mentors.length + admin.length} Members</span>
  </div>
  ${renderTable([...admin, ...mentors], false)}

  <!-- SECTION 3: 4TH YEAR SENIOR MEMBERS -->
  <div class="section-title">
    <span>3. 4th Year Senior Members</span>
    <span class="count">${year4.length} Members</span>
  </div>
  ${renderTable(year4, false)}

  <div class="page-break"></div>

  <!-- SECTION 4: 3RD YEAR MEMBERS -->
  <div class="section-title">
    <span>4. 3rd Year Members</span>
    <span class="count">${year3Others.length} Members</span>
  </div>
  ${renderTable(year3Others, false)}

  <!-- SECTION 5: 2ND YEAR MEMBERS -->
  <div class="section-title">
    <span>5. 2nd Year Members (Batch Inductees)</span>
    <span class="count">${year2.length} Members</span>
  </div>
  ${renderTable(year2, true)}

</body>
</html>`;

  const htmlPath = path.resolve('scratch_roster.html');
  const pdfPath = path.resolve('UDAAN_Club_Members_Roster.pdf');

  fs.writeFileSync(htmlPath, html);
  console.log(`Saved HTML preview to ${htmlPath}`);

  console.log('Rendering PDF via Headless Chrome...');
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
  
  execSync(cmd, { stdio: 'inherit' });

  if (fs.existsSync(pdfPath)) {
    const stats = fs.statSync(pdfPath);
    console.log(`\nSuccessfully created PDF: ${pdfPath}`);
    console.log(`File Size: ${(stats.size / 1024).toFixed(1)} KB`);
  } else {
    console.error('Failed to generate PDF');
  }
}

generatePDF();
