<div align="center">

# ✈️ UDAAN &bull; Aero-Modelling & Autonomous Systems Club
### National Institute of Technology, Rourkela (NIT Rourkela)

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

**Official Web Application &bull; Digital Flight Deck &bull; Candidate Induction Portal &bull; Roster Management**

[Live Website](https://udaan-nitr.vercel.app/) &bull; [Team Portal](https://udaan-nitr.vercel.app/#/team-login) &bull; [Join Inductions](https://udaan-nitr.vercel.app/#/join) &bull; [Official Member Roster](https://udaan-nitr.vercel.app/UDAAN_Club_Members_Roster.pdf)

</div>

---

## 📖 Overview

The **UDAAN Web Application** is the mission-critical digital platform for the **UDAAN Aero-Modelling Club** at NIT Rourkela. Built with cutting-edge web technologies, real-time reactive PostgreSQL database integration, and high-security role-based access control, the system powers:

1. **Public Showcase & Aeromodelling Exhibition**: Immersive flight aerodynamics, interactive 3D aircraft models, event schedules, and team roster.
2. **Induction Drive & Candidate Evaluation System (`/join`, `/induction-portal`)**: Two-stage recruitment workflow with interest track selection, online technical assessments, assignment uploads, and live evaluation scoring.
3. **Flight Deck & Team Member Portal (`/team-login`)**: Central command center providing digital ID cards with verifiable QR codes, division-filtered task assignment, attendance logs, and profile management.
4. **Executive Council Administration (Clearance Levels 1–9)**: Role-based permissions allowing council leads and administrators to manage members, review inductions, and assign technical tasks.

---

## 🛸 Technical Divisions & Subsystems

The club is organized into 6 specialized divisions:

| Division | Icon | Focus Areas |
| :--- | :---: | :--- |
| **Drone Subsystem** | ⬡ | Multi-rotors, autonomous navigation, PX4/ArduPilot avionics, computer vision payload delivery. |
| **RC Plane Subsystem** | ✈ | Fixed-wing aircraft, aerofoils, balsa/composite fabrication, high-speed aerodynamic flight. |
| **Rocketry Subsystem** | 🚀 | Solid rocket propulsion, trajectory telemetry, aerodynamic nose cones, recovery parachutes. |
| **Creative Division** | 🎨 | Visual design, 3D modeling, merchandise, event branding, multimedia production. |
| **Web Dev Division** | 💻 | Full-stack web infrastructure, flight telemetry dashboards, digital portal development, API services. |
| **Management Team** | 💼 | Sponsorship procurement, logistics, event coordination, institutional public relations. |

---

## 🔐 Security & Clearance Hierarchy

The platform implements strict **Row Level Security (RLS)** in PostgreSQL and client-side access control:

| Clearance | Designation | Key Capabilities |
| :---: | :--- | :--- |
| **Level 9** | **Super Admin (`UDAAN-000`)** | System root access, database migrations, master password resets, emergency overrides. |
| **Level 5** | **Executive Council Leads** | President, Vice President, Secretary, Treasurer, Subsystem Leads. Task assignments, member edits, induction approvals. |
| **Level 4** | **Senior Members / Mentors** | 4th-year seniors and alumni mentors. Advisory privileges, technical task review, digital badge. |
| **Level 3** | **Core Members** | 3rd-year technical cohort. Project coordination, attendance logging, division workflows. |
| **Level 2** | **Technical Members** | 2nd-year inducted batch. Task submissions, profile configuration, division join requests. |
| **Level 1** | **Provisional Inductees** | Stage 2 candidates undergoing evaluation, online test, and project submissions. |

### First-Time Login Password Policy
All accounts are provisioned with temporary default credentials and **must change their password on their first login** before accessing the flight deck:
- **Super Admin (`UDAAN-000`)**: Temporary default `SuperAdmin@2026`
- **All Members & Council Leads**: Temporary default `Udaan@2026`
- **Enforcement**: Passwords must be &ge;6 characters, cannot match temporary defaults, and are securely hashed using `bcrypt` (10 rounds).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
- **3D Graphics & Canvas**: Three.js, React Three Fiber, GLTF/GLB models
- **Database & Storage**: Supabase (PostgreSQL 15), Supabase Storage (Member Photos)
- **Authentication**: Custom Bcrypt credential verification + RLS session tokens
- **Email Dispatch**: Google Apps Script API integration (automated verification codes & credential delivery)
- **Document Engine**: Headless Chrome PDF generation (`scripts/generate_roster_pdf.cjs`)
- **Build & Bundler**: Vite 6, Rollup

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nitrudaan/Website.git
   cd "Udaan Web Final"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase project credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_EMAIL_API_URL=https://script.google.com/macros/s/.../exec
   VITE_EMAIL_API_TOKEN=your-secure-token
   ```

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The site will be available at `http://localhost:3000`.

---

## 📁 Repository Structure

```
├── App.tsx                     # Main application layout, hero section, council cards
├── components/                 # Reusable UI components (3D scene, tilt, diagrams)
│   ├── QuantumScene.tsx        # Interactive 3D aeromodelling flight canvas
│   └── useDeviceTilt.tsx       # Gyroscope & accelerometer perspective hook
├── pages/                      # Application route pages
│   ├── TeamLogin.tsx           # Flight Deck member portal & admin control panel
│   ├── JoinCorps.tsx           # Candidate induction registration form
│   ├── InductionLogin.tsx      # Stage 2 candidate evaluation assessment login
│   └── Register.tsx            # Flagship event guest registration
├── utils/                      # Helper libraries & integrations
│   ├── supabase.ts             # Supabase PostgreSQL client & query functions
│   ├── security.ts             # Password hashing & sanitization helpers
│   ├── email.ts                # Google Apps Script dispatch client
│   └── formatters.ts           # String & name formatting utilities
├── db/                         # PostgreSQL SQL schemas & migrations
│   ├── setup.sql               # Base database tables and indices
│   ├── secure_rls.sql          # Row Level Security access policies
│   ├── bulk_reset_passwords.sql# Migration for forced first-login password changes
│   └── all_members_roster.md   # Current active member directory documentation
├── scripts/                    # Maintenance & utility scripts
│   ├── generate_roster_pdf.cjs # Headless Chrome official roster PDF generator
│   └── Code.gs                 # Google Apps Script email webhook backend
├── public/                     # Static production assets
│   ├── council/                # Executive council portrait photographs
│   ├── tasks/                  # Division induction task briefs (.docx)
│   └── UDAAN_Club_Members_Roster.pdf # Official downloadable member directory
├── UDAAN_Club_Members_Roster.pdf # Root copy of official member directory PDF
└── vite.config.ts              # Vite build configuration
```

---

## 📄 Generating the Official PDF Roster

To regenerate the official PDF roster ([`UDAAN_Club_Members_Roster.pdf`](UDAAN_Club_Members_Roster.pdf)):

```bash
node scripts/generate_roster_pdf.cjs
```
This script queries active approved members directly from Supabase, styles the layout using print CSS, and renders the PDF via Headless Google Chrome into both the root directory and `public/`.

---

## 🚢 Building & Deployment

### Production Build
```bash
npm run build
```
Generates minified, tree-shaken static assets inside `dist/`.

### Deployment
The project is configured for instant deployment on [Vercel](https://vercel.com):
```bash
npm run build
vercel --prod
```

---

## 🛡️ License

This project is licensed under the **Apache-2.0 License**. See the [LICENSE](LICENSE) file for details.

&copy; 2026 **UDAAN Aeromodelling Club, National Institute of Technology Rourkela**. All rights reserved.
