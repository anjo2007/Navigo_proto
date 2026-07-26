# Navigo — Mobility OS

Navigo is an AI-powered urban mobility platform that helps users discover, compare, and navigate multi-modal transit routes. It combines real-time map visualization, crowd-sourced occupancy data, and a conversational travel assistant to make getting around easier.

## Features

- **Multi-modal route planning** — compare routes across Walk, Bus, Train, Auto, Taxi, and Ferry
- **Interactive map** — visualize routes and stops using Leaflet
- **AI travel assistant** — chat-based help powered by the Gemini API
- **Crowd-sourced reporting** — submit and view real-time occupancy and incident reports
- **Role-based access** — distinct roles for users, contributors, fleet managers, and admins
- **Green points & leaderboard** — earn points for eco-friendly travel and community contributions
- **Admin dashboard** — manage routes, users, and crowd reports

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| Maps | Leaflet |
| AI | Google Gemini API (`@google/genai`) |
| Backend / Auth | Supabase |

## Getting Started

**Prerequisites:** Node.js (v18+)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**

   Create a `.env.local` file in the project root and add:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
├── components/        # React UI components
├── context/           # React context providers (e.g. ToastContext)
├── hooks/             # Custom React hooks
├── services/          # API & data service layer (Gemini, Supabase, map)
├── types.ts           # Shared TypeScript types
├── App.tsx            # Root application component
└── index.tsx          # Entry point
```

## Contributing

Contributions, bug reports, and feature requests are welcome. Please open an issue or submit a pull request.
