# Navigo Mobility OS — Comprehensive Technical & Architectural Analysis Report

**Generated:** July 26, 2026  
**Target Repository:** `Navigo_proto-main`  
**System Type:** AI-Powered Multi-Modal Urban Mobility Platform  

---

## 1. Executive Summary

**Navigo — Mobility OS** is a modern, web-based urban mobility platform engineered to solve multi-modal route planning, real-time map visualization, crowdsourced transit occupancy reporting, and AI-assisted trip advisory. 

The application combines:
- **Generative AI (`gemini-3-flash-preview`)** for multi-modal journey synthesis, local business/transit place searching with live web grounding, and an inline conversational travel assistant ("Navi").
- **Interactive Geospatial Mapping (Leaflet + OSRM API)** for rendering interactive maps, dual tile layers (Street vs. Satellite), route snapping, and active step-by-step segment visualization.
- **Real-Time Data & Crowdsourcing (Supabase)** for live occupancy and incident reporting, real-time WebSocket subscriptions for controller verification, user profiling, trust scoring, and green points gamification.
- **Role-Based Access Control (RBAC)** supporting four distinct operational roles: Commuter (`user`), Scout (`contributor`), Fleet Manager (`fleet_mgr`), and Controller (`admin`).

---

## 2. Technical Stack & Dependencies

| Layer | Technology / Library | Version / Details |
| :--- | :--- | :--- |
| **Core Framework** | React | `^19.0.0` |
| **Language & Build Tool** | TypeScript, Vite | TypeScript `~5.6.2`, Vite `^6.0.3` |
| **Styling & Design** | Tailwind CSS, PostCSS, Autoprefixer | Tailwind `^3.4.16`, Custom Dark Theme Palette (`void`, `obsidian`, `mist`, `ash`, `neon`, `azure`, `coral`) |
| **Mapping & Routing** | Leaflet, OSRM Public API | Leaflet `^1.9.4`, OSRM `router.project-osrm.org/route/v1` |
| **Geocoding & Places** | Photon API | `photon.komoot.io` (OpenStreetMap-backed autocomplete) |
| **AI Engine** | Google Gen AI SDK (`@google/genai`) | `^1.20.0`, Model: `gemini-3-flash-preview` |
| **Database & Auth** | Supabase JS Client | `^2.39.0` (PostgreSQL + Realtime Channels + Auth) |
| **Hosting & Deployment** | Vercel | Single-Page Application (SPA) configuration in `vercel.json` |

---

## 3. System Architecture & File Structure

