# DriveReady – Mock Driving Test Companion

👉 **Live app:** https://hindol.github.io/drive-ready/

DriveReady delivers a Washington-focused mock driving test experience while laying the groundwork for additional US states. The current pilot is limited to Washington so every feature—from the mock exam roster to the pre-exam checklist—uses Washington driver guide data and MUTCD assets tuned for local accuracy.

## Tech Stack

- Vite + React + TypeScript
- Bootstrap 5 for layout and components

## Features

- **Hero & onboarding** – Washington-first messaging with state stats, hero CTA, and Clerk-powered admin auth (sign-in modal + user avatar on success).
- **Open-source nav link** – GitHub mark lives next to the other navbar anchors so learners can inspect or contribute to the repository without leaving the flow.
- **Mock Knowledge Test** – Adaptive question sampler (10-question attempts by default) with live score widget, progress bar, explanation drawer, and instant reference links to the Washington Driver Guide.
- **Smart Review (SRS)** – Anki-style queue that reorders due, new, and struggling cards; supports four rating buttons (Again/Hard/Good/Easy), explanation reveal, and session summaries with badge counts.
- **Daily practice habit** – Seven-day calendar snapshot that tracks whether you solved 10 questions each day, highlights today, and shows streak status plus progress bars.
- **Reset progress control** – Call-to-action that wipes session, review, and practice history with a confirmation dialog and descriptive warning copy.
- **Pre-exam checklist** – Washington-specific preparation list with card styling to mirror DMV requirements.
- **Responsive theming** – Custom palette layered on Bootstrap overrides (hero gradient, button states, calendar tokens) for consistent branding.
- **Accessibility considerations** – Semantic Bootstrap components, focus-visible buttons, and alt text for MUTCD sign assets.
- **UI test coverage** – Playwright test suite exercises hero/nav rendering and the reset modal in Chromium, Firefox, and WebKit through the shared config.

## Getting Started

```bash
npm install
npm run dev -- --debug
```

Vite serves the app on port `5173` by default (it falls back to the next available port if that one is busy).

### Environment variables

1. Duplicate `.env.example` to `.env`.
2. Optionally override `VITE_CLERK_PUBLISHABLE_KEY` with a different publishable key from your Clerk dashboard (Project settings → API keys). The repo ships with the DriveReady test key pre-configured, so local dev will work even if you skip this step.

The app logs a warning (and still runs) if you rely on the default key, but it will fail fast if neither the env var nor the fallback value is present.

## Available Scripts

- `npm run dev` – start the Vite dev server (append `-- --debug` to surface verbose logging)
- `npm run build` – create a production build
- `npm run preview` – preview the production build locally
- `npm run test:e2e` – run the Playwright UI test suite against a dev server
- `npm run test:e2e:report` – open the last Playwright HTML report

## UI Testing (Playwright)

Playwright drives real browsers (Chromium, Firefox, and WebKit) against the running Vite dev server.

1. Install the browser binaries once per machine:

```bash
npx playwright install
```

2. Run the test suite. The config auto-starts the dev server on port `4173`:

```bash
npm run test:e2e
```

3. Optionally inspect traces, screenshots, and videos via the HTML report:

```bash
npm run test:e2e:report
```

## Mock Exam Experience

- Washington pilot with exam stats, knowledge test simulator, road sign drills, and scenario labs
- Pre-exam checklist targeted at Washington driver testing requirements
- Feedback form that captures learner details, target exam month, and state context so we can improve the free resource

## Deployment

This repo ships automatically to GitHub Pages (user `hindol`, repo `drive-ready`). Pushes to the `main` branch trigger a workflow that builds the site and publishes the `dist/` bundle via the official Pages deployment pipeline.

### One-time setup

1. In the GitHub repo, go to **Settings → Pages** and set the source to “GitHub Actions”.
2. Ensure the `Actions → General` policy allows the `deploy.yml` workflow to deploy to the `github-pages` environment.

### Manual deploy or verification

Use the workflow dispatch button or run the build locally:

```bash
npm run build
```

The Vite config automatically switches its `base` path to `/drive-ready/` when the `GITHUB_PAGES=true` environment variable is present (the CI workflow handles this for you).

## Next Steps

- Log feedback submissions to your analytics or email pipeline
- Surface real performance data from completed mock exams
- Expand the content map to unlock additional states as curricula are finalised

## Authentication (Clerk)

DriveReady now mounts the React app inside Clerk’s provider and surfaces a modal “Admin sign in” button in the navbar. After signing in, a Clerk `UserButton` appears for quick account management. This is enough to begin protecting admin-only features; add `SignedIn` / `SignedOut` wrappers or Clerk hooks where you need to gate content.

## Assets & Licensing

- Favicon: “Steering wheel” by [sodruls](https://openclipart.org/detail/335908/steering-wheel) on Openclipart (public domain / CC0). Downloaded November 2025.
