# Syrian Energy Project Tracker

**Syrian Energy Project Tracker** is a bilingual Arabic/English web application for tracking energy projects across Syria.

The application is part of the Syrian Renewables platform and is designed to provide a structured, source-based, mobile-friendly dashboard for renewable energy, electricity infrastructure, grid rehabilitation, storage, hydro, wind, solar, and other energy-related projects.

## Project Goals

- Track energy projects across Syrian governorates.
- Provide bilingual Arabic and English project information.
- Display projects as professional cards with detailed views.
- Show project locations on an interactive map.
- Provide a future-ready admin dashboard.
- Start with GitHub-hosted JSON data, then migrate later to Firebase.
- Deploy the public application through GitHub Pages.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Build Tool | Vite |
| Language | TypeScript |
| Styling | CSS |
| Map | Leaflet + OpenStreetMap |
| Initial Data Layer | JSON files |
| Future Database | Firebase Firestore |
| Future Auth | Firebase Auth |
| Hosting | GitHub Pages |
| Deployment | GitHub Actions |

## Main Features

- Arabic RTL and English LTR support.
- Light and dark modes.
- Glassmorphism-style UI.
- Mobile-first responsive design.
- Project cards and project detail modal.
- Interactive map for project locations.
- Search and filters by governorate, energy type, project status, and project type.
- Timeline section for project updates.
- Source links and shareable project URLs.
- Admin dashboard scaffold for future Firebase integration.

## Project Structure

```txt
syrian-energy-project-tracker-june-2026/
├── data/
│   ├── projects.json
│   ├── project-updates.json
│   └── metadata.json
├── src/
│   ├── admin/
│   ├── components/
│   ├── data-adapters/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
├── .github/workflows/deploy.yml
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Data Model

The MVP uses JSON files in the `/data` directory. The application reads through a data adapter layer, so the UI can later migrate from JSON to Firebase without a full rewrite.

## Future Firebase Migration

The app is intentionally structured around a `ProjectAdapter` interface. The current implementation uses `JsonProjectAdapter`. Later, a `FirebaseProjectAdapter` can replace it to enable:

- Admin login.
- Real database writes.
- Multiple editors.
- Audit logs.
- Image uploads.
- Project approval workflow.

## Brand Colors

| Use | Color |
|---|---|
| Primary | `#217A8D` |
| Text | `#232B2B` |

## Owner

This project is developed for **Syrian Renewables**.