```
c:\Users\anjo2\OneDrive\Pictures\Documents\Navigo_proto-main
├── components/                  # React Component Library
│   ├── icons/                   # Custom SVG Map Markers & UI Icons
│   ├── AddBusModal.tsx          # Modal for community route/bus schedule contributions
│   ├── AdminDashboard.tsx       # Live controller dashboard for report validation & ingest
│   ├── Header.tsx               # Top navigation bar with action triggers & user badges
│   ├── JourneyView.tsx          # Step-by-step turn-by-turn navigation overlay
│   ├── LoadingSpinner.tsx       # Animated loading indicator with dynamic status text
│   ├── LocalResultsPanel.tsx    # Card drawer for nearby place discovery results
│   ├── LoginModal.tsx           # Authentication modal (Supabase Auth & Prototype bypass)
│   ├── MapInteractionOverlay.tsx# Map click listener helpers
│   ├── MapView.tsx              # Core Leaflet map component with OSRM polyline rendering
│   ├── OccupancyReporter.tsx    # Quick-report widget for transit occupancy levels
│   ├── PanelHandle.tsx          # Mobile drag handle for drawer interaction
│   ├── RouteCard.tsx            # Expandable journey card showing mode badges & segments
│   ├── RoutePlanner.tsx         # Central layout container managing search state & sub-views
│   ├── RouteResults.tsx         # List container for generated route options
│   ├── RouteSearchForm.tsx      # Origin/Destination input form with mode filters & preferences
│   ├── RouteSegment.tsx        # Segment card detail with schedule options & action links
│   ├── SetupModal.tsx          # Configuration prompt for missing API keys
│   ├── ThemeToggle.tsx         # UI theme state control
│   ├── TravelAssistant.tsx     # Floating chat assistant powered by Gemini 3 Flash
│   └── UserProfile.tsx          # User stats, Green Points, Trust score, Vault & Leaderboard
├── context/
│   └── ToastContext.tsx         # Global notification toast system provider
├── hooks/
│   ├── useDebounce.ts           # Input debouncing hook for location autocomplete
│   └── useWindowSize.ts         # Viewport size monitoring for responsive drawer behavior
├── services/
│   ├── databaseService.ts       # Supabase data layer, authentication, & local storage session
│   ├── geminiService.ts         # Google Gemini AI prompts, structured JSON schemas & search grounding
│   ├── mapService.ts            # OSRM road geometry fetching, map tile definitions & geometry cache
│   └── supabaseClient.ts        # Supabase client singleton initialization
├── App.tsx                      # Root application component & modal state routing
├── index.html                   # HTML entry point with meta viewport & styling resets
├── index.tsx                    # React DOM entry point
├── package.json                 # Dependency definitions and scripts
├── tsconfig.json                # TypeScript compiler configuration
├── types.ts                     # Master TypeScript interfaces, types & enums
└── vercel.json                  # SPA routing rewrite rule (`/* -> /index.html`)
```

---

## 4. Detailed Component & Feature Analysis

### 4.1. Multi-Modal Route Generation & Optimization (`RoutePlanner.tsx` & `geminiService.ts`)
- **Streaming & Schema Validation**: `streamRoutes` sends origin, destination, user traveler profile, mode exclusions, and preferences (walking tolerance: `low` | `medium` | `high`, priority: `cheapest` | `balanced` | `fastest`) to `gemini-3-flash-preview`.
- **Structured JSON Schema**: Gemini returns an array of 3 distinct `Route` objects categorized into:
  1. `TIME_EFFICIENT` (Fastest transit combinations)
  2. `BUDGET_FRIENDLY` (Cost-optimized public transit)
  3. `BALANCED` (Optimal blend of speed, cost, and comfort)
- **Supported Modes**: `WALK`, `BUS`, `TRAIN`, `AUTO`, `TAXI`, `FERRY`.

### 4.2. Interactive Map Engine (`MapView.tsx` & `mapService.ts`)
- **Leaflet Integration**: Uses React `useRef` to maintain a singleton Leaflet map instance without re-rendering flickers.
- **Road Geometry Snapping via OSRM**: When a route is expanded or navigated, `fetchRoadGeometry` queries OSRM (`router.project-osrm.org`) to convert straight-line coordinates into exact road polylines.
- **Caching Mechanism**: Memory cache (`geometryCache`) prevents repeated network hits for identical origin-destination segments.
- **Dual Map Tiles**:
  - **Street View**: CartoDB Voyager (`basemaps.cartocdn.com`)
  - **Satellite View**: Esri World Imagery (`server.arcgisonline.com`)
- **Dynamic Camera Control**: Automatically adjusts zoom and bounds (`map.flyToBounds`) when routes are selected or updated.

### 4.3. Real-Time Crowdsourcing & Gamification (`databaseService.ts` & `UserProfile.tsx`)
- **Occupancy Levels**: Users submit reports categorized into `MANY_SEATS`, `FEW_SEATS`, `STANDING_ONLY`, and `CRUSHED`.
- **Green Points Incentives**: Submitting a report automatically awards **+10 Green Points**, while submitting a new bus route awards **+50 Green Points**.
- **Trust & Credibility Score**: Profiles compute credibility percentages (e.g. 90%+ = *Elite Source*, 70%+ = *Trusted*, 50%+ = *Regular*).
- **Leaderboard**: Global ranking table highlighting top contributors in the Scout Network.
- **Offline Route Vault**: Users can save high-accuracy routes into local storage for quick access.

### 4.4. Controller (Admin) Dashboard (`AdminDashboard.tsx`)
- **Real-Time Data Stream**: Listens to live Supabase database insertions on `public:reports` using WebSocket subscriptions (`sb.channel('public:reports').on(...)`).
- **Data Validation Workflow**: Admins review pending crowd reports and accept (`APPROVED`) or reject (`REJECTED`) them with immediate database sync.
- **Live Notifications**: Triggers Toast notifications when new reports arrive in real-time.

### 4.5. AI Travel Assistant ("Navi") (`TravelAssistant.tsx` & `geminiService.ts`)
- Floating collapsible AI drawer.
- System prompt injects current trip context (origin, destination, selected route).
- Leverages **Google Search Grounding** (`tools: [{ googleSearch: {} }]`) to cite live sources for local travel warnings, transit schedules, and place reviews.

### 4.6. Nearby Places & Geocoding Search (`LocalResultsPanel.tsx` & `geminiService.ts`)
- Quick-filter categories: *Coffee, Fuel, EV Charging, Restrooms, Transit Hubs*.
- Uses Gemini grounding search to discover top 5 nearby locations with addresses, ratings, opening hours, and phone numbers.
- Integrated with OpenStreetMap Photon API for instant location autocompletion.

---

## 5. Database Schema & Data Models

### 5.1. TypeScript Core Types (`types.ts`)
```typescript
export enum TransportMode { WALK, BUS, TRAIN, AUTO, TAXI, FERRY }
export type UserRole = 'admin' | 'contributor' | 'user' | 'fleet_mgr';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  trustScore: number;
  greenPoints: number;
  isAmbassador: boolean;
}

export interface CrowdReport {
  id: string;
  userId: string;
  routeId?: string;
  type: 'OCCUPANCY' | 'TRAFFIC' | 'INCIDENT';
  level?: OccupancyLevel;
  location: Coordinate;
  timestamp: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}
```

### 5.2. Supabase PostgreSQL Tables

#### `profiles` Table
- `id` (uuid, PK, references `auth.users.id`)
- `email` (text)
- `full_name` (text)
- `country` (text)
- `role` (text: `'admin'` | `'contributor'` | `'user'` | `'fleet_mgr'`)
- `is_ambassador` (boolean)
- `trust_score` (integer)
- `green_points` (integer)

#### `reports` Table
- `id` (uuid, PK, default `gen_random_uuid()`)
- `user_id` (uuid, references `profiles.id`)
- `type` (text: `'OCCUPANCY'` | `'TRAFFIC'` | `'INCIDENT'` | `'NEW_ROUTE'`)
- `level` (text)
- `lat` (double precision)
- `lng` (double precision)
- `status` (text: `'PENDING'` | `'APPROVED'` | `'REJECTED'`)
- `created_at` (timestamp with time zone)

---

## 6. Authentication & Security Architecture

1. **Supabase Auth Integration**: Supports standard email/password authentication and profile creation.
2. **Prototype Auth Bypass**: Includes built-in prototype session accounts for zero-configuration testing:
   - `commuter@navigo.com` (Pass: `admin`) — Standard Commuter role.
   - `scout@navigo.com` (Pass: `admin`) — Contributor/Ambassador role.
3. **Environment Security**: Configured via `.env.local` for `VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` with fallback values in `supabaseClient.ts` for immediate sandbox deployment.

---

## 7. Key System Strengths & Recommendations

### Strengths
- **Resilient AI Schema Validation**: Structured JSON schema output prevents UI crashes from unstructured LLM responses.
- **Smooth Visual Performance**: Leaflet map instance decoupling prevents expensive React re-renders on map interaction.
- **Real-Time Responsiveness**: Supabase WebSockets enable live Controller verification without manual polling.
- **Glassmorphism Aesthetic**: Modern Tailwind UI tokens create a clean, responsive dark-mode mobile/desktop layout.

### Technical Recommendations for Future Phases
1. **API Key Security**: Move default Supabase keys and Gemini API invocations behind a serverless backend proxy (e.g., Vercel Serverless Functions / Supabase Edge Functions) to protect secrets from client exposure.
2. **Offline PWA Caching**: Integrate Service Workers (`vite-plugin-pwa`) to cache Leaflet tiles and OSRM route geometries offline.
3. **Bulk Data Ingestion Engine**: Implement CSV parsing backend for the Admin Dashboard's bulk route upload section.

---
*Report stored permanently in repository root as `APP_ANALYSIS_REPORT.md`.*
