const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

// Default bcrypt hash for Udaan@2026
const DEFAULT_PASSWORD_HASH = '$2a$10$i5BparPCu7mODbq8ld6o1OQFzB6TiLfLCyM8l20f1fmo.FVf5T/Sm';

const SOPHOMORES = [
  // RC PLANE
  {
    member_id: 'UDAAN-1019',
    name: 'Suryakanta Das',
    division: 'RC Plane, Drone',
    email: 'bdas04056@gmail.com',
    roll_no: '125ME0024',
    department: 'Mechanical Engineering (ME)'
  },
  {
    member_id: 'UDAAN-1105',
    name: 'Prithvi Ravikiran',
    division: 'RC Plane',
    email: 'prithvi.ravikiran@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1015',
    name: 'Dev Mehta',
    division: 'RC Plane',
    email: 'devharmehta@gmail.com',
    roll_no: '125ME0028',
    department: 'Mechanical Engineering (ME)'
  },
  {
    member_id: 'UDAAN-1079',
    name: 'Muhammed Faheem',
    division: 'RC Plane, Rocketry',
    email: 'pmmuhamedfaheem@gmail.com',
    roll_no: '125ME0067',
    department: 'Mechanical Engineering (ME)',
    isExisting: true
  },

  // ROCKET
  {
    member_id: 'UDAAN-1106',
    name: 'Sakti Prashad Ratha',
    division: 'Rocketry, Web Dev',
    email: 'sakti.prasad@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1107',
    name: 'Arush Raj',
    division: 'Rocketry',
    email: 'arush.raj@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1108',
    name: 'Pakshalika Routray',
    division: 'Rocketry',
    email: 'pakshalika.routray@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1109',
    name: 'Punyanshu Kar',
    division: 'Rocketry',
    email: 'punyanshu.kar@udaannitr.in',
    roll_no: null,
    department: null
  },

  // DRONE
  {
    member_id: 'UDAAN-1110',
    name: 'Deepdyuti Basumatary',
    division: 'Drone',
    email: 'deepdyuti.basumatary@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1093',
    name: 'Hariprasath U',
    division: 'Drone',
    email: 'hariprasathhby@gmail.com',
    roll_no: '125MM0009',
    department: 'Metallurgical and Materials Engineering (MM)'
  },
  {
    member_id: 'UDAAN-1073',
    name: 'Kousigan B K',
    division: 'Drone',
    email: 'kousigan14@gmail.com',
    roll_no: '125ME0113',
    department: 'Mechanical Engineering (ME)'
  },
  {
    member_id: 'UDAAN-1111',
    name: 'Eashwar S Amar',
    division: 'Drone',
    email: 'eashwar.amar@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1112',
    name: 'Sarenya Samapika',
    division: 'Drone',
    email: 'sarenya.samapika@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1113',
    name: 'Yashmit Purohit',
    division: 'Drone',
    email: 'yashmit.purohit@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1114',
    name: 'Mani Shreevastav',
    division: 'Drone',
    email: 'mani.shreevastav@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1115',
    name: 'Mehul Bhatia',
    division: 'Drone',
    email: 'mehul.bhatia@udaannitr.in',
    roll_no: null,
    department: null
  },

  // CREATIVE
  {
    member_id: 'UDAAN-1116',
    name: 'Prince Chaurasiya',
    division: 'Creative',
    email: 'prince.chaurasiya@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1117',
    name: 'Rohan Deo',
    division: 'Creative',
    email: 'rohan.deo@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1118',
    name: 'Ridheesha Kumar',
    division: 'Creative',
    email: 'ridheesha.kumar@udaannitr.in',
    roll_no: null,
    department: null
  },

  // WEB DEV
  {
    member_id: 'UDAAN-1119',
    name: 'Sidharth Kumar Singh',
    division: 'Web Dev',
    email: 'sidharth.singh@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1120',
    name: 'Ashab Shanavas',
    division: 'Web Dev',
    email: 'ashab.shanavas@udaannitr.in',
    roll_no: null,
    department: null
  },
  {
    member_id: 'UDAAN-1121',
    name: 'Kundan Prasad Raut',
    division: 'Web Dev',
    email: 'kundan.raut@udaannitr.in',
    roll_no: null,
    department: null
  }
];

const DIVISION_MAP = {
  'Drone': 'drone_members',
  'RC Plane': 'rc_plane_members',
  'Rocketry': 'rocketry_members',
  'Creative': 'creative_members',
  'Web Dev': 'creative_members',
  'Management': 'management_members'
};

async function addSophomores() {
  console.log('--- Adding Sophomores (2nd Year Members) to Database ---');
  console.log(`Total sophomores to process: ${SOPHOMORES.length}`);

  for (const s of SOPHOMORES) {
    if (s.isExisting) {
      // Update existing record
      console.log(`Updating existing member ${s.member_id} (${s.name})...`);
      const { error } = await supabase
        .from('members')
        .update({
          name: s.name,
          division: s.division,
          role: 'Member',
          year: 2,
          clearance: 2,
          status: 'approved'
        })
        .eq('member_id', s.member_id);

      if (error) console.error(`Failed to update ${s.member_id}:`, error.message);
      else console.log(`✓ Updated ${s.member_id}: ${s.name} -> ${s.division}`);
    } else {
      // Upsert new member
      console.log(`Adding new member ${s.member_id} (${s.name})...`);
      const memberRecord = {
        member_id: s.member_id,
        name: s.name,
        email: s.email,
        password: DEFAULT_PASSWORD_HASH,
        role: 'Member',
        division: s.division,
        clearance: 2,
        status: 'approved',
        year: 2,
        roll_no: s.roll_no,
        department: s.department,
        email_verified: true,
        is_inactive: false,
        added_by: 'UDAAN-001',
        joined_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('members')
        .upsert(memberRecord, { onConflict: 'member_id' });

      if (error) {
        console.error(`Failed to insert ${s.member_id} (${s.name}):`, error.message);
      } else {
        console.log(`✓ Inserted ${s.member_id}: ${s.name} (Year 2, Role: Member, Div: ${s.division})`);
      }
    }

    // Insert into division_members and division tables
    const divisions = s.division.split(',').map(d => d.trim());
    for (const div of divisions) {
      // 1. division_members table
      try {
        await supabase
          .from('division_members')
          .upsert({
            division_name: div,
            member_id: s.member_id,
            added_at: new Date().toISOString()
          }, { onConflict: 'division_name,member_id' });
      } catch (e) {
        // ignore conflict
      }

      // 2. individual division table
      const divTable = DIVISION_MAP[div];
      if (divTable) {
        try {
          await supabase
            .from(divTable)
            .upsert({
              member_id: s.member_id,
              added_at: new Date().toISOString()
            }, { onConflict: 'member_id' });
        } catch (e) {
          // ignore
        }
      }
    }
  }

  // Verification
  console.log('\n--- Verification ---');
  const { data: currentMembers } = await supabase
    .from('members')
    .select('member_id, name, role, division, year, clearance')
    .order('member_id');

  console.log(`Total members in database now: ${currentMembers.length}`);
  const added = currentMembers.filter(m => SOPHOMORES.some(s => s.member_id === m.member_id));
  console.log(`Sophomores verified in DB: ${added.length}/${SOPHOMORES.length}`);
  added.forEach(m => console.log(`  ${m.member_id} | ${m.name.padEnd(25)} | Year ${m.year} | Role: ${m.role.padEnd(10)} | ${m.division}`));
}

addSophomores().catch(console.error);
