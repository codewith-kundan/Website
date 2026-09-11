# Udaan Website Architecture

This document outlines the architecture of the Udaan website, detailing the technology stack, project structure, core systems, and design patterns. It serves as a blueprint for understanding the current implementation and can be used as a reference for building a new website based on this architecture.

## 1. Technology Stack

### Frontend Core
*   **Framework**: React 18 with Vite (for fast build and Hot Module Replacement).
*   **Language**: TypeScript for strict type-checking and improved developer experience.
*   **Routing**: React Router DOM (v7) for client-side routing.

### UI & Styling
*   **Styling**: Tailwind CSS (via utility classes) combined with custom CSS in `index.css` for highly specific styling and design tokens.
*   **Animations**: Framer Motion is used extensively for scroll-linked animations, page transitions, and complex interactive effects.
*   **Smooth Scrolling**: Lenis provides smooth scroll behavior across the site.
*   **Icons**: Lucide React for consistent, lightweight SVG icons.
*   **3D Graphics**: Three.js integrated via `@react-three/fiber` and `@react-three/drei` for rendering interactive 3D elements (e.g., aircraft, rockets) in the background.

### Backend & Database
*   **Database & Auth**: Supabase (PostgreSQL) acts as the primary backend, handling user authentication, role-based access control, and data storage.
*   **Email**: Custom email utilities (`utils/email.ts`) likely integrated with a third-party email provider via SMTP.
*   **Security**: `bcryptjs` is used for manual password hashing when required.

---

## 2. Project Structure

The codebase is organized into logical directories based on functionality:

*   **`App.tsx`**: The main entry point and landing page. It configures the global Contexts (like AudioContext), defines the application routes, and houses the primary landing page sections (Hero, Council, Achievements).
*   **`pages/`**: Contains top-level route components.
    *   `JoinCorps.tsx`: Information page for prospective members.
    *   `Register.tsx`: The multi-step registration form for new applicants.
    *   `TeamLogin.tsx`: The internal portal/dashboard for members and admins, featuring complex role-based views.
    *   `InductionLogin.tsx`: Portal specifically for inductees/candidates to track tasks.
*   **`components/`**: Reusable UI and functional components.
    *   `QuantumScene.tsx`: Handles the Three.js 3D canvas and models.
    *   `Diagrams.tsx`: SVG-based technical diagrams and interactive UI components.
*   **`utils/`**: Core logic and external service integrations.
    *   `supabase.ts`: Supabase client initialization, database typings, and data fetching/mutation wrappers.
    *   `email.ts` & `email-templates.ts`: Email sending logic and HTML templates.
    *   `security.ts`: Custom security measures (e.g., rate limiting).
*   **`types.ts` & `global.d.ts`**: Global TypeScript interfaces and declarations.

---

## 3. Core Systems & Design Patterns

### 3.1. Routing & State Management
*   **Client-Side Routing**: Handled entirely by `<Routes>` in `App.tsx`.
*   **State Management**: Mostly relies on React's built-in hooks (`useState`, `useEffect`). Global states (like the background music toggle) are managed using React Context (`AudioContext`).

### 3.2. Role-Based Access Control (RBAC)
The architecture uses a Clearance Level system (defined in `utils/supabase.ts`) to manage permissions within the internal portals (`TeamLogin.tsx`):
*   **Clearance 5**: Council Members / Admins.
*   **Clearance 3**: Regular Members.
*   **Clearance 2**: First Year / Approved Provisional Members.
*   Roles are tied to specific internal views, enabling dynamic rendering of dashboards based on the logged-in user's clearance.

### 3.3. Interactive & 3D Design
The website prioritizes a highly interactive, "premium" feel:
*   **Scroll-Driven Animations**: Uses Framer Motion's `useScroll` and `useTransform` to animate elements based on the user's scroll position (Parallax backgrounds, fading text).
*   **3D Backgrounds**: `<HeroScene>`, `<HangarScene>`, and `<CombatJetScene>` are rendered behind the content using `react-three-fiber`, providing a dynamic aerospace theme.
*   **Custom Cursors & Magnetic Effects**: Custom mouse interactions are implemented (with fallbacks for touch devices) to enhance the technical/HUD feel of the site.

### 3.4. Database Interaction Layer
*   The `utils/supabase.ts` file acts as an abstraction layer for the database. Instead of making raw Supabase calls directly in components, the components call wrapper functions (e.g., `getMembers()`, `loginMember()`).
*   This pattern ensures that all database interactions are typed and centralized, making it easier to swap out the backend or modify schemas in the future.

---

## 4. How to Use This Architecture for a New Website

If you are building a new website based on this architecture, follow these steps:

1.  **Scaffold**: Initialize a Vite + React + TypeScript project. Install the core dependencies (`framer-motion`, `lucide-react`, `lenis`, `react-router-dom`).
2.  **Define the Design System**: Copy `index.css` to inherit the custom color palette (e.g., `nation-black`, `nation-secondary`) and utility classes.
3.  **Setup Backend**: Initialize a Supabase project. Recreate the tables (`members`, `applicants`, etc.) based on the TypeScript interfaces found in `utils/supabase.ts`.
4.  **Copy Utilities**: Port over the `utils/` directory. Ensure `supabase.ts` has the correct Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
5.  **Build Components**: Start porting the UI components. You can reuse the interactive wrappers (like the `<Magnetic>` component or `<GlitchText>` from `App.tsx`) to maintain the dynamic feel.
6.  **Rebuild Pages**: Construct the routing structure in `App.tsx` and build out the specific views in the `pages/` directory.
